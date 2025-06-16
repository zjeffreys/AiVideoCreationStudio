export type User = {
  id: string;
  email?: string;
  avatar_url?: string;
};

export type Video = {
  id: string;
  title: string;
  description?: string;
  script?: string;
  characters?: string[];
  status: 'draft' | 'processing' | 'complete';
  thumbnail_url?: string;
  video_url?: string;
  file_path?: string;
  created_at: string;
};

export type Character = {
  id: string;
  name: string;
  description?: string;
  personality?: string;
  avatar_url?: string;
  voice_id?: string;
  created_at: string;
};

export type Voice = {
  id: string;
  voiceId: string;
  name?: string;
  description?: string;
  preview_url?: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  labels?: {
    gender?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
  videoUrl?: string;
};

export type VideoCreationStep = 'script' | 'review';

export interface VideoGoals {
  title: string;
  description: string;
  targetAudience?: string;
  isDetailsOpen: boolean;
  format: 'short-form' | 'long-form';
}

export interface VideoScript {
  segments: {
    text: string;
    sceneDescription: string;
    charactersInScene: string[];
    speakerCharacterId?: string;
    duration: string;
    isOpen: boolean;
  }[];
  style: string;
}