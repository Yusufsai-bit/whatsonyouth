
-- 1. Create admins table
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can read their own row (for access check)
CREATE POLICY "Users can check own admin status" ON public.admins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Add new columns to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT 0;

-- 3. Create listing-images storage bucket with public read
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- Public can read listing images
CREATE POLICY "Listing images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload listing images
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

-- Authenticated users can update their listing images
CREATE POLICY "Authenticated users can update listing images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-images');

-- Authenticated users can delete listing images
CREATE POLICY "Authenticated users can delete listing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images');

-- 4. Admin needs full CRUD on listings - add policy for admins
-- Create a function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = _user_id
  )
$$;

-- Admin can SELECT all listings
CREATE POLICY "Admins can view all listings" ON public.listings
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can UPDATE any listing
CREATE POLICY "Admins can update all listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can DELETE any listing
CREATE POLICY "Admins can delete any listing" ON public.listings
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can INSERT listings
CREATE POLICY "Admins can insert listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
