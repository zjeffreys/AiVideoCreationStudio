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
  music_style?: string;
  status: 'draft' | 'processing' | 'complete';
  thumbnail_url?: string;
  video_url?: string;
  created_at: string;
};

export type Character = {
  id: string;
  name: string;
  personality?: string;
  avatar_url?: string;
  voice_id?: string;
  created_at: string;
};

export type MusicStyle = {
  id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
};

export type Voice = {
  id: string;
  name: string;
  preview_url?: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
};