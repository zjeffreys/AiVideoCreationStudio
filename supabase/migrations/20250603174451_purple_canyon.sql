-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('character-avatars', 'character-avatars', true);

-- Allow authenticated users to upload avatars
create policy "Users can upload character avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatars
create policy "Users can update their character avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatars
create policy "Users can delete their character avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to read avatars
create policy "Character avatars are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'character-avatars');