import { supabase } from './supabase';
import { Video } from '../types';

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }

  return data || [];
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert([video])
    .select()
    .single();

  if (error) {
    console.error('Error creating video:', error);
    throw error;
  }

  return data;
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating video:', error);
    throw error;
  }

  return data;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function uploadVideoThumbnail(file: File, videoId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${videoId}-thumbnail.${fileExt}`;
  const filePath = `thumbnails/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading thumbnail:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadVideo(file: File, videoId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${videoId}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading video:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  return publicUrl;
} 