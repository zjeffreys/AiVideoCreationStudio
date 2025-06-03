import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Download, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Video, Character } from '../types';

export const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) return;
      
      try {
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (videoError) throw videoError;
        if (!videoData) throw new Error('Video not found');
        
        // Verify ownership
        if (videoData.user_id !== user?.id) {
          throw new Error('Unauthorized');
        }

        setVideo(videoData);

        // Fetch characters if the video has them
        if (videoData.characters && videoData.characters.length > 0) {
          const { data: charactersData, error: charactersError } = await supabase
            .from('characters')
            .select('*')
            .in('id', videoData.characters);
          
          if (charactersError) throw charactersError;
          setCharacters(charactersData || []);
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An error occurred while fetching video details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id, user]);

  const getStatusIcon = () => {
    switch (video?.status) {
      case 'draft':
        return <Clock className="h-5 w-5 text-slate-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (video?.status) {
      case 'draft':
        return 'Draft';
      case 'processing':
        return 'Processing';
      case 'complete':
        return 'Complete';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (video?.status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'complete':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
          <p className="text-lg font-medium text-slate-700">Loading video details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/videos')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Videos
        </Button>
        
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-700">Error</h3>
          <p className="mt-2 text-red-600">{error}</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => navigate('/videos')}
          >
            Return to Videos
          </Button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/videos')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Videos
        </Button>
        
        <div className="rounded-lg bg-slate-100 p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Video Not Found</h3>
          <p className="mt-2 text-slate-600">The requested video could not be found.</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => navigate('/videos')}
          >
            Return to Videos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/videos')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Videos
        </Button>
        
        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={video.thumbnail_url || 'https://via.placeholder.com/1280x720?text=No+Thumbnail'}
            alt={video.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {video.status === 'complete' && video.video_url && (
              <Button
                size="lg"
                onClick={() => window.open(video.video_url, '_blank')}
                leftIcon={<Play className="h-5 w-5" />}
              >
                Play Video
              </Button>
            )}
            {video.status === 'processing' && (
              <div className="rounded-lg bg-black/50 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="text-left">
                    <p className="font-medium">Processing Video</p>
                    <p className="text-sm text-white/80">This may take a few minutes...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900">{video.title}</h1>
          <p className="mt-2 text-slate-600">{video.description}</p>

          {characters.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Featured Characters</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {characters.map(character => (
                  <div
                    key={character.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
                  >
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                        <span className="text-sm font-medium text-purple-700">
                          {character.name[0]}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-slate-900">{character.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {video.status === 'complete' && (
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => window.open(video.video_url, '_blank')}
                leftIcon={<Play className="h-4 w-4" />}
              >
                Play Video
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => window.open(video.video_url, '_blank')}
              >
                Download
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};