
CREATE TABLE public.listing_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a report
CREATE POLICY "Anyone can insert reports"
ON public.listing_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Only admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.listing_reports
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
