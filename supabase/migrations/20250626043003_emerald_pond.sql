/*
  # User Profiles and Membership System

  1. New Tables
    - `user_profiles` - Stores user membership information and limits
    - `music_tracks` - Stores user uploaded music files (if not exists)
    - `user_clips` - Stores user uploaded video clips (if not exists)
  
  2. New Types
    - `membership_type_enum` - Enum for membership types (free, early_adopter, paid)
  
  3. Functions
    - `handle_new_user()` - Automatically creates user profile on signup
    - `update_membership_limits()` - Updates video limits based on membership type
  
  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Create membership type enum
DO $$ BEGIN
  CREATE TYPE membership_type_enum AS ENUM ('free', 'early_adopter', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  membership_type membership_type_enum DEFAULT 'free' NOT NULL,
  video_generation_count integer DEFAULT 0 NOT NULL,
  video_generation_limit integer DEFAULT 3 NOT NULL, -- Free users get 3 videos
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
END $$;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, membership_type, video_generation_limit)
  VALUES (
    new.id,
    'free',
    CASE 
      WHEN new.email_confirmed_at IS NOT NULL THEN 3
      ELSE 3
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update video generation limits based on membership
CREATE OR REPLACE FUNCTION public.update_membership_limits()
RETURNS trigger AS $$
BEGIN
  -- Update video generation limits based on membership type
  CASE NEW.membership_type
    WHEN 'free' THEN
      NEW.video_generation_limit := 3;
    WHEN 'early_adopter' THEN
      NEW.video_generation_limit := 999999; -- Unlimited for early adopters
    WHEN 'paid' THEN
      NEW.video_generation_limit := 999999; -- Unlimited for paid users
  END CASE;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update limits when membership changes
DROP TRIGGER IF EXISTS update_membership_limits_trigger ON user_profiles;
CREATE TRIGGER update_membership_limits_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.membership_type IS DISTINCT FROM NEW.membership_type)
  EXECUTE FUNCTION public.update_membership_limits();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_type ON user_profiles(membership_type);

-- Create music_tracks table if it doesn't exist (for user music uploads)
CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on music_tracks
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them for music_tracks
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can access their own music tracks" ON music_tracks;
  DROP POLICY IF EXISTS "Users can insert their own music tracks" ON music_tracks;
END $$;

-- RLS Policies for music_tracks
CREATE POLICY "Users can access their own music tracks"
  ON music_tracks
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music tracks"
  ON music_tracks
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Create user_clips table if it doesn't exist (for user video clips)
CREATE TABLE IF NOT EXISTS user_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  thumbnail_url text,
  duration numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_clips
ALTER TABLE user_clips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them for user_clips
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create their own clips" ON user_clips;
  DROP POLICY IF EXISTS "Users can view their own clips" ON user_clips;
  DROP POLICY IF EXISTS "Users can update their own clips" ON user_clips;
  DROP POLICY IF EXISTS "Users can delete their own clips" ON user_clips;
END $$;

-- RLS Policies for user_clips
CREATE POLICY "Users can create their own clips"
  ON user_clips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own clips"
  ON user_clips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips"
  ON user_clips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON user_clips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update video_segments table to allow nullable timing fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_segments' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE video_segments ALTER COLUMN start_time DROP NOT NULL;
    ALTER TABLE video_segments ALTER COLUMN end_time DROP NOT NULL;
  END IF;
END $$;