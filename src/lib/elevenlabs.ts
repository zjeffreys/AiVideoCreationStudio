import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { Voice } from '../types';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export const listVoices = async (): Promise<Voice[]> => {
  try {
    const { voices } = await elevenlabs.voices.getAll();
    return voices.map(voice => ({
      id: voice.voice_id,
      voice_id: voice.voice_id,
      name: voice.name,
      description: voice.description || undefined,
      preview_url: voice.previewUrl,
      gender: voice.labels?.gender?.toLowerCase() as 'male' | 'female' | 'neutral',
      accent: voice.labels?.accent,
      labels: voice.labels
    }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw new Error('Failed to fetch voices. Please check your API key and try again.');
  }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<string> => {
  if (!voiceId) {
    throw new Error('Voice ID is required');
  }

  if (!text.trim()) {
    throw new Error('Text is required');
  }

  try {
    // Get the audio stream from ElevenLabs
    const audioStream = await elevenlabs.generate({
      text: text,
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });

    // Convert the stream to a blob
    const audioBlob = new Blob([await audioStream.arrayBuffer()], { 
      type: 'audio/mpeg' 
    });

    // Create and return a URL for the blob
    return URL.createObjectURL(audioBlob);
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