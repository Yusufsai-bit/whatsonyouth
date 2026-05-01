## Goal
Address all blind spots, risks, and assumptions identified in the sparring review. Tighten data quality, automation safety, security, and engagement measurement.

## Scope of Changes

### 1. Admin Review Queue (human-in-the-loop for scanner)
- Update `supabase/functions/scan-listings/index.ts` so newly scraped listings insert with `is_active = false` (pending review).
- Add an "Pending Review" tab/filter in the admin listings dashboard with bulk Approve / Reject actions.
- Approving sets `is_active = true`; rejecting deletes the row and adds the source URL to `rejected_sources`.

### 2. Data quality & lifecycle
- Add `expiry_date` validation trigger requiring it for categories `Events`, `Jobs`, `Grants` (Programs and Wellbeing remain optional).
- Add a scheduled job (extend `link-health-sweep` or new cron) that **hard-deletes** listings inactive for >90 days, after writing a row to `admin_audit_log` for traceability.
- Improve `listing_duplicate_fingerprint` to use `(normalised_domain + normalised_org + normalised_title_tokens)` so minor title variations still collide. Backfill fingerprints on existing rows.

### 3. Click tracking (measure real utility)
- New table `listing_clicks (id, listing_id, clicked_at, referrer, user_agent_hash, ip_hash)` with RLS: anon INSERT allowed (rate-limited via edge function), admin SELECT only.
- New edge function `track-click` that validates payload, hashes IP/UA, inserts row, then returns the redirect URL.
- Update `ListingDetailPage.tsx` and any "Visit" CTA to call `track-click` before navigating to `listing.link`.
- Surface click counts per listing in the admin dashboard.

### 4. Anti-abuse on public inserts
- Add a `submission_rate_limit` edge function gating `digest_subscribers` and `listing_reports` inserts (max N per IP per hour) using a small `rate_limit_log` table.
- Switch the public-facing forms to call these edge functions instead of inserting directly via the client.

### 5. Security hardening
- Tighten `list_users()` SECURITY DEFINER function: explicit admin check + `revoke execute from public/anon`, grant only to `authenticated`.
- Re-run `supabase--linter` and resolve remaining warnings.

### 6. Contact email clarity
- Add an optional `provider_contact_email` column on `listings` (nullable). Admin curation form lets us record the organiser's real email separately from the platform contact.
- Detail page shows: "Provider: {provider_contact_email or organisation website}" and "Platform support: info@whatsonyouth.org.au".

### 7. Memory + docs
- Update `mem://index.md` and add memory files for: review-queue workflow, click tracking, 90-day deletion policy, fingerprint v2.

## Technical Notes
- All schema changes via migration tool; data backfills via insert tool.
- Cron jobs use `pg_cron` + `pg_net` (already in use for link-health-sweep).
- Rate-limit hashing uses SHA-256 with a server-side salt secret (`RATE_LIMIT_SALT` — will request via secrets tool).
- No breaking RLS changes to existing public read of `listings`.

## Out of Scope (flag for later)
- Newsletter visibility / send pipeline (separate effort once subscribers > 0).
- Turnstile / captcha integration (rate limits first; revisit if abuse appears).

## Rollout Order
1. Migrations (schema + trigger + fingerprint v2 + new tables)
2. Edge functions (scan default-inactive, track-click, submission_rate_limit, 90-day cleanup cron)
3. Admin UI (review queue, click counts, provider email field)
4. Public UI wiring (track-click, rate-limited forms, provider contact display)
5. Linter pass + memory update

Estimated credit usage: ~8–12 message credits across migrations, edge functions, and UI.