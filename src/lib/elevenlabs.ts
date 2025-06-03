import { ElevenLabs } from '@elevenlabs/elevenlabs-js';
import type { Voice } from '../types';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

const elevenlabs = new ElevenLabs({
  apiKey: ELEVENLABS_API_KEY,
});

export const listVoices = async (): Promise<Voice[]> => {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || undefined,
      preview_url: voice.preview_url,
      gender: voice.labels?.gender?.toLowerCase() as 'male' | 'female' | 'neutral',
      accent: voice.labels?.accent
    }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<ArrayBuffer> => {
  try {
    const audioBuffer = await elevenlabs.generate({
      text,
      voice_id: voiceId,
      model_id: 'eleven_monolingual_v1'
    });
    return audioBuffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};