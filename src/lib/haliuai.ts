const HALIUAI_API_KEY = import.meta.env.VITE_HALIUAI_API_KEY;
const HALIUAI_API_URL = 'https://api.haliuai.com/v1';

if (!HALIUAI_API_KEY) {
  throw new Error('Missing HaliuAI API key');
}

interface GenerateVideoParams {
  script: string;
  style?: string;
  duration?: number;
}

export const generateVideo = async ({ script, style = 'educational', duration = 6 }: GenerateVideoParams) => {
  try {
    const response = await fetch(`${HALIUAI_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HALIUAI_API_KEY}`,
      },
      body: JSON.stringify({
        script,
        style,
        duration,
      }),
    });

    if (!response.ok) {
      throw new Error(`HaliuAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
};

export const getVideoStatus = async (videoId: string) => {
  try {
    const response = await fetch(`${HALIUAI_API_URL}/status/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${HALIUAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HaliuAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking video status:', error);
    throw error;
  }
};