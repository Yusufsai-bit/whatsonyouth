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

function buildSearchQuery(
  title: string,
  category: string,
  organisation: string
): string {
  const categoryQueries: Record<string, string> = {
    Events: 'young people event festival victoria',
    Jobs: 'young professional workplace career australia',
    Grants: 'community grant funding opportunity australia',
    Programs: 'youth program learning development australia',
    Wellbeing: 'mental health support wellbeing calm',
  };

  return categoryQueries[category] || 'young people victoria australia';
}

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

  // Step 3: Unsplash with category-based queries
  const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (unsplashKey) {
    try {
      const query = buildSearchQuery(listingTitle, category, '');
      const params = new URLSearchParams({
        query,
        per_page: "5",
        orientation: "landscape",
        content_filter: "high",
        client_id: unsplashKey,
      });
      const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        if (results.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(results.length, 5));
          const selected = results[randomIndex];
          if (selected?.urls?.regular) {
            const imgUrl = selected.urls.regular;
            await supabase
              .from("listings")
              .update({ image_url: imgUrl })
              .eq("id", listingId);
            return { url: imgUrl, source: "unsplash" };
          }
        }
      }
    } catch { /* unsplash failed */ }
  }

  // Step 4: null
  return { url: null, source: null };
}
