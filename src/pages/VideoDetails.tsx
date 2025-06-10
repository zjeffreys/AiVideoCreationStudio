import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Download, Loader2, CheckCircle2, Clock, AlertCircle, Film, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Video, Character, VideoScript } from '../types';

// Define a type for the actual video segment data from the DB
interface DbVideoSegment {
  id: string;
  video_id: string;
  start_time: number | null;
  end_time: number | null;
  text: string;
  character_id: string | null;
  voice_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  segment_url: string | null;
  created_at: string;
}

// Define a combined type for display, merging script scene with segment URL
interface DisplayScene extends Omit<VideoScript['segments'][0], 'videoUrl'> {
  segmentId?: string; // ID from video_segments table
  videoUrl?: string | null; // The URL from video_segments.segment_url
}

// Extend Video type for internal use to include parsed script and segments
interface ExtendedVideo extends Video {
  parsedScript?: VideoScript;
  dbSegments?: DbVideoSegment[];
}

export const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState<ExtendedVideo | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) return;
      
      try {
        // Fetch main video details
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*') // Select all columns, including the script (as text)
          .eq('id', id)
          .single();
        
        if (videoError) throw videoError;
        if (!videoData) throw new Error('Video not found');
        
        // Verify ownership
        if (videoData.user_id !== user?.id) {
          throw new Error('Unauthorized');
        }

        // Parse the script JSON string back into an object
        const parsedScript: VideoScript = JSON.parse(videoData.script as string);

        // Fetch associated video segments
        const { data: dbSegmentsData, error: segmentsError } = await supabase
          .from('video_segments')
          .select('*')
          .eq('video_id', id)
          .order('created_at', { ascending: true }); // Order to match script segments potentially

        if (segmentsError) throw segmentsError;

        const extendedVideo: ExtendedVideo = {
          ...videoData,
          parsedScript: parsedScript,
          dbSegments: dbSegmentsData || [],
        };
        setVideo(extendedVideo);

        // Fetch characters based on the combined script's charactersInScene and actual segments' character_id
        const allCharacterIds = new Set<string>();
        if (parsedScript && parsedScript.segments) {
          parsedScript.segments.forEach(s => {
            s.charactersInScene.forEach(charId => allCharacterIds.add(charId));
            if (s.speakerCharacterId) allCharacterIds.add(s.speakerCharacterId);
          });
        }
        if (dbSegmentsData) {
          dbSegmentsData.forEach(seg => {
            if (seg.character_id) allCharacterIds.add(seg.character_id);
          });
        }

        const uniqueCharacterIds = Array.from(allCharacterIds).filter(Boolean);
        
        if (uniqueCharacterIds.length > 0) {
          const { data: charactersData, error: charactersError } = await supabase
            .from('characters')
            .select('*')
            .in('id', uniqueCharacterIds);
          
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
        // No longer fetching all columns just to update; only needed ones
        const { data: videoData } = await supabase
          .from('videos')
          .select('id, status, video_url') // Only select necessary fields
          .eq('id', id)
          .single();

        if (videoData) {
          // Only update relevant video fields, not the whole object from fetch
          setVideo(prev => prev ? { ...prev, ...videoData } : null);
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

  // Combine script segments with actual video_segments data for display
  const displayScenes: DisplayScene[] = video?.parsedScript?.segments.map((scriptScene, index) => {
    const correspondingDbSegment = video.dbSegments?.find(dbSeg => {
      // This is a simple way to find corresponding segment, might need more robust logic
      // if segments can be reordered or if script text changes significantly
      return dbSeg.text === scriptScene.text && dbSeg.character_id === scriptScene.speakerCharacterId;
    });

    return {
      ...scriptScene,
      segmentId: correspondingDbSegment?.id,
      videoUrl: correspondingDbSegment?.segment_url,
    };
  }) || [];

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
          variant="outline"
          onClick={() => navigate(`/dashboard/edit/${video?.id}`)}
          leftIcon={<Wand2 className="h-4 w-4" />}
        >
          Edit Video
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
          {video?.title}
        </h1>
        <p className="text-slate-300">{video?.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-white">Video Script & Segments</h2>
          <div className="space-y-4">
            {displayScenes.map((scene, index) => {
              const speaker = characters.find(char => char.id === scene.speakerCharacterId);
              const charactersInSceneNames = characters
                .filter(char => scene.charactersInScene.includes(char.id))
                .map(char => char.name)
                .join(', ');

              return (
                <div key={index} className="rounded-lg border border-slate-700 p-4 bg-slate-900">
                  <h4 className="font-medium text-white">Scene {index + 1}</h4>
                  {speaker && (
                    <p className="text-sm text-slate-300">Speaker: {speaker.name}</p>
                  )}
                  {charactersInSceneNames && (
                    <p className="text-sm text-slate-300">Characters: {charactersInSceneNames}</p>
                  )}
                  {scene.sceneDescription && (
                    <p className="text-sm text-slate-300">Scene: {scene.sceneDescription}</p>
                  )}
                  <div className="border-l-2 border-purple-400 pl-4 mt-2">
                    <p className="text-slate-300">{scene.text}</p>
                  </div>
                  {scene.videoUrl && (
                    <div className="mt-4">
                      <video controls src={scene.videoUrl} className="w-full rounded-md" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-white">Final Video Generation</h2>
          {video?.video_url ? (
            <div className="space-y-4">
              <video controls src={video.video_url} className="w-full rounded-md" />
              <Button 
                onClick={() => window.open(video.video_url || '', '_blank')}
                leftIcon={<Download className="h-4 w-4" />}
                fullWidth
              >
                Download Final Video
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 text-slate-300">
                <p>Select segments to generate the final video:</p>
              </div>
              {/* This part might need adjustment based on how segments are selected */}
              {displayScenes.map((scene) => (
                scene.segmentId && scene.videoUrl && (
                  <div key={scene.segmentId} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={scene.segmentId}
                      checked={selectedSegments.includes(scene.segmentId)}
                      onChange={() => handleSegmentSelect(scene.segmentId as string)}
                      className="form-checkbox h-4 w-4 text-purple-600 rounded-md border-slate-700 bg-slate-900 focus:ring-purple-500"
                    />
                    <label htmlFor={scene.segmentId} className="text-slate-300">
                      Scene {displayScenes.indexOf(scene) + 1}: {scene.sceneDescription}
                    </label>
                  </div>
                )
              ))}
              
              <Button
                onClick={handleGenerateFinalVideo}
                isLoading={isGenerating}
                loadingText="Generating..."
                leftIcon={!isGenerating ? <Film className="h-4 w-4" /> : undefined}
                fullWidth
                disabled={selectedSegments.length === 0 || isGenerating}
              >
                Generate Final Video
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};