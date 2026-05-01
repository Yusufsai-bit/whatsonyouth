-- Backfill missing expiries on time-sensitive categories before adding validation
UPDATE public.listings
SET expiry_date = (current_date + interval '60 days')::date
WHERE category IN ('Events','Jobs','Grants') AND expiry_date IS NULL;

-- 1. Click tracking table
CREATE TABLE public.listing_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent_hash text,
  ip_hash text
);
CREATE INDEX idx_listing_clicks_listing ON public.listing_clicks(listing_id, clicked_at DESC);
ALTER TABLE public.listing_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view clicks" ON public.listing_clicks
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access clicks" ON public.listing_clicks
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can record a click for active listings" ON public.listing_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_clicks.listing_id AND listings.is_active = true));

-- 2. Provider contact email column
ALTER TABLE public.listings ADD COLUMN provider_contact_email text;

-- 3. Expiry validation trigger (only on insert, or when category/expiry changes)
CREATE OR REPLACE FUNCTION public.validate_listing_expiry()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.category IN ('Events','Jobs','Grants') AND NEW.expiry_date IS NULL THEN
    IF TG_OP = 'INSERT'
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.expiry_date IS DISTINCT FROM OLD.expiry_date THEN
      RAISE EXCEPTION 'expiry_date is required for category %', NEW.category;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_listing_expiry
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.validate_listing_expiry();

-- 4. Improved fingerprint
CREATE OR REPLACE FUNCTION public.listing_duplicate_fingerprint(_title text, _organisation text, _link text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT md5(
    regexp_replace(lower(coalesce(_link,'')), '^https?://(www\.)?([^/]+).*$', '\2', 'i') || '|' ||
    regexp_replace(lower(coalesce(_organisation,'')), '[^a-z0-9]+', '', 'g') || '|' ||
    coalesce((
      SELECT string_agg(tok, ' ' ORDER BY tok)
      FROM unnest(regexp_split_to_array(lower(coalesce(_title,'')), '[^a-z0-9]+')) AS tok
      WHERE length(tok) >= 4
    ), '')
  );
$$;

UPDATE public.listings
SET duplicate_fingerprint = public.listing_duplicate_fingerprint(title, organisation, link);

-- 6. Tighten list_users()
REVOKE EXECUTE ON FUNCTION public.list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;

-- 7. Quality trigger
DROP TRIGGER IF EXISTS trg_listing_quality ON public.listings;
CREATE TRIGGER trg_listing_quality
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.set_listing_quality_fields();