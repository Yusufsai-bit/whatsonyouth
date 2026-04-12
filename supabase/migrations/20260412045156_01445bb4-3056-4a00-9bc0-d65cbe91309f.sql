
-- 1. Block any authenticated INSERT on admins table
CREATE POLICY "No authenticated inserts on admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 2. Fix storage INSERT policy to scope uploads to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
