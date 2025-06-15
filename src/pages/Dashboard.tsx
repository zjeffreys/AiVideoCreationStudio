import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CreateVideoForm } from '../components/dashboard/CreateVideoForm';
import { Character, Video } from '../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');

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
      <div className="rounded-2xl p-6 mb-4" style={{background: 'linear-gradient(90deg, #c7d2fe 0%, #fbc2a4 100%)'}}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-medium text-slate-700 flex items-center gap-2">
            Hello {user?.email?.split('@')[0] || 'User'} <span role="img" aria-label="wave">👋</span>, create your video from
          </h2>
        </div>
        <div className="mt-6 flex justify-start">
          <div
            className="inline-block rounded-xl p-[2px]"
            style={{
              background: 'linear-gradient(90deg, #a5b4fc 0%, #fbc2a4 100%)',
            }}
          >
            <button
              onClick={() => navigate('/storyboard-planner')}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow"
              style={{
                border: 'none',
              }}
            >
              <span className="inline-flex items-center justify-center h-5 w-5">
                <svg
                  viewBox="0 0 768 768"
                  className="h-5 w-5"
                  fill="url(#star-gradient)"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="star-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                  </defs>
                  <g clipPath="url(#clip0)">
                    <path d="M694.945 428.957C419.336 463.875 390.301 492.18 354.484 760.871C318.668 492.18 289.637 463.875 14.023 428.957C289.637 394.043 318.668 365.738 354.484 97.047C390.301 365.738 419.336 394.043 694.945 428.957Z" />
                    <path d="M754.078 150.996C620.059 160.32 612.086 167.879 602.25 294.906C592.41 167.879 584.438 160.32 450.418 150.996C584.438 141.672 592.41 134.113 602.25 7.086C612.086 134.113 620.059 141.672 754.078 150.996Z" />
                  </g>
                  <defs>
                    <clipPath id="clip0">
                      <rect width="768" height="768" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </span>
              <span className="text-base font-medium text-slate-700">AI Storyboard Assistant</span>
            </button>
          </div>
        </div>
        <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-2 w-full">
          <label htmlFor="dashboardVideoPrompt" className="text-sm font-medium text-slate-700 dark:text-white mb-1">Generate a Video from a Prompt</label>
          <textarea
            id="dashboardVideoPrompt"
            placeholder="Describe your educational video idea..."
            rows={4}
            className="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 text-slate-700 dark:text-white resize-vertical min-h-[80px]"
            value={videoPrompt}
            onChange={e => setVideoPrompt(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white font-semibold shadow hover:from-purple-600 hover:to-orange-500 transition-colors self-start"
            onClick={() => navigate('/video-editor')}
            disabled={!videoPrompt.trim()}
          >
            Generate Video from Prompt
          </button>
        </div>
      </div>
      {/* My Videos Section (only if user has videos) */}
      {recentVideos.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">My Videos</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video) => (
              <div 
                key={video.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
              >
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">{video.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-2">{video.description}</p>
                <button
                  className="text-sm text-purple-600 hover:underline font-medium"
                  onClick={() => window.location.href = `/videos/${video.id}`}
                >
                  View Video
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Templates Section (always show) */}
      <section>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Templates</h2>
        <div className="text-slate-400 text-base italic">Coming soon...</div>
      </section>
    </div>
  );
};