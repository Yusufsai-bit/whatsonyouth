// Generates OG share image PNG for a listing.
// GET /og-image?id=<listing_id>
// Returns 1200x630 PNG cached for 7 days.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import satori from 'https://esm.sh/satori@0.10.13';
import { Resvg, initWasm } from 'https://esm.sh/@resvg/resvg-wasm@2.6.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categoryColors: Record<string, string> = {
  Events: '#5847E0',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#0A2A3A',
  Wellbeing: '#D85A30',
};

let resvgInitPromise: Promise<void> | null = null;
async function ensureResvg() {
  if (!resvgInitPromise) {
    resvgInitPromise = (async () => {
      const wasm = await fetch('https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm').then(r => r.arrayBuffer());
      await initWasm(wasm);
    })();
  }
  return resvgInitPromise;
}

let fontPromise: Promise<ArrayBuffer> | null = null;
function loadFont() {
  if (!fontPromise) {
    // Inter Bold TTF from rsms/inter (raw GitHub)
    fontPromise = fetch('https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.woff')
      .then(r => { if (!r.ok) throw new Error(`font fetch ${r.status}`); return r.arrayBuffer(); });
  }
  return fontPromise;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response('missing id', { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: listing } = await supabase
      .from('listings')
      .select('title, organisation, location, category')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (!listing) return new Response('not found', { status: 404, headers: corsHeaders });

    const accent = categoryColors[listing.category] || '#5847E0';
    const title = String(listing.title).slice(0, 120);
    const org = String(listing.organisation || '').slice(0, 60);
    const loc = String(listing.location || '').slice(0, 60);
    const cat = String(listing.category || '');

    const [font] = await Promise.all([loadFont(), ensureResvg()]);

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
            background: '#0A0A0A', color: 'white', padding: '60px', fontFamily: 'Jakarta',
            position: 'relative',
          },
          children: [
            { type: 'div', props: { style: { width: '120px', height: '8px', background: accent, marginBottom: '40px', borderRadius: '4px' } } },
            { type: 'div', props: { style: { fontSize: '24px', color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }, children: cat } },
            { type: 'div', props: { style: { fontSize: '64px', fontWeight: 700, lineHeight: 1.15, marginBottom: '30px', maxWidth: '1080px' }, children: title } },
            { type: 'div', props: { style: { fontSize: '28px', color: '#CCCCCC', marginBottom: '6px' }, children: org } },
            { type: 'div', props: { style: { fontSize: '24px', color: '#888888' }, children: loc } },
            {
              type: 'div',
              props: {
                style: { position: 'absolute', bottom: '60px', right: '60px', fontSize: '28px', fontWeight: 700, color: '#5847E0' },
                children: 'whatsonyouth.org.au',
              },
            },
          ],
        },
      } as any,
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Jakarta', data: font, weight: 700, style: 'normal' }],
      },
    );

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800, s-maxage=604800',
      },
    });
  } catch (e) {
    return new Response(`error: ${String(e)}`, { status: 500, headers: corsHeaders });
  }
});
