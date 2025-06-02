import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CreateVideoForm } from '../components/dashboard/CreateVideoForm';
import { Character, MusicStyle, Video } from '../types';

export const Dashboard = () => {
  const { user } = useAuth();
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [musicStyles, setMusicStyles] = useState<MusicStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch recent videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (videosError) throw videosError;
      
      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id);
      
      if (charactersError) throw charactersError;
      
      // Fetch music styles
      const { data: musicData, error: musicError } = await supabase
        .from('music_styles')
        .select('*')
        .is('user_id', null)
        .order('name');
      
      if (musicError) throw musicError;
      
      setRecentVideos(videosData as Video[]);
      setCharacters(charactersData as Character[]);
      setMusicStyles(musicData as MusicStyle[]);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">
          Create and manage your AI-powered educational videos
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
            <p className="text-lg font-medium text-slate-700">Loading dashboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Create New Video</h2>
              <CreateVideoForm 
                characters={characters} 
                musicStyles={musicStyles} 
                onVideoCreated={fetchData} 
              />
            </div>
            
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Stats</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-900">Videos</p>
                  <p className="text-3xl font-bold text-purple-700">{recentVideos.length}</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-sm font-medium text-teal-900">Characters</p>
                  <p className="text-3xl font-bold text-teal-700">{characters.length}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="mb-2 font-medium text-slate-900">Quick Links</h3>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    leftIcon={<PlusCircle className="h-4 w-4" />}
                    onClick={() => window.location.href = '/characters'}
                  >
                    Create New Character
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    leftIcon={<PlusCircle className="h-4 w-4" />}
                    onClick={() => window.location.href = '/videos'}
                  >
                    View All Videos
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {recentVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Recent Videos</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/videos'}
                >
                  View all
                </Button>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-slate-900">{video.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{video.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        video.status === 'draft' ? 'bg-slate-100 text-slate-800' :
                        video.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/videos/${video.id}`}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};