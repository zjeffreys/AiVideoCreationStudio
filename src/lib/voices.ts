import { Voice } from '../types';

// These are the hardcoded voice IDs from elevenlabs.ts
export const VOICE_IDS = [
  'PcHg6574SeVenDJODonO',
  'mysUMLrLaXJqfLoz2xTV',
  'flHkNRp1BlvT73UL6gyz',
  'i0PqiZmVh7rJEXnK55fF',
  'kH1M7u1IXE6LlQULmZ3Y'
] as const;

// Default voice configurations that will be used when the API call fails
export const DEFAULT_VOICES: Voice[] = [
  {
    id: 'PcHg6574SeVenDJODonO',
    voiceId: 'PcHg6574SeVenDJODonO'
  },
  {
    id: 'mysUMLrLaXJqfLoz2xTV',
    voiceId: 'mysUMLrLaXJqfLoz2xTV'
  },
  {
    id: 'flHkNRp1BlvT73UL6gyz',
    voiceId: 'flHkNRp1BlvT73UL6gyz'
  },
  {
    id: 'i0PqiZmVh7rJEXnK55fF',
    voiceId: 'i0PqiZmVh7rJEXnK55fF'
  },
  {
    id: 'kH1M7u1IXE6LlQULmZ3Y',
    voiceId: 'kH1M7u1IXE6LlQULmZ3Y'
  }
]; 