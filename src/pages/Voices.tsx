import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Play, Pause, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Voice } from '../types';
import { listVoices } from '../lib/elevenlabs';

export const Voices = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
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
    // Cleanup audio on unmount
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

  const togglePlayVoice = (voice: Voice) => {
    if (!voice.preview_url) {
      console.error('No preview URL available for this voice');
      return;
    }

    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(voice.preview_url);
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
      });
      audio.play();
      audioRef.current = audio;
      setPlayingVoiceId(voice.id);
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
                <h3 className="font-medium text-slate-900">{voice.name}</h3>
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
                leftIcon={
                  playingVoiceId === voice.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                }
                disabled={!voice.preview_url}
              >
                {playingVoiceId === voice.id ? 'Pause' : 'Preview'}
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">About Voice Technology</h2>
        <p className="text-slate-600">
          Our platform uses ElevenLabs' state-of-the-art voice synthesis technology to create natural-sounding
          voices for your educational videos. Each voice has been carefully designed to deliver clear,
          engaging narration for your content.
        </p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-slate-900">Voice Best Practices</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
            <li>Choose voices that match your character's personality and teaching style</li>
            <li>Select appropriate accents based on your target audience</li>
            <li>Use consistent voices across related video series for better recognition</li>
            <li>Consider the age and subject matter when selecting voice types</li>
          </ul>
        </div>
      </div>
    </div>
  );
};