-- Harden public newsletter subscription input at the database policy layer
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.digest_subscribers;
CREATE POLICY "Anyone can subscribe with a valid email"
ON public.digest_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email = lower(trim(email))
  AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

-- Harden public listing report input at the database policy layer
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.listing_reports;
CREATE POLICY "Anyone can report active listings with a valid reason"
ON public.listing_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(reason)) BETWEEN 3 AND 500
  AND EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = listing_reports.listing_id
      AND listings.is_active = true
  )
);