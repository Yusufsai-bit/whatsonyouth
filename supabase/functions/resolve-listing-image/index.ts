import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

const CATEGORY_MODIFIERS: Record<string, string> = {
  Events: "event victoria australia",
  Jobs: "career workplace professional",
  Grants: "community youth opportunity",
  Programs: "youth program learning",
  Wellbeing: "mental health calm support",
};

export async function resolveImage(
  listingId: string,
  listingUrl: string,
  listingTitle: string,
  category: string,
  supabase: any
): Promise<{ url: string | null; source: "existing" | "og" | "unsplash" | null }> {
  // Step 1: Check existing image_url
  const { data: listing } = await supabase
    .from("listings")
    .select("image_url")
    .eq("id", listingId)
    .maybeSingle();

  if (listing?.image_url) {
    try {
      const check = await fetch(listing.image_url, {
        method: "HEAD",
        signal: AbortSignal.timeout(8000),
      });
      if (check.ok) return { url: listing.image_url, source: "existing" };
    } catch { /* broken — continue */ }
  }

  // Step 2: Fetch og:image from listing URL
  try {
    const pageRes = await fetch(listingUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WhatsOnYouthBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const ogUrl = extractOgImage(html);
      if (ogUrl) {
        try {
          const imgCheck = await fetch(ogUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(8000),
          });
          const ct = imgCheck.headers.get("content-type") || "";
          if (imgCheck.ok && ct.startsWith("image/")) {
            await supabase
              .from("listings")
              .update({ image_url: ogUrl })
              .eq("id", listingId);
            return { url: ogUrl, source: "og" };
          }
        } catch { /* not reachable */ }
      }
    }
  } catch { /* page fetch failed */ }

  // Step 3: Unsplash
  const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (unsplashKey) {
    try {
      const modifier = CATEGORY_MODIFIERS[category] || "";
      const query = `${listingTitle.slice(0, 60)} ${modifier}`.trim();
      const params = new URLSearchParams({
        query,
        per_page: "3",
        orientation: "landscape",
        client_id: unsplashKey,
      });
      const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        const first = data.results?.[0];
        if (first?.urls?.regular) {
          const imgUrl = first.urls.regular;
          await supabase
            .from("listings")
            .update({ image_url: imgUrl })
            .eq("id", listingId);
          return { url: imgUrl, source: "unsplash" };
        }
      }
    } catch { /* unsplash failed */ }
  }

  // Step 4: null
  return { url: null, source: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { listing_id, listing_url, listing_title, category } = await req.json();

    if (!listing_id || !listing_url) {
      return new Response(
        JSON.stringify({ error: "listing_id and listing_url required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result = await resolveImage(
      listing_id,
      listing_url,
      listing_title || "",
      category || "Events",
      supabase
    );

    return new Response(
      JSON.stringify({ success: true, image_url: result.url, source: result.source }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
