// Build-time SEO check: scans key route page components for missing
// <SEO> usage, missing/empty title/description/canonical props, AND
// incorrect robots indexing directives (noindex/nofollow) on pages
// where indexing should or should NOT be allowed.
// Runs automatically during `vite build` via the seoCheckPlugin in vite.config.ts.
//
// Exits with code 1 (fails the build) when required SEO fields are missing
// or when robots indexing rules are wrong for a route.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// shouldIndex: true  → page MUST be indexable (no `noindex` allowed on <SEO>)
// shouldIndex: false → page MUST be `noindex` (private/auth/utility routes)
const ROUTES = [
  { route: '/', file: 'pages/Index.tsx', shouldIndex: true },
  { route: '/events', file: 'pages/CategoryListingPage.tsx', shouldIndex: true },
  { route: '/jobs', file: 'pages/CategoryListingPage.tsx', shouldIndex: true },
  { route: '/grants', file: 'pages/CategoryListingPage.tsx', shouldIndex: true },
  { route: '/programs', file: 'pages/CategoryListingPage.tsx', shouldIndex: true },
  { route: '/wellbeing', file: 'pages/CategoryListingPage.tsx', shouldIndex: true },
  { route: '/melbourne', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/geelong', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/ballarat', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/bendigo', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/gippsland', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/shepparton', file: 'pages/RegionalPage.tsx', shouldIndex: true },
  { route: '/listings/:id', file: 'pages/ListingDetailPage.tsx', shouldIndex: true },
  { route: '/search', file: 'pages/SearchPage.tsx', shouldIndex: true },
  { route: '/about', file: 'pages/AboutPage.tsx', shouldIndex: true },
  { route: '/contact', file: 'pages/ContactPage.tsx', shouldIndex: true },
  { route: '/privacy', file: 'pages/PrivacyPage.tsx', shouldIndex: true },
  // Private / utility routes — must be noindex
  { route: '/submit', file: 'pages/SubmitPage.tsx', shouldIndex: false },
  { route: '/login', file: 'pages/LoginPage.tsx', shouldIndex: false },
  { route: '/signup', file: 'pages/SignupPage.tsx', shouldIndex: false },
  { route: '/forgot-password', file: 'pages/ForgotPasswordPage.tsx', shouldIndex: false },
  { route: '/reset-password', file: 'pages/ResetPasswordPage.tsx', shouldIndex: false },
  { route: '/account', file: 'pages/AccountPage.tsx', shouldIndex: false },
  { route: '/saved', file: 'pages/SavedListingsPage.tsx', shouldIndex: false },
  { route: '/edit-listing/:id', file: 'pages/EditListingPage.tsx', shouldIndex: false },
];

const REQUIRED_PROPS = ['title', 'description', 'canonical'];

// Find the FIRST <SEO ... /> JSX block (handles multiline). Returns the prop string.
function extractSEOBlock(src) {
  const idx = src.indexOf('<SEO');
  if (idx === -1) return null;
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

// Find ALL <SEO ... /> blocks in a file (some pages render different SEO per state).
function extractAllSEOBlocks(src) {
  const blocks = [];
  let cursor = 0;
  while (true) {
    const idx = src.indexOf('<SEO', cursor);
    if (idx === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = idx; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (depth === 0 && c === '/' && src[i + 1] === '>') {
        end = i;
        break;
      } else if (depth === 0 && c === '>') {
        end = i;
        break;
      }
    }
    if (end === -1) break;
    blocks.push(src.slice(idx, end));
    cursor = end + 1;
  }
  return blocks;
}

function hasProp(block, prop) {
  // matches: prop="..."  or  prop={...}  or  prop  (boolean shorthand)
  const re = new RegExp(`\\b${prop}\\s*=\\s*(\\{[^}]*\\}|"[^"]+"|'[^']+'|\`[^\`]+\`)`);
  if (re.test(block)) return true;
  // boolean shorthand e.g. <SEO noindex ... />
  const shorthand = new RegExp(`\\b${prop}\\b(?!\\s*=)`);
  return shorthand.test(block);
}

// Returns true if the SEO block declares noindex. Handles `noindex`,
// `noindex={true}`, `noindex="true"`. A literal `{false}` counts as NOT noindex.
function isNoindex(block) {
  const m = block.match(/\bnoindex\s*=\s*\{([^}]*)\}/);
  if (m) return !/false/i.test(m[1]);
  if (/\bnoindex\s*=\s*"true"/i.test(block)) return true;
  if (/\bnoindex\s*=\s*"false"/i.test(block)) return false;
  // boolean shorthand
  return /\bnoindex\b(?!\s*=)/.test(block);
}

const issues = [];
const seen = new Map(); // file -> shouldIndex (we'll warn if same file used with conflicting expectations)

for (const { route, file, shouldIndex } of ROUTES) {
  // Don't re-check the same file, but flag conflicting expectations.
  if (seen.has(file)) {
    if (seen.get(file) !== shouldIndex) {
      issues.push({ route, file, problem: `conflicting indexing expectation: file used by both indexable and noindex routes` });
    }
    continue;
  }
  seen.set(file, shouldIndex);

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

  const blocks = extractAllSEOBlocks(src);
  if (blocks.length === 0) {
    issues.push({ route, file, problem: '<SEO> component not used' });
    continue;
  }

  // Robots check: every <SEO> block in the file must agree with shouldIndex.
  // - shouldIndex=true  → no block may be noindex
  // - shouldIndex=false → every block must be noindex
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockNoindex = isNoindex(block);
    const suffix = blocks.length > 1 ? ` (SEO block #${i + 1})` : '';

    if (shouldIndex && blockNoindex) {
      issues.push({
        route,
        file,
        problem: `route should be indexable but <SEO noindex /> is set${suffix} — remove the noindex prop`,
      });
    }
    if (!shouldIndex && !blockNoindex) {
      issues.push({
        route,
        file,
        problem: `route should be private (noindex) but <SEO> is missing the noindex prop${suffix}`,
      });
    }
  }

  // Required props: only validate against the first block (the primary SEO state).
  // Pages explicitly marked noindex don't need a canonical.
  const primary = blocks[0];
  const primaryNoindex = isNoindex(primary);
  const requiredForBlock = primaryNoindex
    ? REQUIRED_PROPS.filter((p) => p !== 'canonical')
    : REQUIRED_PROPS;

  for (const prop of requiredForBlock) {
    if (!hasProp(primary, prop)) {
      issues.push({ route, file, problem: `missing prop: ${prop}` });
    }
  }
}

const total = ROUTES.length;
const distinctFiles = new Set(ROUTES.map((r) => r.file)).size;

if (issues.length === 0) {
  console.log(
    `\n✓ SEO check passed — ${distinctFiles} page files covering ${total} routes have correct title, description, canonical, and robots indexing rules.\n`,
  );
  process.exit(0);
} else {
  console.error(`\n✗ SEO check failed — ${issues.length} issue${issues.length === 1 ? '' : 's'} found:\n`);
  for (const i of issues) {
    console.error(`  • [${i.route}] ${i.file} — ${i.problem}`);
  }
  console.error(
    '\nFix by updating <SEO ... /> on the page above:\n' +
      '  - Public pages need title, description, canonical (and must NOT have noindex)\n' +
      '  - Private/auth/utility pages must include the noindex prop\n',
  );
  process.exit(1);
}
