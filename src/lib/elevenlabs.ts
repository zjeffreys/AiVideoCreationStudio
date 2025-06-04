import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { Voice } from '../types';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const HARDCODED_VOICE_IDS = [
  'PcHg6574SeVenDJODonO',
  'mysUMLrLaXJqfLoz2xTV',
  // 'NOpBlnGInO9m6vDvFkFC',
  'flHkNRp1BlvT73UL6gyz'
];

export const getVoice = async (): Promise<Voice[]> => {
  try {
    const voices: Voice[] = [];

    for (const voiceId of HARDCODED_VOICE_IDS) {
      try {
        // Fetch each voice by its ID
        const voiceDetails = await elevenlabs.voices.get(voiceId) as any; // Use 'any' temporarily for flexible mapping

        // Map the API response to our internal Voice type, using the hardcoded voiceId
        voices.push({
          id: voiceId, // Use the hardcoded voiceId for id
          voiceId: voiceId, // Use the hardcoded voiceId for voiceId
          name: voiceDetails.name || 'Unknown Voice', // Use name from API, fallback to default
          description: voiceDetails.labels?.description || undefined,
          preview_url: voiceDetails.preview_url,
          gender: voiceDetails.labels?.gender as 'male' | 'female' | 'neutral' | undefined,
          accent: voiceDetails.labels?.accent,
          labels: voiceDetails.labels
        });
      } catch (error) {
        console.error(`Error fetching details for voice ID ${voiceId}:`, error);
        // If fetching details fails, we can still create a basic voice object with the hardcoded ID
         voices.push({
          id: voiceId,
          voiceId: voiceId,
          name: `Voice ${voiceId.substring(0, 6)}...`, // Use a truncated ID as a fallback name
          description: 'Could not fetch voice details.',
          preview_url: undefined,
          gender: undefined,
          accent: undefined,
          labels: undefined
        });
      }
    }

    return voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your ElevenLabs API key.');
      } else if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('404')) {
         // Handle 404 specifically if a hardcoded ID is not found on ElevenLabs
         console.error('One of the hardcoded voice IDs was not found on ElevenLabs.');
         // Depending on requirements, you might throw here or just return the voices that were found
      }
    }
    throw new Error('Failed to fetch voices. Please try again.');
  }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<string> => {
  if (!text.trim()) {
    throw new Error('Text is required');
  }

  try {
    const response = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128'
    });

    // Convert the Readable stream to a Uint8Array
    const chunks: Uint8Array[] = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }
    
    // Calculate total length and create a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const blob = new Blob([result], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating speech:', error);
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your ElevenLabs API key.');
      } else if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
    }
    throw new Error('Failed to generate speech. Please try again.');
  }
};