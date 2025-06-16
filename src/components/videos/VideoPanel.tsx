import React, { useState } from 'react';
import { Plus, Upload, X, Sparkles, Video as VideoIcon, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Video } from '../../types';

interface SceneVideo extends Video {
  file: File;
  localUrl: string;
  id: string;
  title: string;
  thumbnail_url?: string;
}

type VideoPanelProps = {
  onAddVideo: (video: File) => void;
  onRemoveVideo: (id: string) => void;
  videos: SceneVideo[];
  onVideoSelect: (video: SceneVideo) => void;
};

type TabType = 'upload' | 'ai' | 'stock';

export const VideoPanel: React.FC<VideoPanelProps> = ({
  onAddVideo,
  onRemoveVideo,
  videos,
  onVideoSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      onAddVideo(videoFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddVideo(files[0]);
    }
  };

  const handleVideoClick = (video: SceneVideo, event: React.MouseEvent) => {
    if (isDeleteMode) {
      event.stopPropagation();
      onRemoveVideo(video.id);
    } else {
      onVideoSelect(video);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
              isDragging 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-slate-300 dark:border-slate-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleFileInput}
            />
            <Upload className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Drag and drop video files here, or{' '}
              <button
                className="text-purple-600 dark:text-purple-400 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Supported formats: MP4, WebM, MOV
            </p>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Generate Video with AI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Describe the video you want to create and our AI will generate it for you.
              </p>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300 resize-none"
                rows={3}
                placeholder="Describe your video scene..."
              />
              <Button className="w-full mt-2" leftIcon={<Sparkles className="h-4 w-4" />}>
                Generate Video
              </Button>
            </div>
          </div>
        );
      case 'stock':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stock Videos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Browse our library of stock videos to find the perfect clip.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300"
                  placeholder="Search stock videos..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" leftIcon={<VideoIcon className="h-4 w-4" />}>
                    Browse All
                  </Button>
                  <Button variant="outline" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                    AI Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-slate-700 dark:text-white">Scene Videos</h2>
        <Button
          size="sm"
          variant={isDeleteMode ? "ghost" : "outline"}
          className={isDeleteMode ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50" : ""}
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          {isDeleteMode ? 'Exit Delete' : 'Delete'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
              onClick={(e) => handleVideoClick(video, e)}
            >
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <span className="text-sm">No thumbnail</span>
                </div>
              )}
              {isDeleteMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-sm text-white truncate">{video.title}</p>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No videos added yet</p>
              <p className="text-xs mt-1">Add videos to use in your scenes</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('stock')}
          >
            <VideoIcon className="h-4 w-4" />
            Stock
          </button>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}; 