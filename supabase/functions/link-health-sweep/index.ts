import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-cron-secret",
};

// Phrases that indicate a listing page is expired/unavailable even if HTTP 200
const EXPIRED_PHRASES = [
  "no longer advertised",
  "no longer available",
  "this job has expired",
  "this job is no longer",
  "position has been filled",
  "applications have closed",
  "applications are now closed",
  "event has ended",
  "event has passed",
  "page not found",
  "404 not found",
  "this page doesn't exist",
  "this page does not exist",
  "we couldn't find",
  "we could not find",
  "sorry, this page",
  "listing not found",
  "opportunity has closed",
];

const JOB_MAX_AGE_DAYS = 30;
const BATCH_DELAY_MS = 250; // be polite to upstream sites
const FETCH_TIMEOUT_MS = 10_000;

async function checkUrl(url: string): Promise<{ ok: boolean; reason?: string; status?: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0; +https://whatsonyouth.org.au)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (res.status >= 400) {
      return { ok: false, reason: `HTTP ${res.status}`, status: res.status };
    }

    // Read first ~200KB of body to scan for expired phrases
    const text = (await res.text()).slice(0, 200_000).toLowerCase();
    for (const phrase of EXPIRED_PHRASES) {
      if (text.includes(phrase)) {
        return { ok: false, reason: `Page contains "${phrase}"`, status: res.status };
      }
    }
    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, reason: err?.name === "AbortError" ? "Timeout" : `Fetch error: ${String(err).slice(0, 120)}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const summary = {
      checked: 0,
      whitelisted_skipped: 0,
      deactivated_dead_links: 0,
      deactivated_old_jobs: 0,
      errors: 0,
      deactivated: [] as { id: string; title: string; reason: string }[],
    };

    // ============ STEP 0: Load protected URL whitelist ============
    const normaliseLink = (u: string) =>
      u.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");

    const { data: whitelistRow } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "link_health_whitelist")
      .maybeSingle();

    let whitelist = new Set<string>();
    if (whitelistRow?.value) {
      try {
        const arr = JSON.parse(whitelistRow.value as string);
        if (Array.isArray(arr)) {
          whitelist = new Set(arr.map((s: string) => normaliseLink(String(s))));
        }
      } catch (e) {
        console.error("Could not parse link_health_whitelist:", e);
      }
    }
    console.log(`Loaded ${whitelist.size} whitelisted URLs`);

    const isWhitelisted = (link: string) => whitelist.has(normaliseLink(link));

    // ============ STEP 1: Auto-expire Job listings older than 30 days ============
    // (Whitelisted pillar Jobs pages — index/career hubs — are excluded.)
    const cutoff = new Date(Date.now() - JOB_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldJobs, error: oldJobsErr } = await supabase
      .from("listings")
      .select("id, title, link")
      .eq("is_active", true)
      .ilike("category", "jobs")
      .lt("created_at", cutoff);

    if (oldJobsErr) console.error("Failed to query old jobs:", oldJobsErr.message);

    for (const j of oldJobs || []) {
      if (isWhitelisted(j.link)) {
        summary.whitelisted_skipped++;
        continue;
      }
      await supabase.from("listings").update({ is_active: false, expired_at: new Date().toISOString() }).eq("id", j.id);
      summary.deactivated_old_jobs++;
      summary.deactivated.push({ id: j.id, title: j.title, reason: `Job >${JOB_MAX_AGE_DAYS}d old (auto-expire)` });
    }
    console.log(`Auto-expired ${summary.deactivated_old_jobs} old Job listings`);

    // ============ STEP 2: Re-check URL health for remaining active listings ============
    const { data: activeListings, error: listErr } = await supabase
      .from("listings")
      .select("id, title, link")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(500); // safety cap per run

    if (listErr) throw listErr;

    for (const l of activeListings || []) {
      if (isWhitelisted(l.link)) {
        summary.whitelisted_skipped++;
        continue;
      }
      summary.checked++;
      const result = await checkUrl(l.link);
      if (!result.ok) {
        await supabase.from("listings").update({ is_active: false }).eq("id", l.id);
        summary.deactivated_dead_links++;
        summary.deactivated.push({ id: l.id, title: l.title, reason: result.reason || "unknown" });
        console.log(`Deactivated ${l.id} (${l.title}): ${result.reason}`);
      }
      // gentle pause between requests
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("link-health-sweep failed:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
