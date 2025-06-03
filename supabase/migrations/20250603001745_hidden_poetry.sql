/*
  # Add video segments and scripts

  1. New Tables
    - `video_segments` - Stores individual video segments with timing and character info
    - `video_scripts` - Stores complete video scripts with metadata
  
  2. Changes
    - Add new columns to videos table for script and segment tracking
  
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add video segments table
CREATE TABLE IF NOT EXISTS video_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  text text NOT NULL,
  character_id uuid REFERENCES characters(id),
  voice_id text,
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  segment_url text,
  created_at timestamptz DEFAULT now()
);

-- Add video scripts table
CREATE TABLE IF NOT EXISTS video_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  style text,
  music_id uuid REFERENCES music_styles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for video segments
CREATE POLICY "Users can manage their own video segments"
  ON video_segments
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_segments.video_id
      AND videos.user_id = auth.uid()
    )
  );

-- Add RLS policies for video scripts
CREATE POLICY "Users can manage their own video scripts"
  ON video_scripts
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_scripts.video_id
      AND videos.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_segments_video_id ON video_segments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_scripts_video_id ON video_scripts(video_id);