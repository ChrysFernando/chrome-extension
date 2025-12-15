import "../global.css";
import { useState, useEffect } from 'react';

export const Popup = () => {
  const [dom, setDom] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  // Function to strip HTML tags and get clean text
  const stripHtmlTags = (html: string): string => {
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

  useEffect(() => {
    chrome.storage.local.get(['pageDom', 'pageUrl'], (result) => {
      if (result.pageDom) {
        setDom(result.pageDom);
        setTextContent(stripHtmlTags(result.pageDom));
        setUrl(result.pageUrl || '');
      }
      setLoading(false);
    });
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(showRaw ? dom : textContent);
    alert('Copied to clipboard!');
  };

  return (
    <div className="p-4 h-full overflow-hidden flex flex-col">
      <h1 className="text-xl font-bold mb-2">DOM Reader</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : dom ? (
        <>
          <p className="text-sm text-gray-600 mb-2 truncate">URL: {url}</p>
          <p className="text-sm mb-2">
            Length: {(showRaw ? dom : textContent).length.toLocaleString()} characters
          </p>
          
          <div className="flex gap-2 mb-2">
            <button 
              onClick={copyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Copy {showRaw ? 'HTML' : 'Text'}
            </button>
            <button 
              onClick={() => setShowRaw(!showRaw)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              {showRaw ? 'Show Text Only' : 'Show Raw HTML'}
            </button>
          </div>
          
          <pre className="text-xs bg-gray-100 p-2 overflow-auto flex-1 rounded whitespace-pre-wrap">
            {(showRaw ? dom : textContent).substring(0, 5000)}...
          </pre>
        </>
      ) : (
        <p className="text-gray-500">No DOM captured. Visit exely.com first, then open this popup.</p>
      )}
    </div>
  );
};