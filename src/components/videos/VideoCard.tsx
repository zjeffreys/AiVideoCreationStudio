import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pencil, 
  Download, 
  Trash, 
  Clock, 
  CheckCircle,
  Loader,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Video } from '../../types';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

// Add interface for clip data
interface ClipData {
  id: string;
  thumbnail_url?: string;
}

type VideoCardProps = {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
};

export const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);

  // Function to fetch clip thumbnail
  const fetchClipThumbnail = async (clipId: string) => {
    try {
      setIsLoadingThumbnail(true);
      console.log('Fetching thumbnail for clip:', clipId);
      
      // Fetch clip data from user_clips table
      const { data: clipData, error: clipsError } = await supabase
        .from('user_clips')
        .select('id, thumbnail_url')
        .eq('id', clipId)
        .single();

      if (clipsError) throw clipsError;

      console.log('Fetched clip data:', clipData);

      if (clipData?.thumbnail_url) {
        let signedThumbnailUrl = clipData.thumbnail_url;
        
        // Get signed URL for thumbnail
        const thumbPath = clipData.thumbnail_url.includes('/object/public/clip-thumbnails/')
          ? clipData.thumbnail_url.split('/object/public/clip-thumbnails/')[1]
          : clipData.thumbnail_url.split('/clip-thumbnails/')[1] || clipData.thumbnail_url;
        
        console.log('Extracted thumbPath:', thumbPath);
        
        const { data } = await supabase.storage
          .from('clip-thumbnails')
          .createSignedUrl(thumbPath, 3600); // 1 hour expiry
        
        signedThumbnailUrl = data?.signedUrl || clipData.thumbnail_url;
        console.log('Signed thumbnail URL:', signedThumbnailUrl);
        
        setThumbnailUrl(signedThumbnailUrl);
      }
    } catch (error) {
      console.error('Error fetching clip thumbnail:', error);
    } finally {
      setIsLoadingThumbnail(false);
    }
  };

  // Find thumbnail when component mounts
  useEffect(() => {
    // First try to use the video's direct thumbnail_url
    if (video.thumbnail_url) {
      setThumbnailUrl(video.thumbnail_url);
      return;
    }

    // If no direct thumbnail, look for a scene with a clipId
    let foundScene = null;
    
    // Look through all sections and scenes to find the first one with a clipId
    for (const section of video.sections || []) {
      for (const scene of section.scenes || []) {
        if (scene.type === 'image') {
          setThumbnailUrl(scene.content);
          return;
        } else if (scene.type === 'video' && scene.clipId) {
          console.log('Found video scene with clipId:', scene.clipId, 'for video:', video.title);
          foundScene = scene;
          break;
        }
      }
      if (foundScene) break;
    }

    // If we found a scene with clipId, fetch its thumbnail
    if (foundScene?.clipId) {
      fetchClipThumbnail(foundScene.clipId);
    }
  }, [video]);

  const getStatusIcon = () => {
    switch (video.status) {
      case 'draft':
        return <Clock className="h-5 w-5 text-slate-400" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (video.status) {
      case 'draft':
        return 'Draft';
      case 'processing':
        return 'Processing';
      case 'complete':
        return 'Complete';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (video.status) {
      case 'draft':
        return 'bg-slate-700 text-slate-300';
      case 'processing':
        return 'bg-blue-900/50 text-blue-300';
      case 'complete':
        return 'bg-green-900/50 text-green-300';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const handleViewDetails = () => {
    navigate(`/videos/${video.id}`);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              console.log('Image failed to load:', thumbnailUrl);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`h-full w-full flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
          {isLoadingThumbnail ? (
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
              <span className="text-sm text-slate-500">Loading thumbnail...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-2">🎬</div>
              <span className="text-sm text-slate-500">No thumbnail</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {video.status === 'complete' && (
            <button 
              onClick={handleViewDetails}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              <Play className="h-6 w-6" />
            </button>
          )}
          {video.status === 'processing' && (
            <div className="rounded-md bg-black/50 px-4 py-2 text-sm font-medium text-white">
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">{video.title}</h3>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', getStatusColor())}>
            {getStatusIcon()}
            {getStatusText()}
          </span>
        </div>
        
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-300 line-clamp-2">
          {video.description || 'No description provided.'}
        </p>
        
        <div className="mb-4 text-xs text-slate-400">
          Created on {formatDate(video.created_at)}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={handleViewDetails}
            leftIcon={<ArrowRight className="h-4 w-4" />}
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => onEdit(video)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300"
            leftIcon={<Trash className="h-4 w-4" />}
            onClick={() => onDelete(video.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};