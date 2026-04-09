
-- Add expiry_date to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS expiry_date date;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert settings"
ON public.platform_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete settings"
ON public.platform_settings FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
('featured_heading', 'Featured opportunities'),
('hero_subheading', 'Discover events, jobs, grants, programs, and wellbeing support — all in one place, built for young Victorians.'),
('show_regional_banner', 'true'),
('contact_email', ''),
('announcement_active', 'false'),
('announcement_text', ''),
('auto_expire_listings', 'true'),
('default_expiry_events', '30'),
('default_expiry_jobs', '60')
ON CONFLICT (key) DO NOTHING;

-- Create a function to list users for admin
CREATE OR REPLACE FUNCTION public.list_users()
RETURNS TABLE (
  id uuid,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE is_admin(auth.uid())
  ORDER BY u.created_at DESC;
$$;
