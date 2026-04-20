import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveImage } from "../_shared/resolve-image.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function stripHtml(html: string): string {
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text.slice(0, 20000);
}

function normaliseLocation(location: string): string {
  if (!location) return 'Victoria';
  const l = location.trim();
  const map: Record<string, string> = {
    'melb': 'Melbourne',
    'melbourne, vic': 'Melbourne',
    'melbourne, victoria': 'Melbourne',
    'vic': 'Victoria',
    'victoria, australia': 'Victoria',
    'state-wide': 'Victoria-wide',
    'statewide': 'Victoria-wide',
    'across victoria': 'Victoria-wide',
    'all of victoria': 'Victoria-wide',
    'remote': 'Online',
    'virtual': 'Online',
    'zoom': 'Online',
    'web': 'Online',
    'australia-wide': 'Australia-wide',
    'national': 'Australia-wide',
    'australia wide': 'Australia-wide',
  };
  const lower = l.toLowerCase();
  return map[lower] || l;
}

function passesQualityCheck(listing: any): {
  passes: boolean;
  reason: string;
} {
  if (!listing.title || listing.title.length < 10)
    return { passes: false, reason: 'Title too short' };

  if (!listing.description || listing.description.length < 80)
    return { passes: false, reason: 'Description too short' };

  if (!listing.organisation || listing.organisation.length < 3)
    return { passes: false, reason: 'Missing organisation' };

  if (!listing.link || !listing.link.startsWith('http'))
    return { passes: false, reason: 'Invalid link' };

  if (!listing.location || listing.location.length < 3)
    return { passes: false, reason: 'Missing location' };

  const loc = listing.location.toLowerCase();
  const validLocations = [
    'victoria', 'melbourne', 'vic', 'online',
    'ballarat', 'bendigo', 'geelong', 'shepparton',
    'wodonga', 'mildura', 'warrnambool', 'frankston',
    'gippsland', 'regional', 'australia', 'national'
  ];
  const isVictorianOrOnline = validLocations.some(v => loc.includes(v));
  if (!isVictorianOrOnline)
    return { passes: false, reason: `Location "${listing.location}" not Victorian or online` };

  return { passes: true, reason: '' };
}

