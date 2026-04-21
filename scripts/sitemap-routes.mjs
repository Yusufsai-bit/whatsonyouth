// Single source of truth for static public routes.
// Used by:
//   - scripts/generate-sitemap.mjs  (writes public/sitemap.xml at build time)
//   - scripts/seo-check.mjs         (validates these routes have correct meta)
//
// To add a new public page: add it here, then add the matching <Route> in
// src/App.tsx and the <SEO> tag with title/description/canonical on the page.

export const ORIGIN = 'https://www.whatsonyouth.org.au';

// shouldIndex = false → page is private (auth/utility). Will be added to the
// SEO check (must be noindex) but EXCLUDED from sitemap.xml.
export const STATIC_ROUTES = [
  // Top-level
  { route: '/', file: 'pages/Index.tsx', shouldIndex: true, changefreq: 'daily', priority: 1.0 },

  // Categories
  { route: '/events', file: 'pages/CategoryListingPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.9 },
  { route: '/jobs', file: 'pages/CategoryListingPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.9 },
  { route: '/grants', file: 'pages/CategoryListingPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.9 },
  { route: '/programs', file: 'pages/CategoryListingPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.9 },
  { route: '/wellbeing', file: 'pages/CategoryListingPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.9 },

  // Regional landing pages
  { route: '/melbourne', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.8 },
  { route: '/geelong', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.7 },
  { route: '/ballarat', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.7 },
  { route: '/bendigo', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.7 },
  { route: '/gippsland', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.7 },
  { route: '/shepparton', file: 'pages/RegionalPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.7 },

  // Bare /search is included so the entry-point is discoverable, but at low
  // priority — category and regional landing pages are the canonical surfaces
  // for filter combinations (filtered /search URLs canonicalize back to them).
  // Filtered /search permutations are deliberately excluded until Search Console
  // popularity data tells us which combinations are worth advertising.
  { route: '/search', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5 },

  // Listing detail pattern — covered by the dynamic listings sitemap (edge function)
  { route: '/listings/:id', file: 'pages/ListingDetailPage.tsx', shouldIndex: true, sitemapOnly: false, excludeFromStaticSitemap: true },

  // Static informational pages
  { route: '/about', file: 'pages/AboutPage.tsx', shouldIndex: true, changefreq: 'monthly', priority: 0.6 },
  { route: '/contact', file: 'pages/ContactPage.tsx', shouldIndex: true, changefreq: 'monthly', priority: 0.5 },
  { route: '/privacy', file: 'pages/PrivacyPage.tsx', shouldIndex: true, changefreq: 'yearly', priority: 0.3 },

  // Private routes — must be noindex, EXCLUDED from sitemap
  { route: '/submit', file: 'pages/SubmitPage.tsx', shouldIndex: false },
  { route: '/login', file: 'pages/LoginPage.tsx', shouldIndex: false },
  { route: '/signup', file: 'pages/SignupPage.tsx', shouldIndex: false },
  { route: '/forgot-password', file: 'pages/ForgotPasswordPage.tsx', shouldIndex: false },
  { route: '/reset-password', file: 'pages/ResetPasswordPage.tsx', shouldIndex: false },
  { route: '/account', file: 'pages/AccountPage.tsx', shouldIndex: false },
  { route: '/saved', file: 'pages/SavedListingsPage.tsx', shouldIndex: false },
  { route: '/listings/:id/edit', file: 'pages/EditListingPage.tsx', shouldIndex: false },
];
