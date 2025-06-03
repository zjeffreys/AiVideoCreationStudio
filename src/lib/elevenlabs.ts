import { Voice, VoiceSettings } from 'elevenlabs';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key');
}

export const elevenlabs = new Voice({
  apiKey: ELEVENLABS_API_KEY,
});

export const defaultVoiceSettings: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
};

export const generateSpeech = async (text: string, voiceId: string) => {
  try {
    const audioBuffer = await elevenlabs.textToSpeech(voiceId, text, defaultVoiceSettings);
    return audioBuffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

export const listVoices = async () => {
  try {
    const voices = await elevenlabs.getVoices();
    return voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};