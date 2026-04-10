
-- Create scan_sources table
CREATE TABLE public.scan_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view scan sources"
  ON public.scan_sources FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert scan sources"
  ON public.scan_sources FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update scan sources"
  ON public.scan_sources FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete scan sources"
  ON public.scan_sources FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access to scan_sources"
  ON public.scan_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed data
INSERT INTO public.scan_sources (name, url, category, is_active) VALUES
('Creative Victoria — Grants', 'https://creative.vic.gov.au/grants-and-support/find-a-grant', 'Grants', true),
('Creative Victoria — Funding Opportunities', 'https://creative.vic.gov.au/funding-opportunities', 'Grants', true),
('Vic.gov.au — All State Grants', 'https://www.vic.gov.au/grants-and-programs', 'Grants', true),
('Business Victoria — Grants Finder', 'https://business.vic.gov.au/grants-and-programs', 'Grants', true),
('Regional Development Victoria', 'https://rdv.vic.gov.au/funding-programs', 'Grants', true),
('VicHealth — Active Funding Rounds', 'https://www.vichealth.vic.gov.au/funding', 'Grants', true),
('Community Sector Banking — Grants Finder', 'https://www.communitysectorbanking.com.au/grants-finder', 'Grants', true),
('Foundation for Rural and Regional Renewal', 'https://frrr.org.au/funding/', 'Grants', true),
('Lord Mayors Charitable Foundation', 'https://www.lmcf.org.au/grants/', 'Grants', true),
('GrantConnect — Current Opportunities', 'https://www.grants.gov.au/Go/List', 'Grants', true),
('Business.gov.au — Grants and Programs', 'https://business.gov.au/grants-and-programs', 'Grants', true),
('Community Grants Hub — Open Grants', 'https://www.communitygrants.gov.au/grants', 'Grants', true),
('Austrade — EMDG Grant', 'https://www.austrade.gov.au/en/how-we-can-help/grants-programs/export-market-development-grants', 'Grants', true),
('The Grants Hub — Directory', 'https://www.thegrantshub.com.au/', 'Grants', true),
('Youth Affairs Council Victoria', 'https://www.yacvic.org.au/resources/', 'Programs', true),
('Engage Victoria — Youth Consultations', 'https://engage.vic.gov.au/', 'Programs', true),
('Youth Central — Youth Programs', 'https://www.youthcentral.vic.gov.au/get-involved/youth-programs', 'Programs', true),
('YMCA Victoria', 'https://www.ymca.org.au/programs/youth-programs', 'Programs', true),
('AFL Victoria — Youth Programs', 'https://www.afl.com.au/vic/programs/youth', 'Programs', true),
('Sport and Recreation Victoria', 'https://sport.vic.gov.au/programs-and-projects/programs', 'Programs', true),
('Duke of Edinburgh — Victoria', 'https://dukeofed.com.au/', 'Programs', true),
('Australian Youth Forum', 'https://www.australianyouthforum.org.au/', 'Programs', true),
('Vic Government Jobs — Graduate Programs', 'https://careers.vic.gov.au/content/graduate-programs', 'Jobs', true),
('SEEK — Entry Level Melbourne', 'https://www.seek.com.au/jobs/in-melbourne-vic/?classification=6281&worktype=243', 'Jobs', true),
('Youth Employment Scheme Victoria', 'https://yes.vic.gov.au/', 'Jobs', true),
('Whats On Melbourne', 'https://whatson.melbourne.vic.gov.au/', 'Events', true),
('Visit Victoria — Whats On', 'https://www.visitvictoria.com/whats-on', 'Events', true),
('La Trobe City — Whats On', 'https://latrobecity.com.au/whats-on/', 'Events', true),
('Geelong Australia — Events', 'https://www.geelongaustralia.com.au/events/default.aspx', 'Events', true),
('Visit Ballarat — Whats On', 'https://www.visitballarat.com.au/whats-on', 'Events', true),
('Bendigo — Events', 'https://www.bendigo.vic.gov.au/events', 'Events', true),
('Shepparton and Goulburn Valley', 'https://sheppandgv.com.au/', 'Events', true),
('Wodonga — Whats On', 'https://www.wodonga.vic.gov.au/Whats-On', 'Events', true),
('Events Mildura', 'https://eventsmildura.com.au/', 'Events', true),
('Warrnambool — Whats On', 'https://visitgreatoceanroad.org.au/visitwarrnambool/whats-on/', 'Events', true),
('Frankston — Whats On', 'https://www.frankston.vic.gov.au/Things-To-Do/Whats-On', 'Events', true),
('headspace — Find a Service', 'https://headspace.org.au/headspace-centres/', 'Wellbeing', true),
('ReachOut Australia', 'https://au.reachout.com/', 'Wellbeing', true),
('Beyond Blue — Youth', 'https://www.beyondblue.org.au/who-does-it-affect/young-people', 'Wellbeing', true),
('orygen — Youth Mental Health', 'https://www.orygen.org.au/', 'Wellbeing', true);
