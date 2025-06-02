import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { VideoCard } from '../components/videos/VideoCard';
import { Video } from '../types';

export const Videos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setVideos(data as Video[]);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching videos');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter videos locally based on search query
    // In a real app, you might want to do this on the server
  };

  const handleEditVideo = (video: Video) => {
    // Implement edit functionality
    console.log('Edit video:', video.id);
  };

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh videos list
        fetchVideos();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An error occurred while deleting the video');
        }
      }
    }
  };

  const filteredVideos = searchQuery
    ? videos.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : videos;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">My Videos</h1>
        <p className="text-slate-500">
          View and manage all your educational videos
        </p>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </form>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              className="bg-transparent text-sm focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          
          <Button
            leftIcon={<PlusCircle className="h-5 w-5" />}
            onClick={() => window.location.href = '/dashboard'}
          >
            New Video
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
            <p className="text-lg font-medium text-slate-700">Loading videos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          <p className="font-medium">Error loading videos</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-3">
            <Film className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-slate-900">No videos found</h3>
          <p className="mb-4 max-w-md text-slate-500">
            {searchQuery
              ? `No videos matching "${searchQuery}"`
              : statusFilter !== 'all'
              ? `No videos with "${statusFilter}" status`
              : "You haven't created any videos yet. Create your first educational video!"}
          </p>
          <Button
            leftIcon={<PlusCircle className="h-5 w-5" />}
            onClick={() => window.location.href = '/dashboard'}
          >
            Create New Video
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onEdit={handleEditVideo}
              onDelete={handleDeleteVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
};