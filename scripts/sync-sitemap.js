/**
 * Regenerate sitemap.xml from the explicit route policy.
 * Run: node scripts/sync-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'data', 'route-manifest.json');
const sitemapPath = path.join(root, 'sitemap.xml');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const defaults = manifest.sitemapDefaults || {};
const publicRoutes = manifest.routes?.['public-indexable'];

if (!Array.isArray(publicRoutes)) {
  throw new Error('route-manifest.json must define routes["public-indexable"]');
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function routeUrl(route) {
  if (route === '/') return `${manifest.origin}/`;
  return `${manifest.origin}${route}`;
}

function parseCurrentEntries(xml) {
  const entries = new Map();
  for (const match of xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)) {
    const block = match[1];
    const value = (tag) => {
      const found = block.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
      return found?.[1]?.trim();
    };
    const loc = value('loc');
    if (loc) {
      entries.set(loc, {
        lastmod: value('lastmod'),
        changefreq: value('changefreq'),
        priority: value('priority'),
      });
    }
  }
  return entries;
}

const currentXml = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const currentEntries = parseCurrentEntries(currentXml);
const seenRoutes = new Set();
const seenUrls = new Set();

const entries = publicRoutes.map((entry) => {
  if (!entry || typeof entry.file !== 'string' || typeof entry.route !== 'string') {
    throw new Error('Every public-indexable manifest entry needs file and route strings');
  }
  if (!entry.sitemap) {
    throw new Error(`${entry.file}: public-indexable route must opt into the sitemap`);
  }
  if (seenRoutes.has(entry.route)) {
    throw new Error(`${entry.file}: duplicate preferred route ${entry.route}`);
  }
  seenRoutes.add(entry.route);

  const loc = routeUrl(entry.route);
  if (seenUrls.has(loc)) throw new Error(`${entry.file}: duplicate sitemap URL ${loc}`);
  seenUrls.add(loc);

  const configured = entry.sitemap === true ? {} : entry.sitemap;
  const previous = currentEntries.get(loc) || {};
  const lastmod = configured.lastmod || previous.lastmod || defaults.lastmod;
  const changefreq = configured.changefreq || previous.changefreq || defaults.changefreq;
  const priority = configured.priority || previous.priority || defaults.priority;
  if (!lastmod || !changefreq || !priority) {
    throw new Error(`${entry.file}: incomplete sitemap metadata`);
  }

  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${xmlEscape(changefreq)}</changefreq>
    <priority>${xmlEscape(priority)}</priority>
  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Generated from data/route-manifest.json; public-indexable routes only. -->
${entries.join('\n')}

</urlset>
`;

if (currentXml.replace(/\r\n/g, '\n') === xml) {
  console.log(`Sitemap already synchronized: ${entries.length} public-indexable URLs`);
} else {
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Sitemap synced from route manifest: ${entries.length} public-indexable URLs`);
}
