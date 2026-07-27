/**
 * City content images policy — verified local photography only.
 *
 * Previous Unsplash "vibe" downloads were inaccurate (wrong cities) and damaged
 * trust + image SEO. This script NO LONGER downloads generic stock.
 *
 * Workflow:
 * 1. Capture or license a verified photo of the exact city (landmark / corridor).
 * 2. Save as images/service-areas/{slug}.jpg (or .webp).
 * 3. Set imageVerified: true for that city in build-cities-json.js (or patch cities.json).
 * 4. Rebuild: node scripts/service-areas/build-cities-json.js
 * 5. Regenerate: node scripts/service-areas/generate-city-pages.js
 *
 * Until then, generate-city-pages.js emits .kl-media-needed placeholders.
 *
 * Run: node scripts/service-areas/download-city-images.js
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', '..', 'images', 'service-areas');
fs.mkdirSync(outDir, { recursive: true });

const SLUGS = [
  'tampa',
  'st-petersburg',
  'clearwater',
  'safety-harbor',
  'palm-harbor',
  'dunedin',
  'largo',
  'pinellas-park',
  'seminole',
  'tarpon-springs',
  'oldsmar',
  'brandon',
  'riverview',
  'temple-terrace',
  'lutz',
  'wesley-chapel',
  'new-port-richey',
  'holiday',
  'land-o-lakes',
  'plant-city',
];

/** Optional: map slug → verified HTTPS URL of an exact-city photograph with known license. */
const VERIFIED_SOURCES = {
  // Example (do not enable until URL is confirmed as that city):
  // tampa: 'https://upload.wikimedia.org/wikipedia/commons/.../Tampa_....jpg',
};

const ATTR = `# Service-area content images

Policy (2026-07): only verified exact-city photographs or owned captures.

Hero sections on city pages use the shared Knight Logics hero pattern (no per-city hero photo).
In-article metro images must depict the named city. Misleading stock is forbidden.

| Slug | Status |
|------|--------|
${SLUGS.map((k) => `| ${k} | ${VERIFIED_SOURCES[k] ? 'verified URL configured' : 'PLACEHOLDER — supply photo, then set imageVerified'} |`).join('\n')}

Until a verified file exists, city HTML uses \`.kl-media-needed\` placeholders.
`;

fs.writeFileSync(path.join(outDir, 'SOURCES.md'), ATTR);
console.log('Wrote images/service-areas/SOURCES.md');
console.log('Verified downloads configured:', Object.keys(VERIFIED_SOURCES).length);
console.log('Remaining placeholders:', SLUGS.filter((s) => !VERIFIED_SOURCES[s]).length);
console.log('No vibe-stock downloads will run. Add VERIFIED_SOURCES entries when you have exact-city URLs.');
