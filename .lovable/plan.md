
## Goal

Insert the genuinely useful subset of your 70 curated listings — with every URL validated reachable and every duplicate removed — using your existing data conventions (`source = 'admin'`, real contact email, proper migration). Nothing inserted that is broken, duplicated, or pointed at the wrong page.

## What I found in the de-dupe pass

12 candidates **already exist** at the same URL and will be skipped:

| Candidate | Already in DB as |
|---|---|
| ReachOut (`au.reachout.com/`) | "First Nations Wellbeing Resources and Support" — same URL, wrong title. **Will fix existing title instead of inserting.** |
| Duke of Ed | The Duke of Edinburgh's International Award |
| headspace home (`headspace.org.au/`) | headspace centres |
| headspace centres (Programs + Jobs candidates) | headspace Work and Study Support |
| Kids Helpline | already listed twice |
| Beyond Blue Young | Beyond Blue Forums (Youth) |
| Coles Careers | Store Teams & Leadership Opportunities |
| Lifeline | Urgent Mental Health Help (Lifeline) |
| SANE | SANE Support Line |
| Vic Apprenticeships | Victorian Government Traineeship Program (currently miscategorised as Programs — see fix below) |
| YMCA Careers | Y Careers |

Also flagged:
- **18 existing listings** already use `headspace.org.au` — both `headspace.org.au/headspace-centres/` candidates (Jobs + Programs) get **dropped entirely**. headspace coverage is already saturated.
- The candidate "Vic Grants Directory" (`vic.gov.au/grants-and-programs`) only collides on domain, not URL — it's still safe to add.

**Net new to insert: ~55 listings** (70 minus 12 dupes minus 2 headspace-centres minus 1 ReachOut handled as update).

## Steps

### 1. URL validation pass (read-only)
Run every net-new URL through your existing `validate-source-url` edge function in batches. Drop any that return `reachable: false`. Show you the validation table before inserting anything. Estimated 55 fetches.

### 2. Small fixes to existing data
Two surgical updates to existing listings (no new rows):
- **ReachOut row** — change title from "First Nations Wellbeing Resources and Support" to "ReachOut — Online Mental Health Support for Young People" and update description. Wrong title for that URL today.
- **Vic Apprenticeships row** — move from `Programs` → `Jobs` (where it belongs).

### 3. Insert validated, de-duped listings via migration
A single transactional migration that inserts only validated, non-duplicate rows with:
- `source = 'admin'` (matches your project convention — not `'curated'`)
- `user_id` = first admin from `public.admins`
- `contact_email = 'hello@whatsonyouth.org.au'` for all rows (your `contact_email` column is NOT NULL; using a single shared mailbox keeps it clean)
- `is_active = true`, `is_featured = false`
- `expiry_date` only set on Events (so Programs/Wellbeing/Grants/Jobs index pages don't auto-deactivate)
- All URLs lowercased and normalised

Quality-score trigger and duplicate-fingerprint trigger will run automatically on insert.

### 4. Verification
After insert, run:
```sql
SELECT category, count(*) FROM listings 
WHERE source = 'admin' AND created_at > now() - interval '10 minutes'
GROUP BY category;
```
…and report counts vs. the 168 → ~218 expected total.

### 5. Protect them from accidental deactivation
Add the inserted listing IDs (or their domains) to a new `platform_settings` key `link_health_whitelist` containing a JSON array. Update `link-health-sweep` to skip any URL whose domain is in the whitelist. This means the next health sweep can never knock these pillar listings offline because of a transient 503 or rate-limit.

## Technical details

**Files / changes:**
- 1 migration: `INSERT INTO listings ...` (one statement, one transaction)
- 2 small `UPDATE` statements on existing listings (ReachOut title, Vic Apprenticeships category)
- 1 `INSERT` into `platform_settings` for the whitelist
- 1 small edit to `supabase/functions/link-health-sweep/index.ts` to consult the whitelist
- No schema changes
- No frontend changes

**Things I will NOT change:**
- Scanner behaviour
- Admin UI
- Existing 168 active listings (other than the 2 small fixes above)
- Brand, routing, auth

## Decision points before I run

1. **Contact email** — OK to use `hello@whatsonyouth.org.au` for all 55 rows? (Your `contact_email` column is required.)
2. **Whitelist scope** — should the link-health whitelist match by full URL (strict) or by domain (broader, also protects e.g. all of `headspace.org.au`)? I recommend **full URL** so we don't accidentally protect bad subpages.
3. **ReachOut + Vic Apprenticeships fixes** — OK to update those two existing rows? They're clearly mislabeled today.

If you say "go", I'll default to: shared contact email, full-URL whitelist, and yes-fix-the-two-existing-rows.

*Credit usage reminder: validation step (~55 URL fetches), one migration, one edge function edit, one verification query. Moderate credit usage overall — most of it in the URL validation phase.*
