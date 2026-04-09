
CREATE TABLE public.scan_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  source_url text NOT NULL,
  listings_found integer NOT NULL DEFAULT 0,
  listings_created integer NOT NULL DEFAULT 0,
  listings_skipped integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text
);

ALTER TABLE public.scan_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scan logs"
  ON public.scan_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert scan logs"
  ON public.scan_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update scan logs"
  ON public.scan_log FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete scan logs"
  ON public.scan_log FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow service role (edge functions) to read/write scan_log
CREATE POLICY "Service role full access to scan_log"
  ON public.scan_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert listings (for the edge function)
CREATE POLICY "Service role can insert listings"
  ON public.listings FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read listings (for duplicate check)
CREATE POLICY "Service role can read listings"
  ON public.listings FOR SELECT
  TO service_role
  USING (true);
