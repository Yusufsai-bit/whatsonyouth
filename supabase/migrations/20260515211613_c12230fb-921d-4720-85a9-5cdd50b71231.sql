
ALTER TABLE public.scan_sources
  ADD COLUMN IF NOT EXISTS trust_level text NOT NULL DEFAULT 'trusted'
    CHECK (trust_level IN ('trusted','untrusted')),
  ADD COLUMN IF NOT EXISTS daily_publish_cap integer NOT NULL DEFAULT 25;

INSERT INTO public.platform_settings (key, value)
VALUES ('scanner_min_quality_score', '60')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings (key, value)
VALUES ('scanner_domain_allowlist', '["eventbrite.com.au","humanitix.com","trybooking.com"]')
ON CONFLICT (key) DO UPDATE
  SET value = CASE
    WHEN platform_settings.value IS NULL OR platform_settings.value = '' OR platform_settings.value = '[]'
      THEN EXCLUDED.value
    ELSE platform_settings.value
  END,
  updated_at = now();
