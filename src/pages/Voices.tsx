import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Play, Pause, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Voice } from '../types';
import { listVoices, generateSpeech } from '../lib/elevenlabs';
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
  const [voices, setVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      setLoading(true);
      try {
        const voicesData = await listVoices();
        setVoices(voicesData);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const togglePlayVoice = async (voice: Voice) => {
    try {
      if (playingVoiceId === voice.id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingVoiceId(null);
        return;
      }

      setIsGenerating(true);
      setPlayingVoiceId(voice.id);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Generate speech with custom text if provided
      const text = customText.trim() || 'Hello! I can help make your educational content more engaging.';
      const audioBuffer = await generateSpeech(text, voice.id);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
        URL.revokeObjectURL(url);
      });
      
      audioRef.current = audio;
      audio.play();
    } catch (error) {
      if (error instanceof Error) {
        setError(`Failed to generate speech: ${error.message}`);
      } else {
        setError('Failed to generate speech');
      }
      setPlayingVoiceId(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredVoices = searchQuery
    ? voices.filter(voice => 
        voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (voice.accent && voice.accent.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voice.gender && voice.gender.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : voices;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Voices</h1>
        <p className="text-slate-500">
          Browse and preview available AI voices for your characters
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Try the Voices</h2>
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
      
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search voices by name, accent, or gender..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </form>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
            <p className="text-lg font-medium text-slate-700">Loading voices...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredVoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-3">
            <Mic2 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-slate-900">No voices found</h3>
          <p className="max-w-md text-slate-500">
            No voices matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVoices.map((voice) => (
            <div 
              key={voice.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{voice.name}</h3>
                  <span className="text-sm text-slate-500">Voice Id: {voice.id}</span>
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
                onClick={() => togglePlayVoice(voice)}
                isLoading={isGenerating && playingVoiceId === voice.id}
                loadingText="Loading..."
                leftIcon={
                  !isGenerating && (
                    playingVoiceId === voice.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )
                  )
                }
              >
                {playingVoiceId === voice.id && !isGenerating ? 'Pause' : 'Preview'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};