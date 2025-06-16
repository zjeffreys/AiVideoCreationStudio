import { supabase } from './supabase';

export interface UserClip {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_path: string;
  thumbnail_url?: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export async function getUserClips(): Promise<UserClip[]> {
  console.log('Starting getUserClips function...');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User must be authenticated');
  }
  console.log('Fetching clips for user:', user.id);

  const { data, error } = await supabase
    .from('user_clips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clips:', error);
    throw error;
  }

  console.log('Fetched clips:', data);
  return data || [];
}

export async function uploadClip(file: File, title: string): Promise<UserClip> {
  console.log('Starting uploadClip function...');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User must be authenticated');
  }

  const userId = user.id;
  console.log('User ID:', userId);
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  console.log('File path:', filePath);

  // Upload the video file
  console.log('Uploading to Supabase storage...');
  const { error: uploadError } = await supabase.storage
    .from('user-clips')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading clip:', uploadError);
    throw uploadError;
  }

  console.log('Getting public URL...');
  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('user-clips')
    .getPublicUrl(filePath);
  console.log('Public URL:', publicUrl);

  // Generate thumbnail
  console.log('Generating thumbnail...');
  const thumbnailUrl = await generateThumbnail(file);
  console.log('Thumbnail URL:', thumbnailUrl);

  // Create the clip record
  console.log('Creating database record...');
  const { data, error: insertError } = await supabase
    .from('user_clips')
    .insert([{
      user_id: userId,
      title,
      file_path: publicUrl,
      thumbnail_url: thumbnailUrl,
      duration: await getVideoDuration(file),
    }])
    .select()
    .single();

  if (insertError) {
    console.error('Error creating database record:', insertError);
    // If database insert fails, clean up the uploaded file
    await supabase.storage
      .from('user-clips')
      .remove([filePath]);
    throw insertError;
  }

  console.log('Clip upload completed successfully:', data);
  return data;
}

export async function deleteClip(id: string): Promise<void> {
  // Get the clip to find its file path
  const { data: clip, error: fetchError } = await supabase
    .from('user_clips')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching clip:', fetchError);
    throw fetchError;
  }

  // Extract the file path from the URL
  const urlParts = clip.file_path.split('user-clips/');
  const filePath = urlParts.length > 1 ? urlParts[1] : null;

  if (filePath) {
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('user-clips')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting clip file:', storageError);
      throw storageError;
    }
  }

  // Delete the database record
  const { error: deleteError } = await supabase
    .from('user_clips')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting clip record:', deleteError);
    throw deleteError;
  }
}

// Helper function to generate a thumbnail from a video file
async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadeddata = () => {
      // Seek to 25% of the video duration for a good thumbnail
      video.currentTime = video.duration * 0.25;
    };

    video.onseeked = async () => {
      try {
        // Create a canvas to capture the frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current frame
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.7);
        });

        // Upload thumbnail to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated');
        
        // Simplified path structure: user_id/thumbnail_id.jpg
        const thumbnailPath = `${user.id}/${crypto.randomUUID()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('clip-thumbnails')
          .upload(thumbnailPath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('clip-thumbnails')
          .getPublicUrl(thumbnailPath);

        resolve(publicUrl);
      } catch (error) {
        reject(error);
      } finally {
        // Clean up
        URL.revokeObjectURL(video.src);
      }
    };

    video.onerror = () => {
      reject(new Error('Error loading video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

// Helper function to get video duration
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Error loading video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
} 