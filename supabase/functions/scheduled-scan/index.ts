import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    // Check scan mode setting
    const { data: modeSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "auto_scan_mode")
      .maybeSingle();

    const mode = modeSetting?.value === "draft" ? "draft" : "live";

    // Fetch active sources
    const { data: sources } = await supabase
      .from("scan_sources")
      .select("*")
      .eq("is_active", true);

    if (!sources || sources.length === 0) {
      console.log("No active sources found");
      return new Response(
        JSON.stringify({ success: false, reason: "No active sources" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting scheduled scan with ${sources.length} sources in ${mode} mode`);

    // Call scan-listings function
    const { data, error } = await supabase.functions.invoke("scan-listings", {
      body: { sources, mode },
    });

    if (error) {
      console.error("Scan function error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scheduled scan complete:", data?.summary);

    return new Response(
      JSON.stringify({ success: true, summary: data?.summary }),
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
