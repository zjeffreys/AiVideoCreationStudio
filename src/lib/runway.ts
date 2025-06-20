import { supabase } from './supabase';

// Remove Runway ML SDK dependency since it's handled on the backend
// const RUNWAY_API_KEY = import.meta.env.VITE_RUNWAY_API_KEY;

// if (!RUNWAY_API_KEY) {
//   console.warn('Missing Runway ML API key - video generation will be disabled');
// }

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn('Missing backend URL - video generation will be disabled');
}

export interface RunwayVideoParams {
  promptText: string;
  promptImage?: string; // URL or base64 data URI
  duration?: 5 | 10;
  ratio?: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672' | '1280:768' | '768:1280';
  model?: 'gen4_turbo' | 'gen3a_turbo';
  title?: string;
  description?: string;
}

export interface RunwayVideoResponse {
  id: string;
  status: 'completed' | 'failed';
  url?: string;
  error?: string;
  video?: {
    id: string;
    user_id: string;
    title: string;
    description: string;
    file_path: string;
    thumbnail_url: string | null;
    duration: number;
    created_at: string;
    public_url: string;
  };
}

export const generateRunwayVideo = async (params: RunwayVideoParams): Promise<RunwayVideoResponse> => {
  try {
    if (!BACKEND_URL) {
      throw new Error('Backend URL not configured');
    }

    const formData = new FormData();
    formData.append('prompt_text', params.promptText);
    formData.append('duration', params.duration?.toString() || '5');
    formData.append('ratio', params.ratio || '1280:720');
    
    if (params.promptImage) {
      // Send the image URL directly
      formData.append('image_url', params.promptImage);
    } else {
      // Send undefined if no image
      formData.append('image_url', 'undefined');
    }

    console.log('Sending request to Runway proxy backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/generate-video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend error: ${response.statusText} - ${errorData.detail || ''}`);
    }

    const result = await response.json();
    
    // Expect the backend to return just the video URL
    if (result.video_url) {
      return {
        id: `runway-${Date.now()}`, // Generate a temporary ID
        status: 'completed',
        url: result.video_url,
      };
    } else {
      throw new Error('No video URL in response');
    }

  } catch (error) {
    console.error('Error generating Runway video:', error);
    
    return {
      id: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Helper function to convert image file to base64 data URI
export const imageToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to resize and compress image to under 1024KB
export const optimizeImage = (file: File, maxSizeKB: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      let quality = 0.9;
      
      // Start with reasonable dimensions for AI video generation
      const maxWidth = 1280;
      const maxHeight = 720;
      
      // Resize if image is too large
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);

      // Function to check size and adjust quality if needed
      const checkSize = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Size = Math.ceil((dataUrl.length * 3) / 4); // Approximate base64 size in bytes
        const sizeKB = base64Size / 1024;
        
        console.log(`Image size: ${sizeKB.toFixed(2)}KB, quality: ${quality}`);
        
        if (sizeKB > maxSizeKB && quality > 0.1) {
          // Reduce quality and try again
          quality -= 0.1;
          setTimeout(checkSize, 0);
        } else {
          resolve(dataUrl);
        }
      };

      checkSize();
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Enhanced function to convert image file to optimized base64 data URI
export const imageToOptimizedDataUri = async (file: File): Promise<string> => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  console.log(`Original image size: ${(file.size / 1024).toFixed(2)}KB`);
  
  // If image is already under 1024KB, just convert to base64
  if (file.size <= 1024 * 1024) {
    console.log('Image already under 1024KB, no optimization needed');
    return imageToDataUri(file);
  }
  
  // Optimize the image
  console.log('Optimizing image to reduce size...');
  return optimizeImage(file, 1024);
};

// Function to fetch user's existing videos from the backend
export const getUserVideos = async (): Promise<any[]> => {
  try {
    // Get current user and session from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    if (!BACKEND_URL) {
      throw new Error('Backend URL not configured');
    }

    const response = await fetch(`${BACKEND_URL}/api/videos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend error: ${response.statusText} - ${errorData.detail || ''}`);
    }

    const result = await response.json();
    
    if (result.success && result.videos) {
      return result.videos;
    } else {
      throw new Error('Invalid response from backend');
    }

  } catch (error) {
    console.error('Error fetching user videos:', error);
    throw error;
  }
}; 