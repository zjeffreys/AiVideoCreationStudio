import React, { useState, useEffect } from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CreateVideoForm } from '../components/dashboard/CreateVideoForm';
import { Character, Video } from '../types';
import { useNavigate } from 'react-router-dom';

// Add interface for clip data
interface ClipData {
  id: string;
  thumbnail_url?: string;
}

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
  const [clipData, setClipData] = useState<Record<string, ClipData>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Utility function to validate UUID format
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch recent videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (videosError) throw videosError;
      
      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id);
      
      if (charactersError) throw charactersError;
      
      setRecentVideos(videosData as Video[]);
      setCharacters(charactersData as Character[]);
      
      // Fetch clip data for thumbnails
      await fetchClipData(videosData as Video[]);
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

  const fetchClipData = async (videos: Video[]) => {
    try {
      // Collect all unique clip IDs from video scenes
      const clipIds = new Set<string>();
      videos.forEach(video => {
        video.sections?.forEach(section => {
          section.scenes?.forEach(scene => {
            if (scene.clipId) {
              // Only add valid UUIDs to avoid database errors
              if (isValidUUID(scene.clipId)) {
                clipIds.add(scene.clipId);
                console.log('Found valid clipId in scene:', scene.clipId, 'for video:', video.title);
              } else {
                console.warn('Invalid UUID format for clipId:', scene.clipId, 'in video:', video.title);
              }
            }
          });
        });
      });

      console.log('Total unique clipIds found:', clipIds.size, Array.from(clipIds));

      if (clipIds.size === 0) {
        console.log('No clipIds found in any videos');
        return;
      }

      // Fetch clip data from user_clips table
      const { data: clipsData, error: clipsError } = await supabase
        .from('user_clips')
        .select('id, thumbnail_url')
        .in('id', Array.from(clipIds));

      if (clipsError) throw clipsError;

      console.log('Fetched clips data:', clipsData);

      // Create a map of clip data with signed URLs for thumbnails
      const clipMap: Record<string, ClipData> = {};
      for (const clip of clipsData || []) {
        let signedThumbnailUrl = clip.thumbnail_url;
        
        // Get signed URL for thumbnail if it exists
        if (clip.thumbnail_url) {
          console.log('Processing thumbnail for clip:', clip.id, 'URL:', clip.thumbnail_url);
          const thumbPath = clip.thumbnail_url.includes('/object/public/clip-thumbnails/')
            ? clip.thumbnail_url.split('/object/public/clip-thumbnails/')[1]
            : clip.thumbnail_url.split('/clip-thumbnails/')[1] || clip.thumbnail_url;
          
          console.log('Extracted thumbPath:', thumbPath);
          
          const { data } = await supabase.storage
            .from('clip-thumbnails')
            .createSignedUrl(thumbPath, 3600); // 1 hour expiry
          
          signedThumbnailUrl = data?.signedUrl || clip.thumbnail_url;
          console.log('Signed thumbnail URL:', signedThumbnailUrl);
        }

        clipMap[clip.id] = {
          id: clip.id,
          thumbnail_url: signedThumbnailUrl,
        };
      }

      console.log('Final clipMap:', clipMap);
      setClipData(clipMap);
    } catch (error) {
      console.error('Error fetching clip data:', error);
      // Don't throw here as this is not critical for the main functionality
    }
  };

  const fetchSingleClip = async (clipId: string) => {
    // Validate UUID format before making the query
    if (!isValidUUID(clipId)) {
      console.warn('Invalid UUID format for clipId:', clipId);
      return;
    }

    try {
      console.log('Fetching single clip:', clipId);
      
      // Fetch clip data from user_clips table
      const { data: clipData, error: clipsError } = await supabase
        .from('user_clips')
        .select('id, thumbnail_url')
        .eq('id', clipId)
        .single();

      if (clipsError) throw clipsError;

      console.log('Fetched single clip data:', clipData);

      if (clipData) {
        let signedThumbnailUrl = clipData.thumbnail_url;
        
        // Get signed URL for thumbnail if it exists
        if (clipData.thumbnail_url) {
          console.log('Processing thumbnail for single clip:', clipData.id, 'URL:', clipData.thumbnail_url);
          const thumbPath = clipData.thumbnail_url.includes('/object/public/clip-thumbnails/')
            ? clipData.thumbnail_url.split('/object/public/clip-thumbnails/')[1]
            : clipData.thumbnail_url.split('/clip-thumbnails/')[1] || clipData.thumbnail_url;
          
          console.log('Extracted thumbPath for single clip:', thumbPath);
          
          const { data } = await supabase.storage
            .from('clip-thumbnails')
            .createSignedUrl(thumbPath, 3600); // 1 hour expiry
          
          signedThumbnailUrl = data?.signedUrl || clipData.thumbnail_url;
          console.log('Signed thumbnail URL for single clip:', signedThumbnailUrl);
        }

        // Update the clipData state with the new clip
        setClipData(prev => ({
          ...prev,
          [clipId]: {
            id: clipData.id,
            thumbnail_url: signedThumbnailUrl,
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching single clip data:', error);
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

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeletingVideoId(videoId);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Remove the video from the local state
      setRecentVideos(prev => prev.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    } finally {
      setDeletingVideoId(null);
    }
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
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Create Your Next Educational Video</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Transform your ideas into engaging educational content with AI-powered video creation</p>
          </div>
          <div className="relative">
            <textarea
              id="dashboardVideoPrompt"
              placeholder="Describe your educational video concept, topic, or learning objective..."
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
            className="mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-orange-500 transition-all duration-200 self-start transform hover:scale-105"
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
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Your Video...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Generate Video
              </span>
            )}
          </button>
          {generateError && (
            <div className="text-red-500 text-sm mt-2">{generateError}</div>
          )}
        </div>
      </div>
      {/* My Videos Section (only if user has videos) */}
      {recentVideos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-700">My Videos</h2>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video) => {
              // Find the first scene with a clipId for thumbnail
              let thumbnailUrl: string | undefined;
              let foundScene = null;
              
              // Look through all sections and scenes to find the first one with a clipId
              for (const section of video.sections || []) {
                for (const scene of section.scenes || []) {
                  if (scene.type === 'image') {
                    thumbnailUrl = scene.content;
                    foundScene = scene;
                    break;
                  } else if (scene.type === 'video' && scene.clipId) {
                    console.log('Found video scene with clipId:', scene.clipId, 'for video:', video.title);
                    thumbnailUrl = clipData[scene.clipId]?.thumbnail_url;
                    foundScene = scene;
                    break;
                  }
                }
                if (foundScene) break;
              }
              
              // If we found a scene with clipId but no thumbnail, try to fetch it directly
              if (foundScene?.clipId && !thumbnailUrl) {
                console.log('Clip not found in clipData, attempting direct fetch for:', foundScene.clipId);
                // This will trigger a re-render when the clip is fetched
                fetchSingleClip(foundScene.clipId);
              }
              
              console.log(`Video ${video.title}:`, {
                hasSections: !!video.sections,
                sectionsCount: video.sections?.length,
                foundScene,
                thumbnailUrl,
                clipDataKeys: Object.keys(clipData),
                clipDataForScene: foundScene?.clipId ? clipData[foundScene.clipId] : null
              });
              
              return (
                <div 
                  key={video.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => !isEditMode && navigate(`/video-editor/${video.id}`)}
                >
                  {/* Delete button overlay when in edit mode */}
                  {isEditMode && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video.id);
                        }}
                        disabled={deletingVideoId === video.id}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                        title="Delete video"
                      >
                        {deletingVideoId === video.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', thumbnailUrl);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 ${thumbnailUrl ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎬</div>
                        <span className="text-sm">No thumbnail</span>
                        <div className="text-xs mt-1 text-slate-500">
                          {foundScene ? `Scene type: ${foundScene.type}${foundScene.clipId ? ` (clipId: ${foundScene.clipId})` : ''}` : 'No scenes found'}
                        </div>
                      </div>
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-slate-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video info */}
                  <div className="p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">{video.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-2">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{video.status}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};