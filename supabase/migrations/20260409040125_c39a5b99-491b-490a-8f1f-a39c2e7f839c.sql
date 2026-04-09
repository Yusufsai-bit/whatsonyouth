
-- Fix 1: Restrict base table SELECT to owner-only (protects contact_email)
DROP POLICY "Authenticated users can view active listings" ON listings;
CREATE POLICY "Owners can view their own listings" ON listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Recreate listings_public view WITHOUT security_invoker so non-owners can browse
DROP VIEW IF EXISTS listings_public;
CREATE VIEW public.listings_public AS
  SELECT id, title, category, organisation, location, link, description, is_active, created_at
  FROM listings
  WHERE is_active = true;

-- Fix 3: Re-target INSERT policy to authenticated role
DROP POLICY "Authenticated users can create listings" ON listings;
CREATE POLICY "Authenticated users can create listings" ON listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 4: Re-target UPDATE policy to authenticated role
DROP POLICY "Users can update their own listings" ON listings;
CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Fix 5: Re-target DELETE policy to authenticated role
DROP POLICY "Users can delete their own listings" ON listings;
CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
