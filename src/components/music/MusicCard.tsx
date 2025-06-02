import React, { useState } from 'react';
import { Play, Pause, Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MusicStyle } from '../../types';
import { supabase } from '../../lib/supabase';

type MusicCardProps = {
  music: MusicStyle;
  onFavoriteToggle: (id: string, isFavorite: boolean) => void;
};

export const MusicCard: React.FC<MusicCardProps> = ({ 
  music, 
  onFavoriteToggle 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(music.is_favorite);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would trigger audio playback
  };

  const toggleFavorite = async () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    onFavoriteToggle(music.id, newFavoriteState);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-1 items-center gap-4">
        <button
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isPlaying 
              ? "bg-purple-600 text-white" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        
        <div>
          <h3 className="font-medium text-slate-900">{music.name}</h3>
          {music.description && (
            <p className="text-sm text-slate-500">{music.description}</p>
          )}
        </div>
      </div>
      
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          isFavorite 
            ? "text-yellow-500 hover:text-yellow-600" 
            : "text-slate-400 hover:text-slate-500"
        )}
        onClick={toggleFavorite}
      >
        <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
      </button>
    </div>
  );
};