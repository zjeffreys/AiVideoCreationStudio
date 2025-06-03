const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

export const enhanceDescription = async (description: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing engaging educational video descriptions. Enhance the given description to be more detailed, engaging, and SEO-friendly while maintaining the original intent.'
          },
          {
            role: 'user',
            content: `Please enhance this educational video description: "${description}"`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error enhancing description:', error);
    throw error;
  }
};