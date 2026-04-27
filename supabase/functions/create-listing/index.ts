import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 50;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

const VALID_CATEGORIES = ["Events", "Jobs", "Grants", "Programs", "Wellbeing"];

const sanitizeText = (value: string) =>
  value.normalize("NFKC").replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\s+/g, " ").trim();

const ListingBodySchema = z.object({
  title: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]),
  organisation: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
  location: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
  link: z.string().transform(sanitizeText).pipe(z.string().url().max(2000)).refine((url) => url.startsWith("https://"), "link must start with https://"),
  description: z.string().transform(sanitizeText).pipe(z.string().min(1).max(500)),
  contact_email: z.string().transform(sanitizeText).pipe(z.string().email().max(255)).optional().or(z.literal("")),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  source: z.string().transform(sanitizeText).pipe(z.string().max(80)).optional(),
  scan_log_id: z.string().uuid().optional(),
}).strict().superRefine((body, ctx) => {
  if (!body.expiry_date) return;
  const d = new Date(`${body.expiry_date}T00:00:00Z`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(d.getTime()) || d < today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiry_date"], message: "expiry_date must not be in the past" });
  }
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const expectedKey = Deno.env.get("SCAN_API_KEY");
    if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorised" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = ListingBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const body = parsed.data;

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Duplicate check
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("link", body.link)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Duplicate",
          message: "A listing with this URL already exists",
          existing_id: existing[0].id,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert listing
    const insertData = {
      title: body.title,
      category: body.category,
      organisation: body.organisation,
      location: body.location,
      link: body.link,
      description: body.description,
      contact_email: body.contact_email ? body.contact_email.toLowerCase() : "",
      expiry_date: body.expiry_date || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_featured: false,
      source: body.source || "admin",
      user_id: "00000000-0000-0000-0000-000000000000", // system placeholder for AI listings
    };

    const { data: inserted, error: insertError } = await supabase
      .from("listings")
      .insert(insertData)
      .select("id, title, category, is_active, source, created_at")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Server error", message: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update scan_log if scan_log_id provided
    if (body.scan_log_id) {
      // Increment listings_created on the scan log entry
      const { data: logRow } = await supabase
        .from("scan_log")
        .select("listings_created")
        .eq("id", body.scan_log_id)
        .single();

      if (logRow) {
        await supabase
          .from("scan_log")
          .update({ listings_created: (logRow.listings_created || 0) + 1 })
          .eq("id", body.scan_log_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Listing created",
        listing: inserted,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
