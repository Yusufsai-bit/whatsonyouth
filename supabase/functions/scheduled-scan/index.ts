import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CHUNK_SIZE = 3; // sources per scheduled run

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if auto-scan is enabled
    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "auto_scan_enabled")
      .maybeSingle();

    if (setting?.value === "false") {
      console.log("Auto-scan is disabled in settings");
      return new Response(
        JSON.stringify({ success: false, reason: "Auto-scan disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active sources
    const { data: allSources } = await supabase
      .from("scan_sources")
      .select("id, name, url, category")
      .eq("is_active", true);

    if (!allSources || allSources.length === 0) {
      console.log("No active sources found");
      return new Response(
        JSON.stringify({ success: false, reason: "No active sources" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get last-scan time per source from scan_log
    const { data: logs } = await supabase
      .from("scan_log")
      .select("source_url, scanned_at")
      .neq("source_url", "__session_summary__")
      .order("scanned_at", { ascending: false })
      .limit(500);

    const lastScannedAt = new Map<string, string>();
    (logs || []).forEach((l: any) => {
      if (!lastScannedAt.has(l.source_url)) {
        lastScannedAt.set(l.source_url, l.scanned_at);
      }
    });

    // Pick CHUNK_SIZE least-recently-scanned (or never-scanned) sources
    const sortedSources = [...allSources].sort((a: any, b: any) => {
      const ta = lastScannedAt.get(a.url) || "";
      const tb = lastScannedAt.get(b.url) || "";
      return ta.localeCompare(tb); // empty (never scanned) sorts first
    });

    const chunk = sortedSources.slice(0, CHUNK_SIZE).map((s: any) => ({
      name: s.name,
      url: s.url,
      category: s.category,
    }));

    console.log(`Scheduled scan: processing ${chunk.length} of ${allSources.length} sources`);
    console.log("Sources:", chunk.map(c => c.name).join(", "));

    // Call scan-listings with cron secret (bypasses admin auth check)
    const cronSecret = Deno.env.get("SCAN_API_KEY") || "";
    const res = await fetch(`${supabaseUrl}/functions/v1/scan-listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "x-cron-secret": cronSecret,
      },
      body: JSON.stringify({ sources: chunk }),
    });

    const data = await res.json();
    console.log("Scheduled chunk complete:", data?.summary);

    return new Response(
      JSON.stringify({ success: true, processed: chunk.length, total: allSources.length, summary: data?.summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scheduled scan failed:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
