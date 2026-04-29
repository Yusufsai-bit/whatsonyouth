import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-cron-secret",
};

const FAILURE_THRESHOLD = 5;
const TARGET_NEW_SOURCES = 2; // we aim for 1-2 keepers per fortnight
const MAX_CANDIDATES_TO_EVALUATE = 12;

const CATEGORIES = ["Events", "Jobs", "Grants", "Programs", "Wellbeing"];

interface Candidate {
  url: string;
  name: string;
  category: string;
  snippet: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function callLovableAI(messages: any[], tools?: any[], toolChoice?: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Lovable AI error ${res.status}: ${txt}`);
  }
  return await res.json();
}

async function firecrawlSearch(query: string, limit = 5): Promise<any[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");

  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) {
    console.error(`Firecrawl search failed: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  // Firecrawl v2 returns results under data.web (sometimes data.data)
  return data?.data?.web || data?.web || data?.data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const summary = {
      candidates_searched: 0,
      candidates_evaluated: 0,
      sources_added: 0,
      sources_auto_deactivated: 0,
      added: [] as any[],
      deactivated: [] as any[],
    };

    // ============ STEP 1: AUTO-PRUNE failing sources ============
    const { data: activeSources } = await supabase
      .from("scan_sources")
      .select("id, name, url, consecutive_failures")
      .eq("is_active", true);

    const toDeactivate = (activeSources || []).filter(
      (s: any) => (s.consecutive_failures || 0) >= FAILURE_THRESHOLD
    );

    for (const src of toDeactivate) {
      await supabase.from("scan_sources").update({ is_active: false }).eq("id", src.id);
      await supabase.from("rejected_sources").upsert(
        {
          url: src.url,
          domain: extractDomain(src.url),
          reason: `Auto-deactivated after ${src.consecutive_failures} consecutive scan failures`,
        },
        { onConflict: "url" }
      );
      summary.deactivated.push({ name: src.name, url: src.url, failures: src.consecutive_failures });
    }
    summary.sources_auto_deactivated = toDeactivate.length;
    console.log(`Auto-deactivated ${toDeactivate.length} failing sources`);

    // ============ STEP 2: AI generates search queries ============
    const aiResp = await callLovableAI(
      [
        {
          role: "system",
          content:
            "You suggest web search queries to discover NEW Australian, Victoria-focused source websites for young people aged 15-25. Use only these categories: Events, Jobs, Grants, Programs, Wellbeing. Prefer stable .gov.au, .org.au, education, council, and established nonprofit source pages. Avoid job boards, grant directories, ticketing platforms, generic news/blog sites, social posts, search result pages, and individual opportunity pages.",
        },
        {
          role: "user",
          content: `Generate 6 diverse Google search queries that would surface stable Victorian youth opportunity source pages we likely don't already know about. Cover only these categories: ${CATEGORIES.join(", ")}.`,
        },
      ],
      [
        {
          type: "function",
          function: {
            name: "suggest_queries",
            description: "Return search queries",
            parameters: {
              type: "object",
              properties: {
                queries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      query: { type: "string" },
                      category: { type: "string", enum: CATEGORIES },
                    },
                    required: ["query", "category"],
                  },
                },
              },
              required: ["queries"],
            },
          },
        },
      ],
      { type: "function", function: { name: "suggest_queries" } }
    );

    const queries: { query: string; category: string }[] =
      JSON.parse(aiResp.choices[0].message.tool_calls[0].function.arguments).queries || [];
    console.log(`AI suggested ${queries.length} queries`);

    // ============ STEP 3: Firecrawl search → candidate pool ============
    const { data: existingSources } = await supabase.from("scan_sources").select("url");
    const { data: rejected } = await supabase.from("rejected_sources").select("url, domain");
    const existingUrls = new Set((existingSources || []).map((s: any) => s.url));
    const existingDomains = new Set(
      [...(existingSources || []).map((s: any) => extractDomain(s.url)), ...(rejected || []).map((r: any) => r.domain)]
    );
    const rejectedUrls = new Set((rejected || []).map((r: any) => r.url));

    const candidates: Candidate[] = [];
    for (const q of queries) {
      const results = await firecrawlSearch(q.query, 4);
      summary.candidates_searched += results.length;
      for (const r of results) {
        const url = r.url;
        if (!url) continue;
        const domain = extractDomain(url);
        if (existingUrls.has(url) || rejectedUrls.has(url) || existingDomains.has(domain)) continue;
        candidates.push({
          url,
          name: (r.title || domain).slice(0, 120),
          category: q.category,
          snippet: (r.description || r.snippet || "").slice(0, 300),
        });
        if (candidates.length >= MAX_CANDIDATES_TO_EVALUATE) break;
      }
      if (candidates.length >= MAX_CANDIDATES_TO_EVALUATE) break;
    }
    console.log(`Collected ${candidates.length} unique candidates after de-duping`);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, summary, reason: "No new candidates" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ STEP 4: AI confidence filter ============
    const evalResp = await callLovableAI(
      [
        {
          role: "system",
          content:
            "You evaluate candidate websites for inclusion in a Victorian youth-opportunities directory. Approve ONLY if: (1) clearly Victoria/Australia focused, (2) regularly publishes opportunities relevant to ages 15-25, (3) fits exactly one category: Events, Jobs, Grants, Programs, Wellbeing, (4) is a stable source page from an official organisation, council, education provider, or nonprofit. Reject job boards, grant directories, ticketing platforms, social media posts, generic news/blog sites, individual ads, individual event pages, individual grant pages, and unstable search result pages. Be strict — reject when in doubt.",
        },
        {
          role: "user",
          content:
            `Evaluate these ${candidates.length} candidates and approve at most ${TARGET_NEW_SOURCES}. Return only the strongest matches.\n\n` +
            candidates
              .map((c, i) => `[${i}] ${c.name}\nURL: ${c.url}\nCategory: ${c.category}\nSnippet: ${c.snippet}`)
              .join("\n\n"),
        },
      ],
      [
        {
          type: "function",
          function: {
            name: "approve_candidates",
            description: "Approve the strongest candidates",
            parameters: {
              type: "object",
              properties: {
                approved: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "integer" },
                      cleaned_name: { type: "string", description: "Short, clean source name (max 80 chars)" },
                      category: { type: "string", enum: CATEGORIES },
                      reason: { type: "string" },
                    },
                    required: ["index", "cleaned_name", "category", "reason"],
                  },
                },
              },
              required: ["approved"],
            },
          },
        },
      ],
      { type: "function", function: { name: "approve_candidates" } }
    );

    summary.candidates_evaluated = candidates.length;
    const approved: any[] = JSON.parse(evalResp.choices[0].message.tool_calls[0].function.arguments).approved || [];
    console.log(`AI approved ${approved.length} candidates`);

    // ============ STEP 5: Insert approved sources ============
    for (const a of approved.slice(0, TARGET_NEW_SOURCES)) {
      const c = candidates[a.index];
      if (!c) continue;
      const { error } = await supabase.from("scan_sources").insert({
        name: a.cleaned_name || c.name,
        url: c.url,
        category: a.category,
        is_active: false,
        discovered_by_ai: true,
        discovered_at: new Date().toISOString(),
      });
      if (error) {
        console.error(`Failed to insert ${c.url}:`, error.message);
        continue;
      }
      summary.added.push({ name: a.cleaned_name, url: c.url, category: a.category, status: "pending_admin_review", reason: a.reason });
      summary.sources_added++;
    }

    // Mark candidates that were evaluated but NOT approved as rejected — so we don't keep finding them
    const approvedIndices = new Set(approved.map((a: any) => a.index));
    for (let i = 0; i < candidates.length; i++) {
      if (approvedIndices.has(i)) continue;
      const c = candidates[i];
      await supabase.from("rejected_sources").upsert(
        { url: c.url, domain: extractDomain(c.url), reason: "AI rejected during discovery" },
        { onConflict: "url" }
      );
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("discover-sources failed:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
