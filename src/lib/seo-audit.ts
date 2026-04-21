// Static manifest mirroring scripts/seo-check.mjs.
// Keep these in sync. The build-time script enforces this at compile time;
// this file powers the in-app /admin/seo diagnostics page.

export interface SeoManifestEntry {
  route: string;
  label: string;
  shouldIndex: boolean;
  // The URL we'd actually fetch in the browser to inspect the rendered head.
  // Most of these are real public routes; private ones are listed for completeness
  // but won't be probed unless the admin opts in.
  publicProbeUrl?: string;
}

const ORIGIN = 'https://www.whatsonyouth.org.au';

export const SEO_MANIFEST: SeoManifestEntry[] = [
  { route: '/', label: 'Home', shouldIndex: true, publicProbeUrl: `${ORIGIN}/` },
  { route: '/events', label: 'Events', shouldIndex: true, publicProbeUrl: `${ORIGIN}/events` },
  { route: '/jobs', label: 'Jobs', shouldIndex: true, publicProbeUrl: `${ORIGIN}/jobs` },
  { route: '/grants', label: 'Grants', shouldIndex: true, publicProbeUrl: `${ORIGIN}/grants` },
  { route: '/programs', label: 'Programs', shouldIndex: true, publicProbeUrl: `${ORIGIN}/programs` },
  { route: '/wellbeing', label: 'Wellbeing', shouldIndex: true, publicProbeUrl: `${ORIGIN}/wellbeing` },
  { route: '/melbourne', label: 'Melbourne', shouldIndex: true, publicProbeUrl: `${ORIGIN}/melbourne` },
  { route: '/geelong', label: 'Geelong', shouldIndex: true, publicProbeUrl: `${ORIGIN}/geelong` },
  { route: '/ballarat', label: 'Ballarat', shouldIndex: true, publicProbeUrl: `${ORIGIN}/ballarat` },
  { route: '/bendigo', label: 'Bendigo', shouldIndex: true, publicProbeUrl: `${ORIGIN}/bendigo` },
  { route: '/gippsland', label: 'Gippsland', shouldIndex: true, publicProbeUrl: `${ORIGIN}/gippsland` },
  { route: '/shepparton', label: 'Shepparton', shouldIndex: true, publicProbeUrl: `${ORIGIN}/shepparton` },
  { route: '/search', label: 'Search', shouldIndex: true, publicProbeUrl: `${ORIGIN}/search` },
  { route: '/about', label: 'About', shouldIndex: true, publicProbeUrl: `${ORIGIN}/about` },
  { route: '/contact', label: 'Contact', shouldIndex: true, publicProbeUrl: `${ORIGIN}/contact` },
  { route: '/privacy', label: 'Privacy', shouldIndex: true, publicProbeUrl: `${ORIGIN}/privacy` },
  // Private — must be noindex
  { route: '/submit', label: 'Submit', shouldIndex: false },
  { route: '/login', label: 'Login', shouldIndex: false },
  { route: '/signup', label: 'Signup', shouldIndex: false },
  { route: '/account', label: 'Account', shouldIndex: false },
  { route: '/saved', label: 'Saved listings', shouldIndex: false },
  { route: '/forgot-password', label: 'Forgot password', shouldIndex: false },
  { route: '/reset-password', label: 'Reset password', shouldIndex: false },
];

export type Severity = 'error' | 'warning';

export interface SeoIssue {
  route: string;
  label: string;
  severity: Severity;
  message: string;
}

interface RouteAuditResult {
  route: string;
  label: string;
  shouldIndex: boolean;
  status: 'ok' | 'fail' | 'skipped';
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  issues: SeoIssue[];
}

/**
 * Audits the CURRENT in-page <head> for the route the admin is on.
 * The admin tool also navigates to each route in turn (see runRouteAudit).
 */
export function auditCurrentDocument(entry: SeoManifestEntry): RouteAuditResult {
  const issues: SeoIssue[] = [];

  const title = document.title?.trim() || '';
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  const canonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
  const robots =
    document.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim().toLowerCase() ||
    '';

  if (!title) issues.push({ route: entry.route, label: entry.label, severity: 'error', message: 'Missing <title>' });
  else if (title.length < 10)
    issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Title is very short (${title.length} chars)` });
  else if (title.length > 70)
    issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Title is too long (${title.length} chars, recommend ≤70)` });

  if (!description)
    issues.push({ route: entry.route, label: entry.label, severity: 'error', message: 'Missing meta description' });
  else if (description.length < 50)
    issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Description is very short (${description.length} chars)` });
  else if (description.length > 170)
    issues.push({ route: entry.route, label: entry.label, severity: 'warning', message: `Description is too long (${description.length} chars, recommend ≤170)` });

  // Robots / canonical rules
  const isNoindex = robots.includes('noindex');
  if (entry.shouldIndex) {
    if (isNoindex) {
      issues.push({
        route: entry.route,
        label: entry.label,
        severity: 'error',
        message: `Page is publicly indexable but robots meta is "${robots}" — remove noindex`,
      });
    }
    if (!canonical) {
      issues.push({
        route: entry.route,
        label: entry.label,
        severity: 'error',
        message: 'Missing canonical link on indexable page',
      });
    }
  } else {
    if (!isNoindex) {
      issues.push({
        route: entry.route,
        label: entry.label,
        severity: 'error',
        message: `Private route should be noindex but robots meta is "${robots || '(missing)'}"`,
      });
    }
  }

  return {
    route: entry.route,
    label: entry.label,
    shouldIndex: entry.shouldIndex,
    status: issues.some((i) => i.severity === 'error') ? 'fail' : 'ok',
    title,
    description,
    canonical,
    robots,
    issues,
  };
}

export type { RouteAuditResult };
