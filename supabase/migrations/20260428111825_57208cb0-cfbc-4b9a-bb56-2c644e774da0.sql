-- Phase 4: trust, moderation, and admin audit logging

ALTER TABLE public.listing_reports
ADD COLUMN IF NOT EXISTS reason_category text NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.listing_reports
DROP CONSTRAINT IF EXISTS listing_reports_reason_category_check;
ALTER TABLE public.listing_reports
ADD CONSTRAINT listing_reports_reason_category_check
CHECK (reason_category IN ('broken_link', 'expired', 'incorrect_info', 'unsafe_or_spam', 'other'));

ALTER TABLE public.listing_reports
DROP CONSTRAINT IF EXISTS listing_reports_status_check;
ALTER TABLE public.listing_reports
ADD CONSTRAINT listing_reports_status_check
CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed'));

CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created ON public.listing_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON public.listing_reports (listing_id);

DROP POLICY IF EXISTS "Anyone can report active listings with a valid reason" ON public.listing_reports;
CREATE POLICY "Anyone can report active listings with valid details"
ON public.listing_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  reason_category IN ('broken_link', 'expired', 'incorrect_info', 'unsafe_or_spam', 'other')
  AND status = 'open'
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
  AND admin_notes IS NULL
  AND length(trim(reason)) >= 3
  AND length(trim(reason)) <= 500
  AND EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = listing_reports.listing_id
      AND listings.is_active = true
  )
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create audit log entries"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Service role can manage audit log"
ON public.admin_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON public.admin_audit_log (entity_table, entity_id);

CREATE OR REPLACE FUNCTION public.write_admin_audit_log(
  _action text,
  _entity_table text,
  _entity_id text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.admin_audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  VALUES (auth.uid(), left(_action, 100), left(_entity_table, 100), left(_entity_id, 200), coalesce(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.write_admin_audit_log(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_admin_audit_log(text, text, text, jsonb) TO authenticated;