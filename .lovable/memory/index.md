# Project Memory

## Core
What's On Youth — Victorian youth opportunities platform (ages 15-25).
Brand colors: violet #5847E0, coral #D85A30, dark #0A0A0A. Fonts: Plus Jakarta Sans headings, Inter body.
Lovable Cloud backend. Admin via admins table + is_admin() function.
Scanner always auto-publishes; quality check gates all inserts (no drafts).
Source label for scanner listings is "ai_scan".
User wants credit usage reminder after each response.

## Memories
- [Image resolution system](mem://features/image-resolution) — resolve-listing-image edge function with og:image → Unsplash → null fallback chain, category-based Unsplash queries with content_filter=high
- [Scanner](mem://features/scanner) — scan-listings edge function with quality check, link validation (skip not flag), auto-publish, scan_log tracking
