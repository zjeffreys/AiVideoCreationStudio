export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export interface VoiceGenerationResponse {
  id: string;
  status: 'success' | 'error';
  audioUrl?: string;
  error?: string;
}

export interface VideoSegment {
  start: number;
  end: number;
  text: string;
  character?: string;
  voiceId?: string;
}

export interface VideoScript {
  title: string;
  description: string;
  segments: VideoSegment[];
  style?: string;
  musicId?: string;
}