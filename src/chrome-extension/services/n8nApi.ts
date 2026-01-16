interface DomData {
  url: string;
  textContent: string;
  timestamp: string;
  colomboTime: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

export const sendDomToN8n = async (data: DomData): Promise<ApiResponse> => {
  try {
    const response = await fetch('https://automation.taskforceai.tech/webhook/exely', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
};