import React, { useState, useEffect } from 'react';
import { Music, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { MusicCard } from '../components/music/MusicCard';
import { MusicStyle } from '../types';

export const MusicPage = () => {
  const { user } = useAuth();
  const [musicStyles, setMusicStyles] = useState<MusicStyle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMusicStyles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch music styles from your API or Supabase
      // Here we'll simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMusicStyles: MusicStyle[] = [
        { id: 'm1', name: 'Inspiring', description: 'Uplifting and motivational background music', is_favorite: false },
        { id: 'm2', name: 'Chill', description: 'Relaxed and calm ambient sounds', is_favorite: true },
        { id: 'm3', name: 'Suspense', description: 'Create tension and anticipation', is_favorite: false },
        { id: 'm4', name: 'Playful', description: 'Fun and energetic tunes for children\'s content', is_favorite: false },
        { id: 'm5', name: 'Cinematic', description: 'Epic orchestral scores for dramatic moments', is_favorite: true },
        { id: 'm6', name: 'Educational', description: 'Neutral background music that enhances learning', is_favorite: false },
        { id: 'm7', name: 'Corporate', description: 'Professional and clean background tracks', is_favorite: false },
        { id: 'm8', name: 'Scientific', description: 'Modern electronic music for technical content', is_favorite: false },
      ];
      
      setMusicStyles(mockMusicStyles);
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching music styles');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicStyles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter music styles locally based on search query
  };

  const handleFavoriteToggle = async (id: string, isFavorite: boolean) => {
    // In a real app, this would update the user's preferences in Supabase
    // For now, we'll just update the local state
    setMusicStyles(musicStyles.map(style => 
      style.id === id ? { ...style, is_favorite: isFavorite } : style
    ));
  };

  const filteredMusicStyles = searchQuery
    ? musicStyles.filter(style => 
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.description && style.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : musicStyles;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Music</h1>
        <p className="text-slate-300">
          Browse and select music for your educational videos
        </p>
      </div>
      
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search music styles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </form>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
            <p className="text-lg font-medium text-slate-300">Loading music styles...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredMusicStyles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-700 p-3">
            <Music className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-white">No music styles found</h3>
          <p className="max-w-md text-slate-400">
            No music styles matching your search criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white">
              {searchQuery ? 'Search Results' : 'All Music Styles'}
            </h2>
            <div className="space-y-2">
              {filteredMusicStyles.map((style) => (
                <MusicCard
                  key={style.id}
                  music={style}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
          
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-white">About Our Music</h2>
            <p className="text-slate-300">
              All music tracks are royalty-free and licensed for use in your educational videos. You can select
              a music style that best complements your content's tone and subject matter. The AI will
              automatically adjust the music volume to ensure clear narration.
            </p>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-white">Music Selection Tips</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-slate-300">
                <li>Match the music style to your content's emotional tone</li>
                <li>Use "Favorite" to mark styles you frequently use</li>
                <li>For technical subjects, choose neutral or scientific styles</li>
                <li>For children's content, playful and upbeat music works best</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};