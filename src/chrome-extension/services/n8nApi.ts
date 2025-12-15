import axios from 'axios';

// Configure your n8n webhook URL
const N8N_WEBHOOK_URL = 'https://dangelo-acquirable-informally.ngrok-free.dev/webhook-test/chrome-capture';

interface DomData {
  url: string;
//   dom: string;
  textContent: string;
  timestamp: string;
}


export const sendDomToN8n = async (data: DomData) => {
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('N8N API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
    throw error;
  }
};