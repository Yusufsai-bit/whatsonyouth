import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

function validateBody(body: Record<string, unknown>): { valid: boolean; details?: string } {
  const { title, category, organisation, location, link, description, contact_email, expiry_date } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0)
    return { valid: false, details: "title is required" };
  if ((title as string).length > 200)
    return { valid: false, details: "title must be 200 chars or less" };

  if (!category || !VALID_CATEGORIES.includes(category as string))
    return { valid: false, details: `category must be one of: ${VALID_CATEGORIES.join(", ")}` };

  if (!organisation || typeof organisation !== "string" || (organisation as string).trim().length === 0)
    return { valid: false, details: "organisation is required" };
  if ((organisation as string).length > 200)
    return { valid: false, details: "organisation must be 200 chars or less" };

  if (!location || typeof location !== "string" || (location as string).trim().length === 0)
    return { valid: false, details: "location is required" };
  if ((location as string).length > 200)
    return { valid: false, details: "location must be 200 chars or less" };

  if (!link || typeof link !== "string")
    return { valid: false, details: "link is required" };
  if (!(link as string).startsWith("http://") && !(link as string).startsWith("https://"))
    return { valid: false, details: "link must start with http:// or https://" };

  if (!description || typeof description !== "string" || (description as string).trim().length === 0)
    return { valid: false, details: "description is required" };
  if ((description as string).length > 500)
    return { valid: false, details: "description must be 500 chars or less" };

  if (contact_email !== undefined && contact_email !== null && contact_email !== "") {
    const email = contact_email as string;
    if (!email.includes("@") || !email.includes("."))
      return { valid: false, details: "contact_email must be a valid email" };
  }

  if (expiry_date !== undefined && expiry_date !== null && expiry_date !== "") {
    const d = new Date(expiry_date as string);
    if (isNaN(d.getTime()))
      return { valid: false, details: "expiry_date must be a valid ISO date (YYYY-MM-DD)" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today)
      return { valid: false, details: "expiry_date must not be in the past" };
  }

  return { valid: true };
}

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

    // Parse body
    const body = await req.json();

    // Validate
    const validation = validateBody(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: "Validation failed", details: validation.details }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      title: (body.title as string).trim(),
      category: body.category as string,
      organisation: (body.organisation as string).trim(),
      location: (body.location as string).trim(),
      link: (body.link as string).trim(),
      description: (body.description as string).trim(),
      contact_email: body.contact_email ? (body.contact_email as string).trim() : "",
      expiry_date: body.expiry_date || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_featured: false,
      source: body.source || "ai_scan",
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
