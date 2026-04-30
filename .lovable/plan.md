## Goal

1. Replace every `contact_email` on the site with **info@whatsonyouth.org.au**.
2. On listing cards/detail pages, replace the generic "Curated by WOY" / "Curated by What's On Youth" badge with the **organisation name** — but only for admin/scanner-created listings (`source = 'admin'`). User submissions keep "Submitted by community".

Yes, this makes sense. Here's exactly what changes.

---

## Part 1 — Update all contact emails to info@whatsonyouth.org.au

**Database (data update):**
- Update every row in `listings.contact_email` to `info@whatsonyouth.org.au`. Currently 16 distinct emails are in use across 335 listings (incl. `hello@whatsonyouth.org.au`, lsv.com.au addresses, kids helpline, etc). All become `info@whatsonyouth.org.au`.
- Update `platform_settings` row where `key = 'contact_email'` to the same value.

**Code defaults (so future inserts also use info@):**
- `supabase/functions/scan-listings/index.ts` — change default fallback email from `hello@whatsonyouth.org.au` → `info@whatsonyouth.org.au`.
- Any other edge function referencing `hello@whatsonyouth.org.au` for inserts (`pillar-listings-import`, etc. — I'll grep and fix).
- Update memory file `mem://index.md` and any feature memory referencing `hello@whatsonyouth.org.au` to use `info@whatsonyouth.org.au`.

**Not changed:** the user-submission form (`SubmitPage.tsx`) still lets community submitters provide their own contact email — that's correct behaviour. This change only affects admin/scanner-curated listings and the platform's own contact setting.

---

## Part 2 — Show organisation name instead of "Curated by WOY"

Currently 4 spots render the static "Curated by WOY" / "Curated by What's On Youth" label:

| File | Line | Current |
|---|---|---|
| `src/pages/CategoryListingPage.tsx` | 625 | "Curated by WOY" |
| `src/pages/SearchPage.tsx` | 436 | "Curated by WOY" |
| `src/components/FeaturedOpportunities.tsx` | 102 | "Curated by WOY" |
| `src/pages/ListingDetailPage.tsx` | 204, 334 | "Curated by What's On Youth" |

**New logic (applied to all 4 spots):**
```
if (source === 'user') → "Submitted by community"
if (source === 'admin') → `By ${organisation}`   // e.g. "By headspace", "By Scouts Victoria"
```

The `organisation` field is already required on every listing and already fetched in each of these views, so no extra queries needed.

---

## Files changed

1. `supabase/functions/scan-listings/index.ts` — default email constant
2. Any other edge function with `hello@whatsonyouth.org.au` (will sweep)
3. `src/pages/CategoryListingPage.tsx` — replace badge text with org-aware logic
4. `src/pages/SearchPage.tsx` — same
5. `src/components/FeaturedOpportunities.tsx` — same
6. `src/pages/ListingDetailPage.tsx` — update `sourceLabel` + line 334 badge
7. `mem://index.md` — update pillar contact email rule
8. DB: bulk UPDATE on `listings.contact_email` + `platform_settings.contact_email`

---

## Verification after changes

- Run a `SELECT DISTINCT contact_email FROM listings` → should return only `info@whatsonyouth.org.au`.
- Spot-check a curated listing card — should now read e.g. "By Scouts Victoria" instead of "Curated by WOY".
- Spot-check a community-submitted listing — should still read "Submitted by community".

Approve and I'll implement it end-to-end.

---

**Credits used this response:** ~1 message credit (planning only, read-only tools).