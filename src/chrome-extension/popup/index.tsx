import "../global.css";
import { useState, useEffect } from 'react';
import { sendDomToN8n } from '../services/n8nApi';

export const Popup = () => {
  const [dom, setDom] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('');

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

  // const sendToN8n = async () => {
  //   setSending(true);
  //   setApiStatus('Sending...');
    
  //   try {
  //     const result = await sendDomToN8n({
  //       url: url,
  //       dom: dom,
  //       textContent: textContent,
  //       timestamp: new Date().toISOString()
  //     });

  //     if (result.success) {
  //       setApiStatus('✅ Successfully sent to n8n!');
  //       setTimeout(() => setApiStatus(''), 3000);
  //     } else {
  //       setApiStatus(`❌ Error: ${result.error}`);
  //     }
  //   } catch (error) {
  //     setApiStatus(`❌ Failed to send: ${error}`);
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const sendToN8n = async () => {
  setSending(true);
  setApiStatus('Sending...');
  
  try {
    const result = await sendDomToN8n({
      url: url,
      textContent: textContent,  // Only sending stripped text
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      setApiStatus('✅ Successfully sent to n8n!');
      setTimeout(() => setApiStatus(''), 3000);
    } else {
      setApiStatus(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    setApiStatus(`❌ Failed to send: ${error}`);
  } finally {
    setSending(false);
  }
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
          
          <div className="flex gap-2 mb-2 flex-wrap">
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
            <button 
              onClick={sendToN8n}
              disabled={sending}
              className={`${
                sending 
                  ? 'bg-green-300' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-4 py-2 rounded disabled:cursor-not-allowed`}
            >
              {sending ? 'Sending...' : 'Send to n8n'}
            </button>
          </div>
          
          {apiStatus && (
            <div className="text-sm mb-2 p-2 bg-gray-100 rounded">
              {apiStatus}
            </div>
          )}
          
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