
-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

-- Create a restricted SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can view active listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create a public view excluding sensitive fields
CREATE VIEW public.listings_public
WITH (security_invoker = on) AS
SELECT
  id,
  title,
  category,
  organisation,
  location,
  link,
  description,
  is_active,
  created_at
FROM public.listings
WHERE is_active = true;

-- Allow anyone (including unauthenticated) to read the public view
GRANT SELECT ON public.listings_public TO anon, authenticated;
