export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration: string;
  file: File;
  localUrl: string;
} 