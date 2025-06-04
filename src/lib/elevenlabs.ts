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
    console.log(voices)
    return voices.map(voice => ({
      id: voice.voiceId,
      voice_id: voice.voiceId,
      name: voice.name,
      description: voice.description || undefined,
      preview_url: voice.preview_url,
      gender: voice.labels?.gender?.toLowerCase() as 'male' | 'female' | 'neutral',
      accent: voice.labels?.accent,
      labels: voice.labels
    }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw new Error('Failed to fetch voices. Please check your API key and try again.');
  }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<ArrayBuffer> => {
  console.log("generateSpeech()", text, voiceId)
  if (!voiceId) {
    throw new Error('Voice ID is required');
  }

  if (!text.trim()) {
    throw new Error('Text is required');
  }

  try {

    /*testing code*/
    const client = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });
await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
    output_format: "mp3_44100_128",
    text: "The first move is what sets everything in motion.",
    model_id: "eleven_multilingual_v2"
});
Try
    /*end of testing */
    const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
    const response = await client.textToSpeech.convert(voiceId, {
    output_format: "mp3_44100_128",
    text: text,
    model_id: "eleven_multilingual_v2"
});
    /* redo */
    // const response = await elevenlabs.textToSpeech({
    //   voiceId,
    //   text,
    //   modelId: 'eleven_flash_v2_5',
    //   outputFormat: 'mp3_44100_128'
    // });

    return response;
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