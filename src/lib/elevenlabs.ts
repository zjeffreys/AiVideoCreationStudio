import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { Voice } from '../types';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const HARDCODED_VOICE_ID = 'PcHg6574SeVenDJODonO';

export const getVoice = async (): Promise<Voice> => {
  return {
    id: HARDCODED_VOICE_ID,
    voiceId: HARDCODED_VOICE_ID,
    name: "Rachel",
    description: "A warm and professional female voice perfect for educational content",
    preview_url: undefined,
    gender: "female",
    accent: "American",
    labels: {
      gender: "female",
      accent: "American"
    }
  };
};

export const generateSpeech = async (text: string, voiceId: string): Promise<string> => {
  if (!voiceId) {
    throw new Error('Voice ID is required');
  }

  if (!text.trim()) {
    throw new Error('Text is required');
  }

  try {
    const response = await elevenlabs.textToSpeech(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128'
    });

    const blob = new Blob([response], { type: 'audio/mpeg' });
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