// Generates public/sitemap.xml from STATIC_ROUTES.
// Runs automatically before every `vite build` via vite.config.ts.
// Listings (dynamic) are served by the sitemap-listings edge function and
// referenced from public/sitemap-index.xml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN, STATIC_ROUTES } from './sitemap-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const today = new Date().toISOString().split('T')[0];

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const entries = STATIC_ROUTES.filter(
  (r) => r.shouldIndex && !r.excludeFromStaticSitemap && !r.route.includes(':'),
);

const urlBlocks = entries
  .map((r) => {
    const loc = escapeXml(`${ORIGIN}${r.route}`);
    const parts = [`    <loc>${loc}</loc>`, `    <lastmod>${today}</lastmod>`];
    if (r.changefreq) parts.push(`    <changefreq>${r.changefreq}</changefreq>`);
    if (typeof r.priority === 'number') parts.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks}
</urlset>
`;

const outPath = path.join(projectRoot, 'public', 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`✓ sitemap.xml regenerated — ${entries.length} static URLs (lastmod ${today}).`);

// Also regenerate the sitemap-index so both static + dynamic listings sitemaps
// are advertised under one canonical entry-point.
const SUPABASE_PROJECT_REF = 'fmgkyrgsrsjiltubstry';
const listingsSitemapUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/sitemap-listings`;

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(listingsSitemapUrl)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;

const indexOutPath = path.join(projectRoot, 'public', 'sitemap-index.xml');
fs.writeFileSync(indexOutPath, indexXml, 'utf8');
console.log(`✓ sitemap-index.xml regenerated — points to static + dynamic listings sitemap.`);
