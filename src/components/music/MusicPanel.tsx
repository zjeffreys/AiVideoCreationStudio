import React, { useState } from 'react';
import { Upload, Music, Play, Pause } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

import type { UserMusic } from '../../lib/music';

type MusicPanelProps = {
  onAddMusic: (file: File) => void;
  onRemoveMusic: (id: string) => void;
  tracks: UserMusic[];
  onTrackSelect: (track: UserMusic) => void;
};

type TabType = 'upload';

export const MusicPanel: React.FC<MusicPanelProps> = ({
  onAddMusic,
  onRemoveMusic,
  tracks,
  onTrackSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab] = useState<TabType>('upload');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      onAddMusic(audioFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddMusic(files[0]);
    }
  };

  const handlePlayPause = async (track: UserMusic) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setSignedUrl(null);
    } else {
      const filePath = track.file_path.split('/user-music/')[1] || track.file_path;
      const { data, error } = await supabase.storage.from('user-music').createSignedUrl(filePath, 60);
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        setPlayingId(track.id);
      } else {
        setSignedUrl(null);
        setPlayingId(null);
      }
    }
  };

  React.useEffect(() => {
    if (!playingId || !signedUrl) {
      audioRef.current?.pause();
      return;
    }
    audioRef.current?.setAttribute('src', signedUrl);
    audioRef.current?.play();
  }, [playingId, signedUrl]);

  // Pause audio when unmounting
  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const renderTabContent = () => {
    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
          isDragging 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-slate-300 dark:border-slate-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="audio/*"
          onChange={handleFileInput}
        />
        <Upload className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Drag and drop audio files here, or{' '}
          <button
            className="text-purple-600 dark:text-purple-400 hover:underline"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Supported formats: MP3, WAV, M4A
        </p>
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
      <h2 className="p-4 font-bold text-slate-700 dark:text-white">Music Tracks</h2>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`group relative bg-slate-100 dark:bg-slate-900 rounded-lg p-3 flex items-center gap-2 ${playingId === track.id ? 'ring-2 ring-purple-400' : ''} cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors`}
            >
              <button
                className="mr-2 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                onClick={async e => {
                  e.stopPropagation();
                  await handlePlayPause(track);
                }}
                aria-label={playingId === track.id ? 'Pause' : 'Play'}
              >
                {playingId === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                  <Music className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-white truncate">
                    {track.file_path.split('/').pop() || 'Untitled'}
                  </p>
                </div>
              </div>
              <button
                className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMusic(track.id);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          {tracks.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No music tracks added yet</p>
              <p className="text-xs mt-1">Add music to enhance your video</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {renderTabContent()}
      </div>
      {/* Hidden audio element for preview playback */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
    </div>
  );
}; 