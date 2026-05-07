// Geocodes listings via OpenStreetMap Nominatim. Free, no key.
// Usage: POST { listing_ids?: string[], limit?: number }
// If listing_ids omitted, picks up to `limit` (default 25) active listings missing coords.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Listing {
  id: string;
  location: string;
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ', Victoria, Australia')}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'WhatsOnYouth/1.0 (info@whatsonyouth.org.au)' } });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let listing_ids: string[] | undefined;
    let limit = 25;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      listing_ids = body.listing_ids;
      if (typeof body.limit === 'number') limit = Math.min(100, Math.max(1, body.limit));
    }

    let q = supabase
      .from('listings')
      .select('id, location')
      .eq('is_active', true)
      .is('latitude', null);

    if (listing_ids && listing_ids.length) q = q.in('id', listing_ids);
    else q = q.limit(limit);

    const { data: rows, error } = await q;
    if (error) throw error;

    let success = 0;
    let failed = 0;
    for (const row of (rows as Listing[]) || []) {
      if (!row.location || row.location.trim().length < 2) { failed++; continue; }
      const coords = await geocode(row.location);
      if (coords) {
        await supabase
          .from('listings')
          .update({ latitude: coords.lat, longitude: coords.lng, geocoded_at: new Date().toISOString() })
          .eq('id', row.id);
        success++;
      } else {
        await supabase
          .from('listings')
          .update({ geocoded_at: new Date().toISOString() })
          .eq('id', row.id);
        failed++;
      }
      // Nominatim usage policy: max 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }

    return new Response(JSON.stringify({ processed: (rows || []).length, success, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
