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

  // Function to get Asia/Colombo time
  const getColomboTime = (): string => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const sendToN8n = async (urlToSend: string, textToSend: string) => {
    setSending(true);
    setApiStatus('Sending...');
    
    try {
      const colomboTime = getColomboTime();
      
      const result = await sendDomToN8n({
        url: urlToSend,
        textContent: textToSend,
        timestamp: new Date().toISOString(),
        colomboTime: colomboTime  // Asia/Colombo time added
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

  useEffect(() => {
    chrome.storage.local.get(['pageDom', 'pageUrl'], (result) => {
      if (result.pageDom) {
        const domContent = result.pageDom;
        const text = stripHtmlTags(domContent);
        const pageUrl = result.pageUrl || '';
        
        setDom(domContent);
        setTextContent(text);
        setUrl(pageUrl);
        
        // Auto-send on load
        sendToN8n(pageUrl, text);
      }
      setLoading(false);
    });
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(showRaw ? dom : textContent);
    alert('Copied to clipboard!');
  };

  const handleManualSend = () => {
    sendToN8n(url, textContent);
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
              onClick={handleManualSend}
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