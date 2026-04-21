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

// Static URLs sitemap — written to its own file so the index can list it
// alongside the dynamic listings sitemap (and any future sitemaps) cleanly.
const staticOutPath = path.join(projectRoot, 'public', 'sitemap-static.xml');
fs.writeFileSync(staticOutPath, xml, 'utf8');
console.log(`✓ sitemap-static.xml regenerated — ${entries.length} static URLs (lastmod ${today}).`);

// Also regenerate the sitemap-index so each child sitemap (static + dynamic
// listings) is advertised under one canonical entry-point. Splitting them
// keeps each child sitemap well within Google's 50k URLs / 50MB limits and
// lets crawlers fetch only what changed.
const SUPABASE_PROJECT_REF = 'fmgkyrgsrsjiltubstry';
const listingsSitemapUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/sitemap-listings`;

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap-static.xml</loc>
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
console.log(`✓ sitemap-index.xml regenerated — points to sitemap-static.xml + dynamic listings sitemap.`);

// Backwards compatibility: keep /sitemap.xml as a tiny pointer-style sitemap
// index so anything (old Search Console submissions, external links) that still
// requests /sitemap.xml is redirected to the canonical index. Plain XML, no
// server-side redirect needed.
const legacyXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap-index.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
fs.writeFileSync(path.join(projectRoot, 'public', 'sitemap.xml'), legacyXml, 'utf8');
console.log(`✓ sitemap.xml updated as legacy pointer to sitemap-index.xml.`);
