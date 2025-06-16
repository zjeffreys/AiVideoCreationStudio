import React, { useState } from 'react';
import { Upload, Sparkles, Music, Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration: string;
  file: File;
  localUrl: string;
}

type MusicPanelProps = {
  onAddMusic: (file: File) => void;
  onRemoveMusic: (id: string) => void;
  tracks: MusicTrack[];
  onTrackSelect: (track: MusicTrack) => void;
};

type TabType = 'upload' | 'ai' | 'stock';

export const MusicPanel: React.FC<MusicPanelProps> = ({
  onAddMusic,
  onRemoveMusic,
  tracks,
  onTrackSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
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
      case 'ai':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Generate Music with AI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Describe the mood and style of music you want to create.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mood</label>
                  <select className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300">
                    <option>Happy</option>
                    <option>Sad</option>
                    <option>Energetic</option>
                    <option>Calm</option>
                    <option>Dramatic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Style</label>
                  <select className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300">
                    <option>Pop</option>
                    <option>Rock</option>
                    <option>Classical</option>
                    <option>Electronic</option>
                    <option>Ambient</option>
                  </select>
                </div>
                <textarea
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300 resize-none"
                  rows={3}
                  placeholder="Additional details about the music you want..."
                />
                <Button className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                  Generate Music
                </Button>
              </div>
            </div>
          </div>
        );
      case 'stock':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stock Music</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Browse our library of royalty-free music tracks.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300"
                    placeholder="Search music by mood, style, or keywords..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" leftIcon={<Music className="h-4 w-4" />}>
                    Browse All
                  </Button>
                  <Button variant="outline" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                    AI Match
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
      <h2 className="p-4 font-bold text-slate-700 dark:text-white">Music Tracks</h2>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="group relative bg-slate-100 dark:bg-slate-900 rounded-lg p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              onClick={() => onTrackSelect(track)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                  <Music className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{track.title}</p>
                  {track.artist && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">{track.duration}</p>
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
        <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('stock')}
          >
            <Music className="h-4 w-4" />
            Stock
          </button>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}; 