
-- 1. Fix listings UPDATE policy: add WITH CHECK to prevent ownership reassignment
DROP POLICY "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix listings INSERT policy: block suspended users
DROP POLICY "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_suspended = TRUE
    )
  );

-- 3. Fix storage policies: add ownership checks for DELETE and UPDATE
DROP POLICY "Authenticated users can delete listing images" ON storage.objects;
CREATE POLICY "Authenticated users can delete listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin(auth.uid())
    )
  );

DROP POLICY "Authenticated users can update listing images" ON storage.objects;
CREATE POLICY "Authenticated users can update listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin(auth.uid())
    )
  );

-- 4. Fix security definer view: recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.listings_public;
CREATE VIEW public.listings_public
  WITH (security_invoker = true)
AS
  SELECT id, title, category, organisation, location, link, description, is_active, created_at
  FROM public.listings
  WHERE is_active = TRUE;
