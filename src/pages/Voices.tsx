import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Play, Pause, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Voice } from '../types';
import { getVoice, generateSpeech } from '../lib/elevenlabs';
import { useAuth } from '../context/AuthContext';

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
  const [voice, setVoice] = useState<Voice | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoice = async () => {
      setLoading(true);
      try {
        const voiceData = await getVoice();
        setVoice(voiceData);
        setError(null);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to load voice. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchVoice();
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
    if (!voice) return;

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
      const blobUrl = await generateSpeech(text, voice.voiceId);

      const audio = new Audio(blobUrl);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(blobUrl);
      });

      audioRef.current = audio;
      audio.play();
    } catch (error) {
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
        <h1 className="text-3xl font-bold text-slate-900">Voice Preview</h1>
        <p className="text-slate-500">
          Preview and test the AI voice for your educational content
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Try the Voice</h2>
        <div className="space-y-4">
          <Select
            label="Language"
            options={LANGUAGES}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            fullWidth
          />
          <Textarea
            label="Custom Text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter text for the voice to speak (optional)"
            fullWidth
          />
          <p className="text-sm text-slate-500">
            If no text is provided, a default greeting will be used.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
            <p className="text-lg font-medium text-slate-700">Loading voice...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : voice ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900">{voice.name}</h3>
                <span className="text-sm text-slate-500">Voice Id: {voice.voiceId}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                {voice.gender && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                  </span>
                )}
                {voice.accent && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {voice.accent}
                  </span>
                )}
              </div>
              {voice.description && (
                <p className="mt-2 text-sm text-slate-600">{voice.description}</p>
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
                  isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                )
              }
            >
              {isPlaying && !isGenerating ? 'Pause' : 'Preview'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-3">
            <Mic2 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-slate-900">No voice found</h3>
          <p className="max-w-md text-slate-500">
            Unable to load the voice. Please check your configuration and try again.
          </p>
        </div>
      )}
    </div>
  );
};