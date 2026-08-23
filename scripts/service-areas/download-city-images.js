/**
 * City content images policy — verified local photography only.
 *
 * Previous Unsplash "vibe" downloads were geographically false (Banff on Brandon,
 * NYC on Dunedin, Golden Gate on New Port Richey, Chicago snow on Tampa).
 *
 * Current files live in images/service-areas/{slug}.webp and were fetched from
 * Wikimedia Commons by scripts/service-areas/replace-city-images.js.
 *
 * Do not download generic stock. Do not regenerate city HTML from
 * generate-city-pages.js without checking sales-door CTAs — overwrite the
 * image files in place instead.
 *
 * Run: node scripts/service-areas/download-city-images.js
 */
const fs = require('fs');
const path = require('path');

const { CITIES } = require('./replace-city-images.js');
const outDir = path.join(__dirname, '..', '..', 'images', 'service-areas');

const ATTR = `# Service-area content images

Policy: only verified exact-city photographs (Wikimedia Commons) or owned captures.

Hero sections use the shared Knight Logics hero pattern (no per-city hero photo).
In-article metro images must depict the named city. Misleading stock is forbidden.

To refresh binaries: \`node scripts/service-areas/replace-city-images.js\`

See \`ATTRIBUTION.md\` in this folder for license and credit.

| Slug | Commons file | Status |
|------|--------------|--------|
${Object.entries(CITIES)
  .map(([slug, spec]) => `| ${slug} | ${spec.file} | verified |`)
  .join('\n')}
`;

if (!CITIES) {
  console.error('replace-city-images.js must export CITIES');
  process.exit(1);
}

fs.writeFileSync(path.join(outDir, 'SOURCES.md'), ATTR);
console.log('Wrote images/service-areas/SOURCES.md from verified Commons map.');
console.log('Verified cities:', Object.keys(CITIES).length);
console.log('No vibe-stock downloads will run.');
