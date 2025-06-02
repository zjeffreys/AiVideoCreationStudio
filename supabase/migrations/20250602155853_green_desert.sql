/*
  # Initial Schema Setup for EduMotion

  1. New Tables
    - `videos` - Stores all user created videos
    - `characters` - Stores character profiles for videos
    - `music_styles` - Stores available music styles
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  script text,
  characters uuid[] DEFAULT NULL,
  music_style uuid DEFAULT NULL,
  status text CHECK (status IN ('draft', 'processing', 'complete')) DEFAULT 'draft',
  thumbnail_url text,
  video_url text
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  personality text,
  avatar_url text,
  voice_id text
);

-- Music styles table
CREATE TABLE IF NOT EXISTS music_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_favorite boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos
CREATE POLICY "Users can create their own videos"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own videos"
  ON videos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON videos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for characters
CREATE POLICY "Users can create their own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for music_styles
CREATE POLICY "Users can view all music styles"
  ON music_styles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own favorite music styles"
  ON music_styles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite music styles"
  ON music_styles
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Insert some default music styles
INSERT INTO music_styles (name, description)
VALUES
  ('Inspiring', 'Uplifting and motivational background music'),
  ('Chill', 'Relaxed and calm ambient sounds'),
  ('Suspense', 'Create tension and anticipation'),
  ('Playful', 'Fun and energetic tunes for children''s content'),
  ('Cinematic', 'Epic orchestral scores for dramatic moments'),
  ('Educational', 'Neutral background music that enhances learning'),
  ('Corporate', 'Professional and clean background tracks'),
  ('Scientific', 'Modern electronic music for technical content');