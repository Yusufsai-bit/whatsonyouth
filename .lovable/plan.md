I checked the current scanner code, the latest migration, the database state, and scheduled job configuration. The broken links are still happening for concrete reasons, not because the idea was impossible.

## What is happening

1. The cleanup/source replacement migration appears incomplete.
   - The latest migration only schedules `link-health-sweep` cron jobs.
   - It does not contain the requested listing cleanup SQL.
   - It does not contain the requested scan source replacement SQL.
   - The existing active database still has many old `ai_scan` listings.

2. There are still many active old scanner-created listings.
   - Active listings by source currently include:
     - Events: 16 `ai_scan`
     - Grants: 5 `ai_scan`
     - Jobs: 46 `ai_scan`
     - Programs: 110 `ai_scan`
     - Wellbeing: 89 `ai_scan`
   - These were created before the stricter scanner rules and can still be visible if their URLs are broken.

3. The current banned pattern check is too narrow.
   - It blocks specific strings like `seek.com.au/job/`, `linkedin.com/jobs/`, and `grants.gov.au/Go/Display/`.
   - It does not generically block any URL path containing `/job/` even though the prompt says it should.
   - That is why active Jobs still include `jobsforyouth.com.au/job/...` links. I counted 43 active Jobs with job-like URL paths.

4. The health sweep schedule is configured, but likely cannot run successfully yet.
   - The cron jobs build their target URL from `platform_settings.key = 'supabase_url'`.
   - The database currently has `scan_api_key`, but no `supabase_url` setting.
   - That means the scheduled health sweep has no proper endpoint URL to call.
   - Also, the health sweep job has no recorded cron run history yet.

5. The existing `link-health-sweep` function does not currently use the request body category.
   - The cron sends `{ "category": "Jobs" }` for the daily Jobs sweep.
   - The function currently checks all active listings up to 500 and auto-expires old Jobs, but it does not filter by category from the request body.
   - You previously said not to change the health sweep function itself, so the safe fix is to correct the schedule and data/source rules around it.

## Permanent fix plan

I will make only the surgical backend/data changes needed, and avoid public pages, admin UI, auth, routing, brand files, and unrelated functions.

### 1. Add a corrective SQL migration for database cleanup

Create a new migration that:

- Deactivates active listings with known broken/ephemeral patterns, including:
  - known job-board and per-job URL patterns
  - generic `/job/` and `/jobs/` style paths where they are individual ads
  - grant directory detail pages
  - ticketing/event detail pages that commonly expire
  - “page not found” style known-bad URL patterns if present
- Targets all 5 categories where relevant.
- Preserves existing working listings that do not match the banned/broken patterns.
- Corrects legacy source labels where needed so scanner-created listings are no longer incorrectly treated as clean/stable.

### 2. Replace unstable scan sources with stable source pages

In the same migration, update `scan_sources` so unstable Jobs sources and obvious directory sources are deactivated or replaced with stable organisation/program pages.

Specific corrections will include:

- Deactivate or replace remaining unstable sources such as `Ethical Jobs Australia` and other job-board/directories.
- Replace Jobs sources with stable employer or official youth employment program pages.
- Fix category casing problems currently visible in the database (`jobs` vs `Jobs`, `volunteering` vs a valid category).
- Ensure source rows point to top-level or durable program pages, not search result pages or individual opportunity pages.

### 3. Strengthen scanner URL quality checks

Edit only `supabase/functions/scan-listings/index.ts` to add a stronger deterministic URL gate before insert:

- Parse the URL using `new URL()`.
- Block known unstable domains and URL patterns.
- Block generic path segments such as:
  - `/job/`
  - `/jobs/` when used as an individual listing path
  - `/careers/job/`
  - query-based job IDs where applicable
- Block detail pages from ticketing and grants directories.
- Keep allowing stable careers/program pages like `/careers`, `/graduate-programs`, `/apprenticeships`, `/traineeships`, etc.

This matters because prompt rules alone are not enough. The model can still return a bad URL; deterministic code must reject it.

### 4. Tighten the AI extraction prompt

In the same scanner file, improve the prompt so it clearly says:

- Do not return individual jobs, individual grants, individual ticketing pages, directory results, or per-resource pages.
- If a discovered opportunity only has an unstable detail link, use the stable source/program page instead.
- For each category, prefer:
  - Events: organiser event listing/calendar page or official recurring program page, not ticketing detail pages.
  - Jobs: employer careers/program pages, apprenticeships, traineeships, graduate/youth employment programs; never individual job ads.
  - Grants: funder program pages, not grants directory detail pages.
  - Programs: stable program pages.
  - Wellbeing: top-level service or major section pages.

### 5. Fix health sweep scheduling without changing the health sweep function

Create a migration that repairs the scheduled sweep setup:

- Insert/update the missing backend URL setting needed by cron.
- Recreate the two cron jobs with valid URLs and headers.
- Keep the intended cadence:
  - Daily Jobs sweep at 3am AEST equivalent.
  - Weekly all-category sweep Sunday 4am AEST equivalent.
- Keep using the existing `scan_api_key` setting.
- Do not edit `supabase/functions/link-health-sweep/index.ts`.

### 6. Verification after implementation

After changes are applied, verify with read-only checks:

- Count remaining active listings matching banned patterns.
- Confirm unstable scan sources are inactive/replaced.
- Confirm cron jobs exist and have valid commands.
- Confirm scanner code contains deterministic bans for generic `/job/` paths.

## Scope guardrails

I will not change:

- Public-facing pages/components.
- Admin pages/UI.
- Auth or routing logic.
- Brand files or logos.
- Any edge function except `scan-listings`.
- `link-health-sweep` itself.

Credit usage reminder: this investigation used credits for code/database inspection; implementation and verification will use additional credits.