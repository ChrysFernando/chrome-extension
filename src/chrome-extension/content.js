// content.js
console.log("DOM Reader Extension: Content script loaded");

const N8N_WEBHOOK_URL = 'https://automation.taskforceai.tech/webhook/exely';

const stripHtmlTags = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  let text = doc.body.textContent || '';
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

// Recursively extract content from iframes
const extractIframeContent = (doc = document, level = 0) => {
  let content = {
    html: doc.documentElement ? doc.documentElement.outerHTML : '',
    text: '',
    iframes: []
  };
  
  try {
    content.text = stripHtmlTags(content.html);
    const iframes = doc.querySelectorAll('iframe');
    console.log(`Level ${level}: Found ${iframes.length} iframe(s)`);
    
    iframes.forEach((iframe, index) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          console.log(`Level ${level}, iframe ${index}: Accessible - ${iframe.src || 'about:blank'}`);
          const iframeContent = extractIframeContent(iframeDoc, level + 1);
          
          content.iframes.push({
            src: iframe.src || 'about:blank',
            id: iframe.id,
            className: iframe.className,
            level: level,
            index: index,
            ...iframeContent
          });
        } else {
          console.log(`Level ${level}, iframe ${index}: Not accessible (cross-origin) - ${iframe.src}`);
          content.iframes.push({
            src: iframe.src,
            id: iframe.id,
            className: iframe.className,
            level: level,
            index: index,
            accessible: false,
            error: 'Cross-origin iframe'
          });
        }
      } catch (error) {
        console.error(`Level ${level}, iframe ${index} error:`, error.message);
        content.iframes.push({
          src: iframe.src,
          level: level,
          index: index,
          accessible: false,
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error(`Error at level ${level}:`, error);
  }
  
  return content;
};

const combineAllText = (contentObj) => {
  let allText = contentObj.text || '';
  
  if (contentObj.iframes && contentObj.iframes.length > 0) {
    contentObj.iframes.forEach(iframe => {
      if (iframe.text) {
        allText += '\n\n--- IFRAME CONTENT (src: ' + iframe.src + ') ---\n' + iframe.text;
      }
      if (iframe.iframes && iframe.iframes.length > 0) {
        allText += combineAllText(iframe);
      }
    });
  }
  
  return allText;
};

async function sendToN8n(url, textContent, fullContentStructure) {
  console.log("Sending data to n8n...");
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        textContent: textContent,
        contentStructure: fullContentStructure,
        timestamp: new Date().toISOString()
      })
    });

    console.log("Response status:", response.status);
    const responseData = await response.json();
    console.log("Response data:", responseData);
    
    return {
      success: true,
      data: responseData,
      status: response.status
    };
  } catch (error) {
    console.error('N8N API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Extract and send content
const captureAndSend = async () => {
  console.log("📸 Capturing DOM with iframes...");
  
  const fullContent = extractIframeContent(document, 0);
  const combinedText = combineAllText(fullContent);
  
  console.log("Main DOM length:", fullContent.html.length, "characters");
  console.log("Total iframes found:", fullContent.iframes.length);
  console.log("Combined text length:", combinedText.length, "characters");
  
  chrome.storage.local.set({ 
    pageDom: fullContent.html,
    pageUrl: window.location.href,
    fullContentStructure: fullContent,
    combinedText: combinedText
  }, () => {
    console.log("DOM and iframe content saved to storage");
  });

  console.log("🚀 Sending to n8n...");
  const result = await sendToN8n(window.location.href, combinedText, fullContent);
  
  if (result.success) {
    console.log("✅ Successfully sent to n8n!");
  } else {
    console.log("❌ Failed to send to n8n:", result.error);
  }
};

// Monitor for dynamically added iframes
const observeIframes = () => {
  let timeoutId;
  
  const observer = new MutationObserver((mutations) => {
    const hasNewIframes = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => 
        node.tagName === 'IFRAME' || 
        (node.querySelectorAll && node.querySelectorAll('iframe').length > 0)
      );
    });
    
    if (hasNewIframes) {
      console.log("🔄 New iframe detected, recapturing...");
      clearTimeout(timeoutId);
      timeoutId = setTimeout(captureAndSend, 1000); // Debounce
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};

// Initial capture after page load
window.addEventListener('load', async () => {
  console.log("Page loaded, waiting for dynamic content...");
  
  // Wait for React/Vue/Angular to render (adjust timing as needed)
  setTimeout(async () => {
    await captureAndSend();
    
    // Start observing for new iframes
    observeIframes();
    console.log("👀 Now monitoring for dynamically added iframes...");
  }, 3000); // Wait 3 seconds for SPA to render
});

// Fallback: Also try on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(captureAndSend, 3000);
  });
} else {
  // Document already loaded
  setTimeout(captureAndSend, 3000);
}
