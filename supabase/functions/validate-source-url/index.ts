import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  url: z.string().trim().url().max(2000).refine((url) => url.startsWith("https://"), "URL must start with https://"),
}).strict();

const isPrivateHost = (hostname: string) =>
  hostname === "localhost" ||
  hostname.endsWith(".local") ||
  /^(127|10|0)\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ reachable: false, reason: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { url } = parsed.data;
    const target = new URL(url);
    if (isPrivateHost(target.hostname)) {
      return new Response(
        JSON.stringify({ reachable: false, reason: "Private or local URLs are not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
