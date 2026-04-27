CREATE TYPE public.credit_usage_type AS ENUM ('chat_message', 'build_action', 'scanner_run', 'cloud_ai', 'cloud_runtime');

CREATE TABLE public.credit_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_type public.credit_usage_type NOT NULL,
  amount numeric(12, 4),
  spent_at timestamp with time zone NOT NULL DEFAULT now(),
  actor_user_id uuid,
  related_table text,
  related_id text,
  run_url text,
  scan_session_id text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_credit_usage_log_spent_at ON public.credit_usage_log (spent_at DESC);
CREATE INDEX idx_credit_usage_log_credit_type ON public.credit_usage_log (credit_type);
CREATE INDEX idx_credit_usage_log_scan_session_id ON public.credit_usage_log (scan_session_id) WHERE scan_session_id IS NOT NULL;

CREATE POLICY "Admins can view credit usage log"
ON public.credit_usage_log
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create credit usage log entries"
ON public.credit_usage_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update credit usage log entries"
ON public.credit_usage_log
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete credit usage log entries"
ON public.credit_usage_log
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can manage credit usage log"
ON public.credit_usage_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);