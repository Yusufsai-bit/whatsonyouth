I’ll implement the agreed backend cleanup recommendations as a narrow backend-only change set.

## Changes to make

### 1. Deactivate the remaining bad Jobs listing

Deactivate the active listing that still matches the unstable Jobs URL pattern:

- `Team Member - Melton`
- `jobsforyouth.com.au/job/team-member-melton`

This keeps individual short-lived job ads off the public site.

### 2. Remove the duplicate weekly health sweep

Unschedule/remove:

- `link-health-sweep-weekly`

Keep:

- `link-health-sweep-jobs` — daily Jobs cleanup
- `link-health-sweep-all` — weekly all-category cleanup

This reduces duplicate backend work while preserving link protection.

### 3. Pause automatic source discovery

Unschedule/remove:

- `discover-sources-fortnightly`

Reason: it can introduce new source websites automatically, which is useful later but currently less important than quality control.

Existing sources will remain. This only stops the automatic discovery job from adding new source websites in the background.

### 4. Reduce scanner frequency

Change:

- `scheduled-scan-chunk` from every 15 minutes

To:

- hourly

This keeps auto-scanning active but reduces background usage and unnecessary repeated scans.

### 5. Tighten future source discovery code

Update only the `discover-sources` backend function so that if source discovery is re-enabled later:

- it only uses the site’s real categories: `Events`, `Jobs`, `Grants`, `Programs`, `Wellbeing`
- it does not create lowercase or invalid categories like `jobs`, `volunteering`, or `education`
- newly discovered sources are saved as inactive by default for admin review before use
- prompts prefer stable .gov.au/.org.au source pages and reject aggregators/directories

This makes the disabled discovery feature safer for future use.

### 6. Verification

After applying the changes, verify:

- no active listings match known bad URL patterns
- `scheduled-scan-chunk` is hourly
- `link-health-sweep-weekly` is gone/inactive
- `discover-sources-fortnightly` is gone/inactive
- `link-health-sweep-jobs` and `link-health-sweep-all` remain active
- active scan source categories are only the 5 approved public categories

## Scope guardrails

I will not change:

- public-facing pages
- admin UI
- auth or routing
- brand files/logos
- listing card display
- `link-health-sweep` function itself

Credit usage reminder: implementing and verifying this backend cleanup will use additional credits.