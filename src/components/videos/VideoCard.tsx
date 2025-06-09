import React from 'react';
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

type VideoCardProps = {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
};

export const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const navigate = useNavigate();

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
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={video.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'}
          alt={video.title}
          className="h-full w-full object-cover"
        />
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
          <h3 className="text-lg font-semibold text-white line-clamp-1">{video.title}</h3>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', getStatusColor())}>
            {getStatusIcon()}
            {getStatusText()}
          </span>
        </div>
        
        <p className="mb-4 text-sm text-slate-300 line-clamp-2">
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
            className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
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