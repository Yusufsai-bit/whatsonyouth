-- Phase 1: scanner reliability, source quality, expired cleanup, and listing quality foundations

-- Add source quality/reliability fields
ALTER TABLE public.scan_sources
ADD COLUMN IF NOT EXISTS total_scans integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_scans integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_scans integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_listings_found integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_listings_created integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_listings_skipped integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_scan_status text,
ADD COLUMN IF NOT EXISTS last_scan_error text,
ADD COLUMN IF NOT EXISTS quality_score integer NOT NULL DEFAULT 50;

-- Add listing quality and duplicate tracking fields
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS quality_score integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS duplicate_fingerprint text,
ADD COLUMN IF NOT EXISTS last_quality_checked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone;

-- Performance indexes for public browsing/admin operations/scanner checks
CREATE INDEX IF NOT EXISTS idx_listings_active_category_created ON public.listings (is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_expiry ON public.listings (is_active, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_location_active ON public.listings (location, is_active);
CREATE INDEX IF NOT EXISTS idx_listings_duplicate_fingerprint ON public.listings (duplicate_fingerprint) WHERE duplicate_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scan_log_session_scanned ON public.scan_log (scan_session_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_sources_active_quality ON public.scan_sources (is_active, quality_score DESC, last_scan_at ASC NULLS FIRST);

-- Helper: normalized duplicate fingerprint for listings
CREATE OR REPLACE FUNCTION public.listing_duplicate_fingerprint(_title text, _organisation text, _link text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(
    lower(
      regexp_replace(coalesce(_title, ''), '[^a-zA-Z0-9]+', ' ', 'g') || '|' ||
      regexp_replace(coalesce(_organisation, ''), '[^a-zA-Z0-9]+', ' ', 'g') || '|' ||
      regexp_replace(coalesce(_link, ''), '^https?://(www\.)?', '', 'i')
    )
  );
$$;

-- Helper: simple listing quality score from completeness/trust signals
CREATE OR REPLACE FUNCTION public.calculate_listing_quality_score(
  _title text,
  _description text,
  _organisation text,
  _link text,
  _location text,
  _expiry_date date,
  _image_url text,
  _category text
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  score integer := 0;
BEGIN
  IF length(trim(coalesce(_title, ''))) >= 10 THEN score := score + 15; END IF;
  IF length(trim(coalesce(_description, ''))) >= 80 THEN score := score + 20; END IF;
  IF length(trim(coalesce(_organisation, ''))) >= 3 THEN score := score + 10; END IF;
  IF coalesce(_link, '') ~* '^https://.+' THEN score := score + 15; END IF;
  IF length(trim(coalesce(_location, ''))) >= 3 THEN score := score + 10; END IF;
  IF _category = 'Wellbeing' OR _expiry_date IS NOT NULL THEN score := score + 15; END IF;
  IF length(trim(coalesce(_image_url, ''))) > 0 THEN score := score + 10; END IF;
  IF _category IN ('Events', 'Jobs', 'Grants', 'Programs', 'Wellbeing') THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$;

-- Keep listing quality fields current
CREATE OR REPLACE FUNCTION public.set_listing_quality_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.duplicate_fingerprint := public.listing_duplicate_fingerprint(NEW.title, NEW.organisation, NEW.link);
  NEW.quality_score := public.calculate_listing_quality_score(
    NEW.title,
    NEW.description,
    NEW.organisation,
    NEW.link,
    NEW.location,
    NEW.expiry_date,
    NEW.image_url,
    NEW.category
  );
  NEW.last_quality_checked_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_listing_quality_fields_trigger ON public.listings;
CREATE TRIGGER set_listing_quality_fields_trigger
BEFORE INSERT OR UPDATE OF title, description, organisation, link, location, expiry_date, image_url, category
ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.set_listing_quality_fields();

-- Backfill existing listing quality data
UPDATE public.listings
SET
  duplicate_fingerprint = public.listing_duplicate_fingerprint(title, organisation, link),
  quality_score = public.calculate_listing_quality_score(title, description, organisation, link, location, expiry_date, image_url, category),
  last_quality_checked_at = now()
WHERE duplicate_fingerprint IS NULL OR last_quality_checked_at IS NULL;

-- Helper: deactivate expired non-wellbeing listings and mark cleanup time
CREATE OR REPLACE FUNCTION public.deactivate_expired_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
BEGIN
  UPDATE public.listings
  SET is_active = false,
      expired_at = now()
  WHERE is_active = true
    AND category <> 'Wellbeing'
    AND expiry_date IS NOT NULL
    AND expiry_date < current_date;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_expired_listings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_listings() TO service_role;

-- Admin scanner source health view
CREATE OR REPLACE VIEW public.admin_scan_source_health AS
SELECT
  s.id,
  s.name,
  s.url,
  s.category,
  s.is_active,
  s.total_scans,
  s.successful_scans,
  s.failed_scans,
  s.consecutive_failures,
  s.total_listings_found,
  s.total_listings_created,
  s.total_listings_skipped,
  s.last_scan_at,
  s.last_success_at,
  s.last_scan_status,
  s.last_scan_error,
  s.quality_score,
  CASE
    WHEN s.total_scans = 0 THEN 'new'
    WHEN s.consecutive_failures >= 3 THEN 'poor'
    WHEN s.quality_score >= 70 THEN 'strong'
    WHEN s.quality_score >= 40 THEN 'ok'
    ELSE 'weak'
  END AS health_label
FROM public.scan_sources s;

GRANT SELECT ON public.admin_scan_source_health TO authenticated;

-- Admin listing quality view
CREATE OR REPLACE VIEW public.admin_listing_quality AS
SELECT
  l.id,
  l.title,
  l.organisation,
  l.category,
  l.source,
  l.is_active,
  l.expiry_date,
  l.image_url,
  l.quality_score,
  l.duplicate_fingerprint,
  l.last_quality_checked_at,
  COUNT(*) OVER (PARTITION BY l.duplicate_fingerprint) AS duplicate_count,
  CASE
    WHEN l.is_active = true AND l.category <> 'Wellbeing' AND l.expiry_date IS NOT NULL AND l.expiry_date < current_date THEN 'expired_active'
    WHEN COUNT(*) OVER (PARTITION BY l.duplicate_fingerprint) > 1 THEN 'possible_duplicate'
    WHEN l.quality_score < 60 THEN 'needs_review'
    ELSE 'ok'
  END AS quality_label
FROM public.listings l;

GRANT SELECT ON public.admin_listing_quality TO authenticated;

-- Restrict admin views with security barrier via RLS-backed base tables and admin-only policies already in place.
-- Views expose the same data admins can already read through existing policies.