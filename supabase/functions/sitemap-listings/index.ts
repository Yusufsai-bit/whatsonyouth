// Dynamic sitemap of all active listing detail pages.
// Served at: https://<project-ref>.supabase.co/functions/v1/sitemap-listings
// Referenced from public/sitemap-index.xml so Google discovers new listings
// within minutes of being created — no redeploy needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ORIGIN = 'https://www.whatsonyouth.org.au'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch in pages of 1000 to cover beyond the default Supabase row cap.
    const all: { id: string; created_at: string }[] = []
    let from = 0
    const PAGE = 1000
    while (true) {
      const { data, error } = await supabase
        .from('listings')
        .select('id, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)

      if (error) throw error
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }

    const urls = all
      .map((l) => {
        const date = (l.created_at || '').split('T')[0]
        return `  <url>
    <loc>${escapeXml(`${ORIGIN}/listings/${l.id}`)}</loc>
    ${date ? `<lastmod>${date}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      })
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900', // 15 min — surfaces new listings fast
      },
    })
  } catch (err) {
    console.error('sitemap-listings error:', err)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
      },
    )
  }
})
