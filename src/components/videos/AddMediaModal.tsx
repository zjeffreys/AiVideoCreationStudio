import React, { useState } from 'react';
import { X, Video, Mic, Music } from 'lucide-react';
import type { Video as VideoType, Voice, MusicTrack } from '../../types';

// Define SceneVideo locally (copied from VideoPanel)
interface SceneVideo extends VideoType {
  file: File;
  localUrl: string;
  id: string;
  title: string;
  thumbnail_url?: string;
}

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId: string;
  onAddClip: (clip: SceneVideo) => void;
  onAddVoice: (voice: Voice) => void;
  onAddMusic: (track: MusicTrack) => void;
  availableClips: SceneVideo[];
  availableVoices: Voice[];
  availableMusic: MusicTrack[];
  tabs: { id: string; label: string; icon: React.ReactNode }[];
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  sceneId,
  onAddClip,
  onAddVoice,
  onAddMusic,
  availableClips,
  availableVoices,
  availableMusic,
  tabs
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'clips');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add Media to Scene {sceneId}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
          <div className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="h-[400px] overflow-y-auto">
          {activeTab === 'clips' && (
            <div className="grid grid-cols-3 gap-4">
              {availableClips.map(clip => (
                <div
                  key={clip.id}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    onAddClip(clip);
                    onClose();
                  }}
                >
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                    {clip.thumbnail_url ? (
                      <img
                        src={clip.thumbnail_url}
                        alt={clip.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-white truncate">
                    {clip.title}
                  </p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'voices' && (
            <div className="space-y-4">
              {availableVoices.map(voice => (
                <div
                  key={voice.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => {
                    onAddVoice(voice);
                    onClose();
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{voice.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{voice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'music' && (
            <div className="space-y-4">
              {availableMusic.map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => {
                    onAddMusic(track);
                    onClose();
                  }}
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <Music className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{track.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{track.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 