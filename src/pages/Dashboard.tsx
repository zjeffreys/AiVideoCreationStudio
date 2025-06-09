import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CreateVideoForm } from '../components/dashboard/CreateVideoForm';
import { Character, Video } from '../types';

export const Dashboard = () => {
  const { user } = useAuth();
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      
      setRecentVideos(videosData as Video[]);
      setCharacters(charactersData as Character[]);
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

  const handleVideoCreated = () => {
    fetchData();
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-slate-300">
          Create and manage your AI-powered educational videos
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
            <p className="text-lg font-medium text-slate-300">Loading dashboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm lg:col-span-2">
              {showCreateForm ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Create New Video</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setShowCreateForm(false)}
                      className="text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                  <CreateVideoForm 
                    characters={characters} 
                    onVideoCreated={handleVideoCreated} 
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 p-3">
                    <PlusCircle className="h-6 w-6 bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-white">Create a New Video</h2>
                  <p className="mb-6 text-slate-300">
                    Start creating your next educational video with AI assistance
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    leftIcon={<PlusCircle className="h-5 w-5" />}
                  >
                    Create New Video
                  </Button>
                </div>
              )}
            </div>
            
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-white">Stats</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gradient-to-r from-purple-900/50 to-orange-900/50 p-4">
                  <p className="text-sm font-medium text-purple-200">Videos</p>
                  <p className="text-3xl font-bold text-purple-400">{recentVideos.length}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-purple-900/50 to-orange-900/50 p-4">
                  <p className="text-sm font-medium text-purple-200">Characters</p>
                  <p className="text-3xl font-bold text-purple-400">{characters.length}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="mb-2 font-medium text-white">Quick Links</h3>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700" 
                    leftIcon={<PlusCircle className="h-4 w-4" />}
                    onClick={() => window.location.href = '/characters'}
                  >
                    Create New Character
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700" 
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
                <h2 className="text-xl font-semibold text-white">Recent Videos</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/videos'}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  View all
                </Button>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-white">{video.title}</h3>
                      <p className="text-sm text-slate-300 line-clamp-2">{video.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        video.status === 'draft' ? 'bg-slate-700 text-slate-300' :
                        video.status === 'processing' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/videos/${video.id}`}
                        className="border-slate-700 text-white hover:bg-slate-700"
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