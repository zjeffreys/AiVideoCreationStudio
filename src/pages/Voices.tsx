import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Play, Pause } from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Voice } from '../types';
import { getVoice, generateSpeech } from '../lib/elevenlabs';
import { useAuth } from '../context/AuthContext';

// Define the hardcoded IDs directly in Voices.tsx as well for initial selection reliability
const HARDCODED_VOICE_IDS_CLIENT = [
  'PcHg6574SeVenDJODonO',
  'mysUMLrLaXJqfLoz2xTV',
  'NOpBlnGInO9m6vDvFkFC',
  'flHkNRp1BlvT73UL6gyz'
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pl', label: 'Polish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ja', label: 'Japanese' }
];

export const Voices = () => {
  const { user } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      setLoading(true);
      try {
        const voiceData = await getVoice(); // This should now return Voices with correct IDs
        setVoices(voiceData);
        
        // Find and set the first voice that matches a hardcoded ID
        const initialVoice = voiceData.find(v => HARDCODED_VOICE_IDS_CLIENT.includes(v.voiceId));
        if (initialVoice) {
          setSelectedVoice(initialVoice);
        } else if (voiceData.length > 0) {
           // Fallback: if no hardcoded voices are found, select the first available voice
           setSelectedVoice(voiceData[0]);
        }
        
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to load voices. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayVoice = async () => {
    if (!selectedVoice) {
      console.error("No voice selected to generate speech.");
      // You might want to show a user-facing error message here as well
      return;
    }

    // Ensure selectedVoice.voiceId is not undefined before calling generateSpeech (redundant with fix in getVoice, but safe)
    if (!selectedVoice.voiceId) {
       console.error("Selected voice object is missing voiceId.", selectedVoice);
       setError("Selected voice data is incomplete.");
       return;
    }

    try {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlaying(false);
        return;
      }

      setIsGenerating(true);
      setIsPlaying(true);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const text = customText.trim() || 'Hello! I can help make your educational content more engaging.';
      
      const blobUrl = await generateSpeech(text, selectedVoice.voiceId);

      const audio = new Audio(blobUrl);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(blobUrl);
      });

      audioRef.current = audio;
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      if (error instanceof Error) {
        setError(`Failed to generate speech: ${error.message}`);
      } else {
        setError('Failed to generate speech');
      }
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-white">Voice Preview</h1>
        <p className="text-slate-300">
          Preview and test the AI voices for your educational content
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Try the Voice</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {voices.map((voice) => (
              <div
                key={voice.voiceId}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-purple-500 ${
                  selectedVoice?.voiceId === voice.voiceId
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-700'
                }`}
                onClick={() => setSelectedVoice(voice)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{voice.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {voice.gender && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                        </span>
                      )}
                      {voice.accent && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {voice.accent}
                        </span>
                      )}
                    </div>
                    {voice.description && (
                      <p className="mt-2 text-sm text-slate-400">{voice.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Select
            label="Language"
            options={LANGUAGES}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            fullWidth
            className="bg-slate-800 border-slate-700 text-white"
          />
          <Textarea
            label="Custom Text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter text for the voice to speak (optional)"
            fullWidth
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
          <p className="text-sm text-slate-400">
            If no text is provided, a default greeting will be used.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
            <p className="text-lg font-medium text-slate-300">Loading voices...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : selectedVoice ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{selectedVoice.name}</h3>
                <span className="text-sm text-slate-400">Voice Id: {selectedVoice.voiceId}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                {selectedVoice.gender && (
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    {selectedVoice.gender.charAt(0).toUpperCase() + selectedVoice.gender.slice(1)}
                  </span>
                )}
                {selectedVoice.accent && (
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    {selectedVoice.accent}
                  </span>
                )}
              </div>
              {selectedVoice.description && (
                <p className="mt-2 text-sm text-slate-400">{selectedVoice.description}</p>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayVoice}
              isLoading={isGenerating}
              loadingText="Loading..."
              leftIcon={
                !isGenerating && (
                  (isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />)
                )
              }
              className="border-slate-700 text-white hover:bg-slate-700"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-700 p-3">
            <Mic2 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-white">No voices available</h3>
          <p className="mb-4 max-w-md text-slate-400">
            We couldn't load any voices. Please check your internet connection or try again later.
          </p>
        </div>
      )}
    </div>
  );
};