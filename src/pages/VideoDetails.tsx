import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Download, Loader2, CheckCircle2, Clock, AlertCircle, Film, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Video, Character, VideoScript } from '../types';

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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) return;
      
      try {
        // Fetch video details (including the script JSONB column)
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*, script') // Explicitly select script, though '*' should include it
          .eq('id', id)
          .single();
        
        if (videoError) throw videoError;
        if (!videoData) throw new Error('Video not found');
        
        // Verify ownership
        if (videoData.user_id !== user?.id) {
          throw new Error('Unauthorized');
        }

        // Parse the script JSON string back into an object
        const parsedScript: VideoScript = JSON.parse(videoData.script);

        // Update videoData to include the parsed script
        setVideo({ ...videoData, script: parsedScript });

        // Fetch characters based on the script's charactersInScene
        // Ensure parsedScript and parsedScript.segments exist before calling flatMap
        const characterIdsInScript = parsedScript && parsedScript.segments 
          ? parsedScript.segments.flatMap(s => s.charactersInScene).filter(Boolean)
          : []; // Default to an empty array if script or segments are missing
        
        if (characterIdsInScript.length > 0) {
          const { data: charactersData, error: charactersError } = await supabase
            .from('characters')
            .select('*')
            .in('id', characterIdsInScript);
          
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

  const videoScript = video.script as VideoScript; // Cast to VideoScript

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
        
        <Button
          onClick={() => navigate(`/dashboard?editVideoId=${video.id}`)} // Placeholder for editing
          leftIcon={<Wand2 className="h-4 w-4" />}
        >
          Edit Video
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-white">{video.title}</h1>
        <p className="mt-2 text-slate-300">{video.description}</p>

        {video.music_style && (
          <p className="mt-4 text-sm text-slate-400">
            Music Style: {video.music_style}
          </p>
        )}

        <h2 className="mt-6 text-xl font-semibold text-white">Script Details</h2>
        <div className="mt-4 space-y-4">
          {videoScript?.segments?.map((scene, index) => {
            const speaker = characters.find(char => char.id === scene.speakerCharacterId);
            const charactersInSceneNames = characters
              .filter(char => scene.charactersInScene.includes(char.id))
              .map(char => char.name)
              .filter(Boolean)
              .join(', ');

            return (
              <div key={index} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <h3 className="font-medium text-white">Scene {index + 1}</h3>
                {scene.text && (
                  <p className="text-slate-300 text-sm mt-1">Dialogue: {scene.text}</p>
                )}
                {scene.sceneDescription && (
                  <p className="text-slate-300 text-sm mt-1">Description: {scene.sceneDescription}</p>
                )}
                {speaker && (
                  <p className="text-slate-300 text-sm mt-1">Speaker: {speaker.name}</p>
                )}
                {charactersInSceneNames && (
                  <p className="text-slate-300 text-sm mt-1">Characters: {charactersInSceneNames}</p>
                )}
                {scene.videoUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-slate-700">
                    <video controls src={scene.videoUrl} className="w-full h-auto"></video>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};