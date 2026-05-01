import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { listing_id, referrer } = await req.json();
    if (!listing_id || typeof listing_id !== "string") {
      return new Response(JSON.stringify({ error: "listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify listing is active and fetch link
    const { data: listing } = await supabase
      .from("listings")
      .select("id, link, is_active")
      .eq("id", listing_id)
      .maybeSingle();

    if (!listing || !listing.is_active) {
      return new Response(JSON.stringify({ error: "listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "salt";

    const ip_hash = await sha256(ip + "|" + salt);
    const user_agent_hash = await sha256(ua + "|" + salt);

    await supabase.from("listing_clicks").insert({
      listing_id,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
      ip_hash,
      user_agent_hash,
    });

    return new Response(JSON.stringify({ ok: true, link: listing.link }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-click error", e);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
