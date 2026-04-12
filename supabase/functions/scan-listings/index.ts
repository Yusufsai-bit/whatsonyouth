import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  return text.slice(0, 12000);
}

function extractOgImage(html: string): string | null {
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // Try twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch?.[1]) return twMatch[1];

  return null;
}

async function extractListings(
  pageText: string,
  source: { name: string; url: string; category: string },
  apiKey: string
): Promise<any[]> {
  const prompt = `You are a listings extractor for What's On Youth — a Victorian platform for young people aged 15-25.

Analyse this webpage from '${source.name}' (${source.url}) and extract ALL opportunities relevant to young Victorians aged 15-25.

Look for: events, jobs, grants, programs, volunteering, leadership, wellbeing support, arts, sport.

Return ONLY a valid JSON array — no markdown, no explanation.

Each object must have exactly:
- title: string (max 150 chars)
- category: exactly one of: Events, Jobs, Grants, Programs, Wellbeing
- organisation: string
- location: string (suburb, city, Victoria-wide, or Online)
- link: full URL (use ${source.url} if no specific URL found)
- description: string (1-2 sentences, max 400 chars)
- contact_email: string (or empty string)
- expiry_date: YYYY-MM-DD string (or null)

Rules:
- Only include opportunities genuinely for ages 15-25
- If nothing relevant found, return []
- Return ONLY the JSON array, nothing else

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

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]);
  } catch {
    console.error("Failed to parse AI response:", text.slice(0, 500));
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { sources, mode } = await req.json();

    // Auth check — verify caller is an admin via JWT
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

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin status using service role to bypass RLS
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: adminData } = await serviceClient.from("admins").select("id").eq("user_id", user.id).maybeSingle();
    if (!adminData) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorised — admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const isLive = mode === "live";
    const results: any[] = [];
    let totalFound = 0, totalCreated = 0, totalSkipped = 0, totalErrors = 0;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      let found = 0, created = 0, skipped = 0;
      let status = "success";
      let errorMessage: string | null = null;

      try {
        // Step 1: Fetch page
        const pageRes = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)" },
          signal: AbortSignal.timeout(20000),
        });

        if (!pageRes.ok) {
          throw new Error(`HTTP ${pageRes.status} fetching ${source.url}`);
        }

        const html = await pageRes.text();
        const pageText = stripHtml(html);
        const ogImage = extractOgImage(html);
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

            // Validate listing link returns a valid page
            try {
              const linkCheck = await fetch(listing.link, {
                method: "HEAD",
                headers: { "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)" },
                signal: AbortSignal.timeout(8000),
              });
              if (!linkCheck.ok) {
                console.warn(`Skipping broken link (${linkCheck.status}): ${listing.link}`);
                skipped++;
                continue;
              }
            } catch {
              console.warn(`Skipping unreachable link: ${listing.link}`);
              skipped++;
              continue;
            }

            // Duplicate check
            const { data: existing } = await supabase
              .from("listings")
              .select("id")
              .eq("link", listing.link)
              .limit(1);

            if (existing && existing.length > 0) {
              skipped++;
              continue;
            }

            // Try to get OG image from the listing's own page
            let listingImage = ogImage; // fallback to source page OG image
            if (listing.link !== source.url) {
              try {
                const listingRes = await fetch(listing.link, {
                  headers: { "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)" },
                  signal: AbortSignal.timeout(8000),
                });
                if (listingRes.ok) {
                  const listingHtml = await listingRes.text();
                  const listingOg = extractOgImage(listingHtml);
                  if (listingOg) listingImage = listingOg;
                }
              } catch {
                // Ignore — use source OG or null
              }
            }

            const { error: insertErr } = await supabase.from("listings").insert({
              title: (listing.title || "").slice(0, 200),
              category: listing.category,
              organisation: (listing.organisation || source.name).slice(0, 200),
              location: (listing.location || "Victoria").slice(0, 200),
              link: listing.link,
              description: (listing.description || "").slice(0, 500),
              contact_email: listing.contact_email || "",
              expiry_date: listing.expiry_date || null,
              image_url: listingImage || null,
              is_active: isLive,
              is_featured: false,
              source: "admin",
              user_id: adminUserId,
            });

            if (insertErr) {
              console.error("Insert error:", insertErr);
              skipped++;
            } else {
              created++;
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
        source_url: source.url,
        listings_found: found,
        listings_created: created,
        listings_skipped: skipped,
        status,
        error_message: errorMessage,
      });

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
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          sources_scanned: sources.length,
          listings_found: totalFound,
          listings_created: totalCreated,
          listings_skipped: totalSkipped,
          errors: totalErrors,
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
