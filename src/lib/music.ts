import { supabase } from './supabase';

export interface UserMusic {
  id: string;
  user_id: string;
  file_path: string;
  created_at: string;
}

export async function getUserMusic(): Promise<UserMusic[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');
  const { data, error } = await supabase
    .from('music_tracks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadMusic(file: File): Promise<UserMusic> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');
  const userId = user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  // Upload the music file
  const { error: uploadError } = await supabase.storage
    .from('user-music')
    .upload(filePath, file);
  if (uploadError) throw uploadError;
  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('user-music')
    .getPublicUrl(filePath);
  // Create the music record
  const { data, error: insertError } = await supabase
    .from('music_tracks')
    .insert([{ user_id: userId, file_path: publicUrl }])
    .select()
    .single();
  if (insertError) {
    await supabase.storage.from('user-music').remove([filePath]);
    throw insertError;
  }
  return data;
} 