CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);