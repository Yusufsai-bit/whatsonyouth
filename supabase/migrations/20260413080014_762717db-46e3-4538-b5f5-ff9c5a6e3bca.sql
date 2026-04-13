
ALTER TABLE public.scan_log 
  ADD COLUMN IF NOT EXISTS scan_session_id text;

CREATE INDEX IF NOT EXISTS idx_scan_log_session_id ON public.scan_log(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_scan_log_source_url ON public.scan_log(source_url);
CREATE INDEX IF NOT EXISTS idx_listings_link ON public.listings(link);

UPDATE public.listings 
SET is_active = false
WHERE description ILIKE '[Link needs review]%'
  AND is_active = true;

UPDATE public.listings 
SET is_active = false
WHERE expiry_date < CURRENT_DATE 
  AND is_active = true;
