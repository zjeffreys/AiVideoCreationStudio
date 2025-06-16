import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Play, Pause } from 'lucide-react';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Voice } from '../../types';
import { getVoice, generateSpeech } from '../../lib/elevenlabs';
import { useAuth } from '../../context/AuthContext';

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

interface VoicesPanelProps {
  onVoiceSelect: (voice: Voice) => void;
  selectedVoice: Voice | null;
}

export const VoicesPanel: React.FC<VoicesPanelProps> = ({ onVoiceSelect, selectedVoice }) => {
  const { user } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
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
        const voiceData = await getVoice();
        setVoices(voiceData);
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

  const togglePlayVoice = async (voice: Voice) => {
    if (!voice.voiceId) {
      console.error("Voice object is missing voiceId.", voice);
      setError("Voice data is incomplete.");
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
      
      const blobUrl = await generateSpeech(text, voice.voiceId);

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
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Voices</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voices.map((voice) => (
              <div
                key={voice.voiceId}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-purple-500 ${
                  selectedVoice?.voiceId === voice.voiceId
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-700'
                }`}
                onClick={() => onVoiceSelect(voice)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{voice.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {voice.gender && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
                        </span>
                      )}
                      {voice.accent && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {voice.accent}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayVoice(voice);
                    }}
                    isLoading={isGenerating}
                    loadingText=""
                    className="p-1"
                  >
                    {!isGenerating && (
                      isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <Select
          label="Language"
          options={LANGUAGES}
          value={selectedLanguage}
          onChange={setSelectedLanguage}
          fullWidth
          className="bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
        <Textarea
          label="Preview Text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Enter text to preview"
          fullWidth
          className="bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}; 