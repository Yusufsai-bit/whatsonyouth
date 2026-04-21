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

  // Search + filtered combos (high-value Google discovery URLs)
  { route: '/search', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.8 },
  { route: '/search?category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.6, sitemapOnly: true },
  { route: '/search?category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.6, sitemapOnly: true },
  { route: '/search?category=Grants', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.6, sitemapOnly: true },
  { route: '/search?category=Programs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.6, sitemapOnly: true },
  { route: '/search?category=Wellbeing', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.6, sitemapOnly: true },
  { route: '/search?location=Melbourne', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.6, sitemapOnly: true },
  { route: '/search?location=Geelong', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Ballarat', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Bendigo', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Gippsland', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Shepparton', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Melbourne&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Melbourne&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'daily', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Melbourne&category=Grants', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Melbourne&category=Programs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Melbourne&category=Wellbeing', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.5, sitemapOnly: true },
  { route: '/search?location=Geelong&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Geelong&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Geelong&category=Programs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Ballarat&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Ballarat&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Ballarat&category=Programs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Bendigo&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Bendigo&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Bendigo&category=Programs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Gippsland&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Gippsland&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Shepparton&category=Events', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },
  { route: '/search?location=Shepparton&category=Jobs', file: 'pages/SearchPage.tsx', shouldIndex: true, changefreq: 'weekly', priority: 0.4, sitemapOnly: true },

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
