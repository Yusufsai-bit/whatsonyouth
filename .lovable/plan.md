
# What's On Youth — Improvement Pass

Ten changes grouped by area. Each is small enough to ship independently; order below is the recommended build order.

---

## 1. Live hero proof counter
Add a live stat strip just under the Hero headline:
> **412 opportunities right now · 38 added this week**

- Query `listings` where `is_active = true` for total count
- Query same with `created_at >= now() - 7 days` for weekly count
- Renders skeleton (`—`) while loading, then animates in
- Cached for 5 min via React Query (already in project)

## 2. Secondary nav item: "List an opportunity"
- Add a third nav link in `Navbar.tsx` between current items, styled as a subtle outlined CTA (not coral — coral is reserved for primary CTAs)
- Links to `/submit`
- Hidden on mobile menu? No — include in mobile drawer too
- Keeps `SubmitCallout` lower on page; this just gives partners a fast path

## 3. "New listings every day" messaging — global swap
Replace every "Tuesday and Friday" / "Tuesday/Friday digest" string with **"New listings every day"**:

- `src/pages/Index.tsx` — sr-only block + bottom section copy
- `src/components/Footer.tsx` (check)
- `src/components/SubmitCallout.tsx` (check)
- `src/components/HowItWorks.tsx` (check)
- `src/pages/AboutPage.tsx` (check)
- Any SEO meta in `SEO.tsx` defaults
- Add a thin top strip above Navbar: `🟣 New listings added every day` (dismissible, stored in localStorage)

## 4. Organisation profile pages
New route: `/org/:slug`

- Slug = url-safe version of `organisation` field (lowercase, hyphenated, deduped)
- Page shows: org name as H1, optional logo placeholder, count of active listings, grid of all their active listings
- Make organisation name a link (`<Link to={`/org/${slug}`}>`) on:
  - `ListingDetailPage.tsx` ("Listed by {organisation}")
  - Listing cards (the org line)
- SEO: title `"{Organisation} — Opportunities on What's On Youth"`, JSON-LD `Organization` block, included in sitemap
- Add to `scripts/sitemap-routes.mjs` to generate per-org URLs
- No new DB table needed — derive from `listings.organisation` (group by). If two orgs collide on slug, append a short hash.

## 5. Map view for events & programs
- Add a "Map" toggle on `SearchPage.tsx` and the Events/Programs `CategoryListingPage.tsx` (toggle between List / Map)
- Use Leaflet + OpenStreetMap tiles (free, no API key). Already a `react-leaflet` option; confirm bundle size acceptable.
- Geocode `location` field on listing creation/update via a new `geocode-listing` edge function (Nominatim — free, with rate limit + caching; store `lat`/`lng` columns on `listings`)
- Markers coloured by category. Click marker → mini card → "View listing"
- Empty state: "No listings have a mapped location yet"

**DB change:** add `latitude double precision`, `longitude double precision`, nullable, on `listings`. Backfill async.

## 6. Social share OG cards per listing
- New edge function `og-image` returns a PNG built with `@vercel/og` style or `satori` (Deno-compatible: `og_edge`)
- Layout: brand logo top-left, category pill in category colour, listing title (Plus Jakarta Sans), organisation + region at bottom, violet accent bar
- `ListingDetailPage.tsx` SEO sets `<meta property="og:image" content="https://.../functions/v1/og-image?id=…">`
- Cached at edge for 7 days

## 7. Footer impact strip
Add a row above existing footer columns:

> **10,000+ monthly visits · 500+ young people signed up · 5 regions covered · Free forever**

- Four stat tiles, dark background, large numbers in Plus Jakarta Sans
- Numbers stored as constants for now; can wire to live data later

## 8. Top trust strip
Thin bar above navbar:
> ✨ New listings added every day · Free for young people, free for partners

- Dismissible (localStorage flag)
- Replaces the existing "new listings since last visit" banner pattern? No — keep both; new-since-visit is contextual, this is evergreen. Place new-since-visit below this strip.

## 9. Accessibility audit — violet contrast
- Audit all uses of `text-brand-violet` (#5847E0) on white at <16px regular
- Where contrast fails AA (4.5:1), darken to `#4A3BC9` (passes) for body-size text only; keep #5847E0 for headings, buttons, and ≥16px bold
- Add a darker token `--brand-violet-text` to `index.css` and Tailwind config; apply via class swap (`text-brand-violet-text` for body links)
- Run `axe` via Playwright on the homepage as a smoke check

## 10. Recently-viewed empty state
- Confirm `RecentlyViewed.tsx` returns `null` when `recentIds` is empty (it does — verify and add a test)

---

## Technical section

**Files touched (high level):**
- `src/components/Hero.tsx` — counter
- `src/components/Navbar.tsx` — nav CTA + top strip
- `src/components/Footer.tsx` — impact strip + copy swap
- `src/pages/Index.tsx`, `SubmitCallout.tsx`, `HowItWorks.tsx`, `AboutPage.tsx` — copy swap
- `src/pages/OrgProfilePage.tsx` (new) + route in `App.tsx`
- `src/components/ListingCardImage.tsx` / listing cards — link org name
- `src/pages/SearchPage.tsx`, `CategoryListingPage.tsx` — map toggle
- `src/components/MapView.tsx` (new)
- `src/index.css`, `tailwind.config.ts` — `--brand-violet-text` token
- `supabase/functions/og-image/index.ts` (new)
- `supabase/functions/geocode-listing/index.ts` (new)
- DB migration: `latitude`, `longitude` on `listings`
- `scripts/sitemap-routes.mjs` — org URLs

**Build order recommended:**
1. Quick wins: copy swap, top strip, hero counter, nav CTA, footer strip, a11y token (1 batch)
2. Org profile pages (independent feature)
3. OG share cards (edge function)
4. Map view (largest, needs geocoding backfill)

**Out of scope (per your feedback):**
- Partner logo wall
- Splitting homepage into young-people/partners
- Category card imagery
- Wellbeing visual differentiation
- Email digest capture (removed in favour of "every day" messaging)

Ready to implement when you approve. I'll start with batch 1 (the quick wins) unless you want a different order.
