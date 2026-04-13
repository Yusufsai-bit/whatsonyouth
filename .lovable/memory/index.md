# Project Memory

## Core
What's On Youth — Victorian youth opportunities platform (ages 15-25).
Brand colors: violet #5847E0, coral #D85A30, dark #0A0A0A. Fonts: Plus Jakarta Sans headings, Inter body.
Lovable Cloud backend. Admin via admins table + is_admin() function.
Source label for scanner listings is "ai_scan" (not "admin").
User wants credit usage reminder after each response.

## Memories
- [Image resolution system](mem://features/image-resolution) — resolve-listing-image edge function with og:image → Unsplash → null fallback chain, shared via _shared/resolve-image.ts
- [Scanner](mem://features/scanner) — scan-listings edge function with non-blocking link validation, in-memory dedup, post-scan image resolution, auto-expire
