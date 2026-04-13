import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("https://")) {
      return new Response(
        JSON.stringify({ reachable: false, reason: "Invalid URL format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          reachable: false,
          reason: `HTTP ${res.status} — page not found or unavailable`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = await res.text();
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (stripped.length < 1000) {
      return new Response(
        JSON.stringify({
          reachable: false,
          reason: "Page loads but has no readable content — may be JavaScript-only",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reachable: true, content_length: stripped.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        reachable: false,
        reason: e.message?.includes("timeout")
          ? "URL timed out — site may be too slow or blocking automated requests"
          : "Could not reach this URL",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
