import React, { useState, useEffect } from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

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

  const enhanceVideoPrompt = async () => {
    if (!videoPrompt.trim()) {
      setEnhanceError('Please enter a video description first.');
      return;
    }

    setIsEnhancing(true);
    setEnhanceError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert video content creator. Help users improve their video descriptions by making them more detailed, engaging, and specific. Keep the enhanced description concise but comprehensive.'
            },
            {
              role: 'user',
              content: `Please enhance this video description to make it more detailed and engaging for educational video creation: "${videoPrompt}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance description');
      }

      const data = await response.json();
      const enhancedPrompt = data.choices[0].message.content;
      setVideoPrompt(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setEnhanceError('Failed to enhance description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl p-6 mb-4" style={{background: 'linear-gradient(90deg, #c7d2fe 0%, #fbc2a4 100%)'}}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-medium text-slate-700 flex items-center gap-2">
            Hello {user?.email?.split('@')[0] || 'User'} <span role="img" aria-label="wave">👋</span>, create your video from
          </h2>
        </div>
        {/*
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
        */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-2 w-full">
          <label htmlFor="dashboardVideoPrompt" className="text-sm font-medium text-slate-700 dark:text-white mb-1">Generate a Video from a Prompt</label>
          <div className="relative">
            <textarea
              id="dashboardVideoPrompt"
              placeholder="Describe your educational video idea..."
              rows={4}
              className="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 text-slate-700 dark:text-white resize-vertical min-h-[80px] pr-12"
              value={videoPrompt}
              onChange={e => setVideoPrompt(e.target.value)}
            />
            <button
              type="button"
              onClick={enhanceVideoPrompt}
              disabled={!videoPrompt.trim() || isEnhancing}
              className="absolute right-2 top-2 p-2 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white hover:from-purple-600 hover:to-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="AI Enhance Description"
            >
              <Sparkles size={16} />
            </button>
          </div>
          {enhanceError && (
            <div className="text-red-500 text-sm">{enhanceError}</div>
          )}
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white font-semibold shadow hover:from-purple-600 hover:to-orange-500 transition-colors self-start"
            onClick={async () => {
              if (!user) {
                setGenerateError('You must be logged in to generate a video.');
                return;
              }
              setIsGenerating(true);
              setGenerateError(null);
              console.log('Starting video generation from prompt:', videoPrompt);
              try {
                // 1. Call OpenAI to generate title and description
                console.log('Calling OpenAI API...');
                const prompt = `Generate a concise, catchy video title (max 8 words) and a 1-2 sentence description for an educational video based on this user prompt. Return as JSON: { "title": string, "description": string }\n\nPrompt: ${videoPrompt}`;
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: 'gpt-4.1-mini',
                    messages: [
                      { role: 'system', content: 'You are a helpful assistant for educational video creators.' },
                      { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                  }),
                });
                if (!response.ok) throw new Error('Failed to get response from AI');
                const data = await response.json();
                console.log('OpenAI API response:', data);
                let aiContent = data.choices[0].message.content;
                let parsed;
                try {
                  parsed = JSON.parse(aiContent);
                  console.log('Parsed AI content:', parsed);
                } catch {
                  // fallback: try to extract JSON from text
                  const match = aiContent.match(/\{[\s\S]*\}/);
                  parsed = match ? JSON.parse(match[0]) : { title: 'Untitled Video', description: '' };
                  console.log('Fallback parsed AI content:', parsed);
                }
                // 2. Create video in Supabase
                console.log('Inserting new video into Supabase:', parsed);
                const defaultSections = [
                  {
                    label: 'Hook',
                    description: 'Captures attention and introduces the main idea.',
                    scenes: [
                      {
                        id: crypto.randomUUID(),
                        type: 'text',
                        content: 'Welcome to your video!',
                        audio: '',
                        script: 'Script for scene 1',
                        title: 'Opening Hook',
                        description: 'Grab attention with key message',
                      },
                    ],
                  },
                  {
                    label: 'Exposition',
                    description: 'Provides background and context for the story.',
                    scenes: [
                      {
                        id: crypto.randomUUID(),
                        type: 'image',
                        content: 'https://placekitten.com/200/140',
                        audio: '',
                        script: 'Script for scene 2',
                        title: 'Main Concept',
                        description: 'Introduce core topic',
                      },
                    ],
                  },
                  {
                    label: 'Climax',
                    description: 'The most intense or important part of the story.',
                    scenes: [
                      {
                        id: crypto.randomUUID(),
                        type: 'text',
                        content: 'This is your second scene.',
                        audio: '',
                        script: 'Script for scene 3',
                        title: 'Key Moment',
                        description: 'Build to main point',
                      },
                    ],
                  },
                ];
                const { data: newVideo, error } = await supabase
                  .from('videos')
                  .insert({
                    title: parsed.title || 'Untitled Video',
                    description: parsed.description || '',
                    status: 'draft',
                    user_id: user.id,
                    sections: defaultSections,
                  })
                  .select()
                  .single();
                console.log('Supabase insert result:', newVideo, error);
                if (error || !newVideo) throw error || new Error('Failed to create video');
                // 3. Navigate to video editor for new video
                console.log('Navigating to video editor for video id:', newVideo.id);
                navigate(`/video-editor/${newVideo.id}`);
              } catch (err: any) {
                console.error('Error during video generation:', err);
                setGenerateError(err.message || 'Failed to generate video');
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={!videoPrompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Video from Prompt'}
          </button>
          {generateError && (
            <div className="text-red-500 text-sm mt-2">{generateError}</div>
          )}
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
                  onClick={() => navigate(`/video-editor/${video.id}`)}
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