async function extractListings(
  pageText: string,
  source: { name: string; url: string; category: string },
  apiKey: string
): Promise<any[]> {
  const prompt = `You are a listings extractor for What's On Youth — a Victorian platform for young people aged 15-25 living in Victoria, Australia.

Analyse this webpage from '${source.name}' (${source.url}) and extract opportunities that meet ALL of these criteria:

1. Relevant to young people aged 15-25
2. Available in Victoria, Australia OR available online to Australians
3. Currently open or upcoming — not past events

Reject anything that is:
- Only available outside Victoria (unless online)
- Targeted at adults over 25 or children under 15
- A past event or closed opportunity
- A generic article, blog post, or news item with no specific opportunity to apply for or attend
- A commercial product or paid service

Look for: events, jobs, grants, programs, volunteering, leadership, wellbeing support, arts, sport.

Return ONLY a valid JSON array — no markdown, no explanation, no other text whatsoever.

Each object must have exactly these fields:
- title: string (clear specific title, max 150 chars)
- category: exactly one of: Events, Jobs, Grants, Programs, Wellbeing
- organisation: string (who runs it)
- location: string (suburb, city, "Victoria-wide", "Regional Victoria", or "Online")
- link: full URL to this specific opportunity — if no specific URL use ${source.url}
- description: 1-2 sentences, max 400 chars — what it is, who it is for, key dates or benefit
- contact_email: string (or empty string "")
- expiry_date: YYYY-MM-DD string (or null)

If nothing meets all criteria, return []

Return ONLY the JSON array, nothing else.

Page content:
${pageText}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "[]";

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]);
  } catch {
    console.warn("First parse failed, retrying...");
    try {
      const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt + "\n\nIMPORTANT: Return ONLY a valid JSON array. No markdown, no explanation." }],
        }),
      });
      if (retry.ok) {
        const retryData = await retry.json();
        const retryText = retryData.choices?.[0]?.message?.content || "[]";
        const retryMatch = retryText.match(/\[[\s\S]*\]/);
        if (retryMatch) {
          return JSON.parse(retryMatch[0]);
        }
      }
    } catch {
      // Retry also failed
    }
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { sources } = await req.json();

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — accept either (a) cron secret header from scheduled-scan, or (b) admin user JWT
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const expectedCronSecret = Deno.env.get("SCAN_API_KEY") || "";
    const isCronCall = cronSecretHeader && expectedCronSecret && cronSecretHeader === expectedCronSecret;

    let user: { id: string } | null = null;

    if (isCronCall) {
      // Cron path: use the first admin as the listing owner
      const { data: firstAdmin } = await serviceClient.from("admins").select("user_id").limit(1).maybeSingle();
      if (!firstAdmin) {
        return new Response(JSON.stringify({ success: false, error: "No admin user available for cron scan" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = { id: (firstAdmin as any).user_id };
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorised" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user: authUser }, error: userError } = await anonClient.auth.getUser();
      if (userError || !authUser) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorised" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: adminData } = await serviceClient.from("admins").select("id").eq("user_id", authUser.id).maybeSingle();
      if (!adminData) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorised — admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = { id: authUser.id };
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No sources provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = user.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = serviceClient;

    const scanSessionId = crypto.randomUUID();
    const results: any[] = [];
    let totalFound = 0, totalCreated = 0, totalSkipped = 0, totalErrors = 0;
    let totalImagesResolved = 0, totalImagesUnsplash = 0, totalImagesPending = 0;

    // Pre-load ALL existing links from DB into memory
    const { data: existingListings } = await supabase
      .from('listings')
      .select('link');
    const existingLinks = new Set(
      (existingListings || []).map((l: any) => l.link)
    );

    // Also track links inserted this run
    const insertedLinks = new Set<string>();

    // Collect pending image IDs for post-scan resolution
    const pendingImageIds: Array<{
      id: string;
      link: string;
      title: string;
      category: string;
    }> = [];

    // Time budgets
    const SCAN_START = Date.now();
    const MAX_SCAN_MS = 140000; // ~2.3 min total budget (edge function hard limit ~150s)
    const MAX_SOURCE_MS = 25000; // 25s per source fetch timeout — fail fast on slow sites

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      let found = 0, created = 0, skipped = 0;
      let status = "success";
      let errorMessage: string | null = null;

      // Skip if we've used more than 80% of budget
      if (Date.now() - SCAN_START > MAX_SCAN_MS * 0.8) {
        results.push({
          source: source.name,
          url: source.url,
          found: 0,
          created: 0,
          skipped: 0,
          status: 'skipped',
          error: 'Scan time budget exceeded',
        });
        continue;
      }

      try {
        // Step 1: Fetch page
        const pageRes = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)" },
          signal: AbortSignal.timeout(MAX_SOURCE_MS),
        });

        if (!pageRes.ok) {
          throw new Error(`HTTP ${pageRes.status} fetching ${source.url}`);
        }

        const html = await pageRes.text();
        const pageText = stripHtml(html);
        if (pageText.length < 50) {
          throw new Error("Page content too short to analyse");
        }

        // Step 2: Extract listings via Lovable AI
        const listings = await extractListings(pageText, source, LOVABLE_API_KEY);
        found = listings.length;

        // Step 3: Insert listings
        const validCategories = ["Events", "Jobs", "Grants", "Programs", "Wellbeing"];

        for (const listing of listings) {
          try {
            if (!listing.title || !listing.link) continue;
            if (!validCategories.includes(listing.category)) {
              listing.category = source.category;
            }

            // In-memory dedup check
            if (insertedLinks.has(listing.link)) {
              skipped++;
              continue;
            }

            // Pre-loaded DB dedup check
            if (existingLinks.has(listing.link)) {
              skipped++;
              continue;
            }

            // Quality check — skip entirely if it fails
            const quality = passesQualityCheck(listing);
            if (!quality.passes) {
              console.log(`Quality skip: ${listing.title} — ${quality.reason}`);
              skipped++;
              continue;
            }

            const { data: inserted, error: insertErr } = await supabase.from("listings").insert({
              title: (listing.title || "").slice(0, 200),
              category: listing.category,
              organisation: (listing.organisation || source.name).slice(0, 200),
              location: normaliseLocation(listing.location || "Victoria").slice(0, 200),
              link: listing.link,
              description: (listing.description || "").slice(0, 500),
              contact_email: listing.contact_email || "",
              // Wellbeing listings never expire (ongoing services, not time-bound opportunities)
              expiry_date: listing.category === 'Wellbeing' ? null : (listing.expiry_date || null),
              image_url: null,
              is_active: true,
              is_featured: false,
              source: "ai_scan",
              user_id: adminUserId,
            }).select("id").maybeSingle();

            if (insertErr) {
              console.error("Insert error:", insertErr);
              skipped++;
            } else {
              created++;
              insertedLinks.add(listing.link);
              existingLinks.add(listing.link);

              // Collect for post-scan image resolution
              if (inserted?.id) {
                pendingImageIds.push({
                  id: inserted.id,
                  link: listing.link,
                  title: listing.title || "",
                  category: listing.category,
                });
              }
            }
          } catch (e) {
            console.error("Listing insert error:", e);
            skipped++;
          }
        }
      } catch (e: any) {
        status = "error";
        errorMessage = e.message || "Unknown error";
        totalErrors++;
        console.error(`Error scanning ${source.name}:`, e);
      }

      // Step 4: Log to scan_log
      await supabase.from("scan_log").insert({
        scan_session_id: scanSessionId,
        source_url: source.url,
        listings_found: found,
        listings_created: created,
        listings_skipped: skipped,
        images_resolved: 0,
        images_from_unsplash: 0,
        images_pending: 0,
        status,
        error_message: errorMessage,
      });

      // Circuit breaker: auto-disable after 3 consecutive failures
      if (status === 'error') {
        const { data: recentLogs } = await supabase
          .from('scan_log')
          .select('status')
          .eq('source_url', source.url)
          .order('scanned_at', { ascending: false })
          .limit(3);

        const allFailed = recentLogs &&
          recentLogs.length >= 3 &&
          recentLogs.every((l: any) => l.status === 'error');

        if (allFailed) {
          await supabase
            .from('scan_sources')
            .update({ is_active: false } as any)
            .eq('url', source.url);
          console.log(`Auto-disabled source after 3 failures: ${source.url}`);
        }
      }

      totalFound += found;
      totalCreated += created;
      totalSkipped += skipped;

      results.push({
        source: source.name,
        url: source.url,
        found,
        created,
        skipped,
        status,
        error: errorMessage,
      });

      // Delay between sources
      if (i < sources.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Fire image resolution async — don't await
    if (pendingImageIds.length > 0) {
      (async () => {
        for (const item of pendingImageIds) {
          try {
            await resolveImage(
              item.id, item.link,
              item.title, item.category, supabase
            );
          } catch { /* silent */ }
          await new Promise(r => setTimeout(r, 400));
        }
      })();
    }

    // Set image stats to pending since we fired async
    totalImagesPending = pendingImageIds.length;

    // Session summary log entry
    await supabase.from('scan_log').insert({
      scan_session_id: scanSessionId,
      source_url: '__session_summary__',
      listings_found: totalFound,
      listings_created: totalCreated,
      listings_skipped: totalSkipped,
      images_resolved: 0,
      images_from_unsplash: 0,
      images_pending: totalImagesPending,
      status: totalErrors === 0 ? 'success' : totalErrors === sources.length ? 'error' : 'partial',
      error_message: totalErrors > 0 ? `${totalErrors} source(s) failed` : null,
    });

    // Auto-deactivate expired listings (Wellbeing listings are excluded — they never expire)
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("listings")
      .update({ is_active: false })
      .lt("expiry_date", today)
      .eq("is_active", true)
      .neq("category", "Wellbeing");

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          sources_scanned: sources.length,
          listings_found: totalFound,
          listings_created: totalCreated,
          listings_skipped: totalSkipped,
          errors: totalErrors,
          images_resolved: totalImagesResolved,
          images_from_unsplash: totalImagesUnsplash,
          images_pending: totalImagesPending,
        },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("scan-listings error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Server error", message: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
