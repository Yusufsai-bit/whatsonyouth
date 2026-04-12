ALTER TABLE public.scan_log ADD COLUMN IF NOT EXISTS images_resolved integer DEFAULT 0;
ALTER TABLE public.scan_log ADD COLUMN IF NOT EXISTS images_from_unsplash integer DEFAULT 0;
ALTER TABLE public.scan_log ADD COLUMN IF NOT EXISTS images_pending integer DEFAULT 0;