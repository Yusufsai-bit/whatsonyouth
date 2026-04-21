// Build-time SEO check: scans key route page components for missing
// <SEO> usage and missing/empty title, description, and canonical props.
// Runs automatically during `vite build` via the seoCheckPlugin in vite.config.ts.
//
// Exits with code 1 (fails the build) when required SEO fields are missing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Map of public route -> page file relative to /src
const ROUTES = [
  { route: '/', file: 'pages/Index.tsx' },
  { route: '/events', file: 'pages/CategoryListingPage.tsx' },
  { route: '/jobs', file: 'pages/CategoryListingPage.tsx' },
  { route: '/grants', file: 'pages/CategoryListingPage.tsx' },
  { route: '/programs', file: 'pages/CategoryListingPage.tsx' },
  { route: '/wellbeing', file: 'pages/CategoryListingPage.tsx' },
  { route: '/melbourne', file: 'pages/RegionalPage.tsx' },
  { route: '/geelong', file: 'pages/RegionalPage.tsx' },
  { route: '/ballarat', file: 'pages/RegionalPage.tsx' },
  { route: '/bendigo', file: 'pages/RegionalPage.tsx' },
  { route: '/gippsland', file: 'pages/RegionalPage.tsx' },
  { route: '/shepparton', file: 'pages/RegionalPage.tsx' },
  { route: '/listings/:id', file: 'pages/ListingDetailPage.tsx' },
  { route: '/search', file: 'pages/SearchPage.tsx' },
  { route: '/about', file: 'pages/AboutPage.tsx' },
  { route: '/contact', file: 'pages/ContactPage.tsx' },
  { route: '/privacy', file: 'pages/PrivacyPage.tsx' },
  { route: '/submit', file: 'pages/SubmitPage.tsx' },
];

const REQUIRED_PROPS = ['title', 'description', 'canonical'];

// Find <SEO ... /> JSX block (handles multiline). Returns the prop string.
function extractSEOBlock(src) {
  const idx = src.indexOf('<SEO');
  if (idx === -1) return null;
  // Find the matching close: either `/>` or `>` (self-closing only is what we use)
  let depth = 0;
  for (let i = idx; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0 && c === '/' && src[i + 1] === '>') {
      return src.slice(idx, i);
    } else if (depth === 0 && c === '>') {
      return src.slice(idx, i);
    }
  }
  return null;
}

function hasProp(block, prop) {
  // matches: prop="..."  or  prop={...}
  const re = new RegExp(`\\b${prop}\\s*=\\s*(\\{[^}]*\\}|"[^"]+"|'[^']+'|\`[^\`]+\`)`);
  return re.test(block);
}

const issues = [];
const seen = new Set();

for (const { route, file } of ROUTES) {
  if (seen.has(file)) continue;
  seen.add(file);

  const fullPath = path.join(projectRoot, 'src', file);
  if (!fs.existsSync(fullPath)) {
    issues.push({ route, file, problem: 'page file not found' });
    continue;
  }
  const src = fs.readFileSync(fullPath, 'utf8');

  if (!/from ['"]@\/components\/SEO['"]/.test(src) && !/from ['"]\.\.\/components\/SEO['"]/.test(src)) {
    issues.push({ route, file, problem: 'SEO component not imported' });
    continue;
  }

  const block = extractSEOBlock(src);
  if (!block) {
    issues.push({ route, file, problem: '<SEO> component not used' });
    continue;
  }

  for (const prop of REQUIRED_PROPS) {
    if (!hasProp(block, prop)) {
      issues.push({ route, file, problem: `missing prop: ${prop}` });
    }
  }
}

const total = ROUTES.length;
const distinctFiles = new Set(ROUTES.map((r) => r.file)).size;

if (issues.length === 0) {
  console.log(`\n✓ SEO check passed — ${distinctFiles} page files covering ${total} routes have title, description, and canonical.\n`);
  process.exit(0);
} else {
  console.error(`\n✗ SEO check failed — ${issues.length} issue${issues.length === 1 ? '' : 's'} found:\n`);
  for (const i of issues) {
    console.error(`  • [${i.route}] ${i.file} — ${i.problem}`);
  }
  console.error('\nFix by adding the <SEO ... /> component with title, description, and canonical props to the page above.\n');
  process.exit(1);
}
