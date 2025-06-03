/*
  # Storage setup for character avatars
  
  1. Storage
    - Creates character-avatars bucket if it doesn't exist
    - Sets up public access for the bucket
  
  2. Security
    - Adds policies for authenticated users to manage their avatars
    - Adds policy for public read access to avatars
*/

DO $$
BEGIN
  -- Create the storage bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'character-avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('character-avatars', 'character-avatars', true);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload character avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their character avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their character avatars" ON storage.objects;
DROP POLICY IF EXISTS "Character avatars are publicly accessible" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload character avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their character avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their character avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to read avatars
CREATE POLICY "Character avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-avatars');