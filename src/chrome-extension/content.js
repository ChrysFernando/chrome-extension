// content.js
console.log("DOM Reader Extension: Content script loaded");

// Wait for page to fully load
window.addEventListener('load', () => {
  console.log("Page fully loaded, getting DOM...");
  
  const dom = document.documentElement.outerHTML;
  console.log("DOM length:", dom.length, "characters");
  
  // Log first 500 characters as preview
  console.log("DOM preview:", dom.substring(0, 500));
  
  // Store in chrome storage for popup to access
  chrome.storage.local.set({ 
    pageDom: dom,
    pageUrl: window.location.href 
  }, () => {
    console.log("DOM saved to storage");
  });
});