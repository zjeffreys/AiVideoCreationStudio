import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Download, Loader2, CheckCircle2, Clock, AlertCircle, Film, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Video, Character } from '../types';

interface VideoSegment {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  character_id: string;
  voice_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  segment_url: string | null;
  created_at: string;
}

export const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) return;
      
      try {
        // Fetch video details
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

        // Fetch video segments
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('video_segments')
          .select('*')
          .eq('video_id', id)
          .order('start_time');

        if (segmentsError) throw segmentsError;
        setSegments(segmentsData || []);

        // Fetch characters
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

  const getSegmentStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="h-5 w-5 text-slate-500" />, text: 'Pending', color: 'bg-slate-100 text-slate-700' };
      case 'processing':
        return { icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />, text: 'Processing', color: 'bg-blue-100 text-blue-700' };
      case 'completed':
        return { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, text: 'Complete', color: 'bg-green-100 text-green-700' };
      case 'failed':
        return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, text: 'Failed', color: 'bg-red-100 text-red-700' };
      default:
        return { icon: <AlertCircle className="h-5 w-5 text-slate-500" />, text: 'Unknown', color: 'bg-slate-100 text-slate-700' };
    }
  };

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId);
      } else {
        return [...prev, segmentId];
      }
    });
  };

  const handleGenerateFinalVideo = async () => {
    if (selectedSegments.length === 0) {
      setError('Please select at least one segment');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Update video status
      const { error: updateError } = await supabase
        .from('videos')
        .update({ status: 'processing' })
        .eq('id', id);

      if (updateError) throw updateError;

      // In a real app, you would:
      // 1. Call your video generation service
      // 2. Combine selected segments
      // 3. Update the video URL when complete
      
      // For now, we'll simulate processing
      setTimeout(async () => {
        const { error: completeError } = await supabase
          .from('videos')
          .update({
            status: 'complete',
            video_url: 'https://example.com/video.mp4', // This would be the real video URL
          })
          .eq('id', id);

        if (completeError) throw completeError;

        // Refresh video data
        const { data: videoData } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single();

        if (videoData) {
          setVideo(videoData);
        }

        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while generating the final video');
      }
      setIsGenerating(false);
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Video Segments</h2>
          <Button
            onClick={handleGenerateFinalVideo}
            isLoading={isGenerating}
            loadingText="Generating..."
            leftIcon={!isGenerating ? <Wand2 className="h-4 w-4" /> : undefined}
            disabled={selectedSegments.length === 0 || isGenerating}
          >
            Generate Final Video
          </Button>
        </div>

        <div className="space-y-4">
          {segments.map((segment, index) => {
            const status = getSegmentStatus(segment.status);
            const character = characters.find(c => c.id === segment.character_id);

            return (
              <div
                key={segment.id}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedSegments.includes(segment.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-200'
                }`}
                onClick={() => handleSegmentSelect(segment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <Film className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Segment {index + 1}</h3>
                      {character && (
                        <p className="text-sm text-slate-500">Speaker: {character.name}</p>
                      )}
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                    {status.icon}
                    <span>{status.text}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-slate-600">{segment.text}</p>
                  {segment.segment_url && segment.status === 'completed' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Play className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(segment.segment_url, '_blank');
                        }}
                      >
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};