/**
 * Replace misleading Unsplash vibe-stock with verified Wikimedia Commons
 * photographs of the named Tampa Bay city (or its defining corridor).
 *
 * Run: node scripts/service-areas/replace-city-images.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const UA = 'KnightLogicsCityMedia/1.0 (https://knightlogics.com; support@knightlogics.com)';
const OUT = path.join(__dirname, '..', '..', 'images', 'service-areas');
const FFMPEG = 'C:\\Users\\nknig\\Downloads\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe';

const CITIES = {
  tampa: {
    file: 'Tampa Florida November 2013-2b.jpg',
    alt: 'Downtown Tampa, Florida skyline',
    caption: 'Downtown Tampa along the Hillsborough River.',
  },
  'st-petersburg': {
    file: 'Downtown St. Petersburg, Florida 2019.jpg',
    alt: 'Downtown St. Petersburg, Florida',
    caption: 'Downtown St. Petersburg.',
  },
  clearwater: {
    file: 'Clearwater-beach-florida-oceanview.jpg',
    alt: 'Clearwater Beach, Florida looking toward the Gulf',
    caption: 'Clearwater Beach on the Gulf of Mexico.',
  },
  'safety-harbor': {
    file: 'Safety Harbor FL water bay01.jpg',
    alt: 'Safety Harbor, Florida waterfront on Tampa Bay',
    caption: 'Safety Harbor waterfront on Tampa Bay.',
  },
  'palm-harbor': {
    file: 'Brooker Creek John Chesnut Park.jpg',
    alt: 'Brooker Creek at John Chesnut Sr. Park, Palm Harbor, Florida',
    caption: 'Brooker Creek at John Chesnut Sr. Park in Palm Harbor.',
  },
  dunedin: {
    file: 'Dunedin, FL City Hall.jpg',
    alt: 'Dunedin City Hall, Dunedin, Florida',
    caption: 'Dunedin City Hall.',
  },
  largo: {
    file: 'Largo Library 2005.jpg',
    alt: 'Largo Public Library, Largo, Florida',
    caption: 'Largo Public Library.',
  },
  'pinellas-park': {
    file: 'CSX Clearwater Subdivision - Pinellas Park, Florida.jpg',
    alt: 'CSX Clearwater Subdivision in Pinellas Park, Florida',
    caption: 'Rail corridor through Pinellas Park.',
  },
  seminole: {
    file: 'Sunset Lake Walsingham Seminole Florida on October 30 2020.JPG',
    alt: 'Lake Walsingham sunset, Seminole, Florida',
    caption: 'Lake Walsingham in Seminole.',
  },
  'tarpon-springs': {
    file: 'SpongeDocks.jpg',
    alt: 'Sponge Docks in Tarpon Springs, Florida',
    caption: 'Tarpon Springs Sponge Docks.',
  },
  oldsmar: {
    file: 'Aerial view of Oldsmar, Florida.jpg',
    alt: 'Aerial view of Oldsmar, Florida',
    caption: 'Aerial view of Oldsmar.',
  },
  brandon: {
    file: 'Westfieldmall.jpg',
    alt: 'Westfield Brandon mall, Brandon, Florida',
    caption: 'Westfield Brandon mall — the commercial center of Brandon.',
  },
  riverview: {
    file: 'Alafia River near Lithia Springs Park.jpg',
    alt: 'Alafia River near Riverview, Hillsborough County, Florida',
    caption: 'Alafia River near Lithia Springs — the river corridor through Riverview.',
  },
  'temple-terrace': {
    file: 'New Temple Terrace entry tower, 56th Street.jpg',
    alt: 'Temple Terrace entry tower on 56th Street, Florida',
    caption: 'Temple Terrace entry on 56th Street.',
  },
  lutz: {
    file: 'Lutz-Train-Depot.jpg',
    alt: 'Historic Lutz train depot, Lutz, Florida',
    caption: 'Historic Lutz train depot.',
  },
  'wesley-chapel': {
    file: 'Wesley Chapel, Florida.jpg',
    alt: 'Wesley Chapel, Florida',
    caption: 'Wesley Chapel in Pasco County.',
  },
  'new-port-richey': {
    file: 'Overlooking Cotee from Sims Park.jpg',
    alt: 'Sims Park and the Cotee River, New Port Richey, Florida',
    caption: 'Sims Park amphitheatre in New Port Richey.',
  },
  holiday: {
    file: 'Anclote power plant stack.jpg',
    alt: 'Anclote River Park, Holiday, Florida',
    caption: 'Sailboats at Anclote River Park in Holiday.',
  },
  'land-o-lakes': {
    file: "Land O' Lakes, Florida from hot air balloon.jpg",
    alt: "Aerial view of Land O' Lakes, Florida",
    caption: "US 41 and State Road 54 in Land O' Lakes, from a hot-air balloon.",
  },
  'plant-city': {
    file: 'Plant City FL Downtown Comm Dist01.JPG',
    alt: 'Downtown Plant City, Florida commercial district',
    caption: 'Downtown Plant City commercial district.',
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wikiJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function imageInfo(file) {
  const title = `File:${file}`;
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url|size|extmetadata|mime' +
    '&iiurlwidth=1800' +
    `&titles=${encodeURIComponent(title)}`;
  const data = await wikiJson(url);
  const page = Object.values(data.query.pages)[0];
  if (!page || page.missing || !page.imageinfo) {
    throw new Error(`No imageinfo for ${file}`);
  }
  return page.imageinfo[0];
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} downloading ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function convert(src, destWebp, destJpg) {
  const vf = 'scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900';
  const webp = spawnSync(
    FFMPEG,
    ['-y', '-i', src, '-vf', vf, '-c:v', 'libwebp', '-quality', '82', destWebp],
    { encoding: 'utf8' }
  );
  if (webp.status !== 0) {
    throw new Error(`ffmpeg webp failed: ${webp.stderr.slice(-400)}`);
  }
  const jpg = spawnSync(
    FFMPEG,
    ['-y', '-i', src, '-vf', vf, '-q:v', '3', destJpg],
    { encoding: 'utf8' }
  );
  if (jpg.status !== 0) {
    throw new Error(`ffmpeg jpg failed: ${jpg.stderr.slice(-400)}`);
  }
}

function meta(info, key) {
  return (info.extmetadata && info.extmetadata[key] && info.extmetadata[key].value) || '';
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(OUT, '_tmp-src');
  fs.mkdirSync(tmp, { recursive: true });

  const rows = [];
  for (const [slug, spec] of Object.entries(CITIES)) {
    process.stdout.write(`${slug} … `);
    const info = await imageInfo(spec.file);
    const srcUrl = info.thumburl || info.url;
    const srcPath = path.join(tmp, `${slug}-src${path.extname(spec.file) || '.jpg'}`);
    await download(srcUrl, srcPath);
    convert(srcPath, path.join(OUT, `${slug}.webp`), path.join(OUT, `${slug}.jpg`));
    const artist = String(meta(info, 'Artist')).replace(/<[^>]+>/g, '').trim();
    const license = String(meta(info, 'LicenseShortName') || meta(info, 'UsageTerms')).replace(/<[^>]+>/g, '').trim();
    rows.push({
      slug,
      file: spec.file,
      alt: spec.alt,
      caption: spec.caption,
      artist,
      license,
      commons: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(spec.file).replace(/%20/g, '_')}`,
    });
    console.log('ok');
    await sleep(1200);
  }

  const md = `# Service-area content images

In-article metro photographs only (not hero). Replaced 2026-08-23.

Previous Unsplash “vibe” downloads were geographically false (Banff mountains on Brandon,
NYC on Dunedin, Golden Gate on New Port Richey, Chicago snow on Tampa, etc.).

Current files are Wikimedia Commons photographs of the named Tampa Bay city or its
defining local corridor. Do not swap them for generic stock.

| Slug | Commons file | License | Author / credit | On-page caption |
|------|--------------|---------|-----------------|-----------------|
${rows
  .map(
    (r) =>
      `| ${r.slug} | [${r.file}](${r.commons}) | ${r.license || 'see Commons'} | ${r.artist || 'see Commons'} | ${r.caption} |`
  )
  .join('\n')}

Hero sections stay the shared Knight Logics form pattern (no per-city hero photograph).
`;
  fs.writeFileSync(path.join(OUT, 'ATTRIBUTION.md'), md);
  fs.writeFileSync(path.join(OUT, 'city-image-meta.json'), JSON.stringify({ generated: new Date().toISOString(), rows }, null, 2));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('Wrote ATTRIBUTION.md and city-image-meta.json');
}

module.exports = { CITIES };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
