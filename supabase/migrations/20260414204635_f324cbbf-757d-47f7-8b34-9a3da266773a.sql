
-- Add view_count to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create digest_subscribers table
CREATE TABLE public.digest_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digest_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.digest_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.digest_subscribers FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete subscribers" ON public.digest_subscribers FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Create increment_listing_views function
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings SET view_count = view_count + 1 WHERE id = listing_id;
$$;
