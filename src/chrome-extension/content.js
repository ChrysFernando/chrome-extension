// content.js
console.log("DOM Reader Extension: Content script loaded");

const N8N_WEBHOOK_URL = 'https://dangelo-acquirable-informally.ngrok-free.dev/webhook-test/chrome-capture';

const stripHtmlTags = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  // Get text content
  let text = doc.body.textContent || '';
  
  // Clean up whitespace (multiple spaces/newlines to single)
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

async function sendToN8n(url, textContent) {
  console.log("Sending data to n8n...");
  console.log("Webhook URL:", N8N_WEBHOOK_URL);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        textContent: textContent,
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

// Wait for page to fully load
window.addEventListener('load', async () => {
  console.log("Page fully loaded, getting DOM...");
  
  const dom = document.documentElement.outerHTML;
  const textContent = stripHtmlTags(dom);
  
  console.log("DOM length:", dom.length, "characters");
  console.log("Text content length:", textContent.length, "characters");
  
  // Log first 500 characters as preview
  console.log("DOM preview:", dom.substring(0, 500));
  
  // Store in chrome storage for popup to access
  chrome.storage.local.set({ 
    pageDom: dom,
    pageUrl: window.location.href 
  }, () => {
    console.log("DOM saved to storage");
  });

  // Send to n8n automatically after DOM is loaded
  console.log("🚀 About to send to n8n...");
  const result = await sendToN8n(window.location.href, textContent);
  
  if (result.success) {
    console.log("Successfully sent to n8n!");
    console.log("Response:", result.data);
  } else {
    console.log("Failed to send to n8n:", result.error);
  }
});