-- Track rejected/deactivated sources so AI never re-suggests them
CREATE TABLE public.rejected_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  reason TEXT NOT NULL,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_rejected_sources_domain ON public.rejected_sources(domain);

ALTER TABLE public.rejected_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rejected sources"
  ON public.rejected_sources FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert rejected sources"
  ON public.rejected_sources FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update rejected sources"
  ON public.rejected_sources FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete rejected sources"
  ON public.rejected_sources FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access to rejected_sources"
  ON public.rejected_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Augment scan_sources with discovery + health-tracking metadata
ALTER TABLE public.scan_sources
  ADD COLUMN discovered_by_ai BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN discovered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_success_at TIMESTAMP WITH TIME ZONE;