CREATE POLICY "Admins can update reports"
ON public.listing_reports
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (
  is_admin(auth.uid())
  AND status IN ('open', 'reviewing', 'resolved', 'dismissed')
  AND (admin_notes IS NULL OR length(admin_notes) <= 1000)
);