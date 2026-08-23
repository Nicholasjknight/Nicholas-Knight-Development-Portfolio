const fs = require('fs');
const cities = JSON.parse(fs.readFileSync('scripts/service-areas/cities.json', 'utf8'));
const h1 = new Set();
const meta = new Set();
const img = new Set();
const why0 = new Set();
const hero = new Set();
let ok = true;
const BANNED = [
  'brochure contest',
  'next step obvious',
  'Internal linking is part',
  'Content depth matters',
  'Search Console data for',
  'The competitive angle in',
  'Neighborhood and corridor intent',
  'Talk Through Your Project',
  'Need a stronger site or better rankings',
  'projects commonly include contractors, home services, specialty trades',
  'The same pattern we use for',
  'Speed that survives Slow 4G',
  'The map layer ',
];
const SALES_DOOR = ['tampa', 'st-petersburg', 'clearwater'];
const pages = fs.readdirSync('.').filter((name) => /^web-designer-.+\.html$/.test(name));
if (pages.length !== 20) {
  console.log('CITY PAGE COUNT', pages.length, 'expected 20');
  ok = false;
}
for (const c of cities) {
  if (h1.has(c.h1)) { console.log('DUP H1', c.slug); ok = false; }
  h1.add(c.h1);
  if (meta.has(c.metaDescription)) { console.log('DUP META', c.slug); ok = false; }
  meta.add(c.metaDescription);
  if (img.has(c.contentImage)) { console.log('DUP IMG PATH', c.slug); ok = false; }
  img.add(c.contentImage);
  if (why0.has(c.whyParagraphs[0])) { console.log('DUP WHY0', c.slug); ok = false; }
  why0.add(c.whyParagraphs[0]);
  if (hero.has(c.heroLead)) { console.log('DUP HERO', c.slug); ok = false; }
  hero.add(c.heroLead);
  const p = `web-designer-${c.slug}.html`;
  if (!fs.existsSync(p)) { console.log('MISSING PAGE', p); ok = false; }
  const imgPath = c.contentImage.replace(/^\//, '');
  if (!fs.existsSync(imgPath)) { console.log('MISSING IMG', imgPath); ok = false; }
  const html = fs.readFileSync(p, 'utf8');
  if (!/Remote U\.S\.|remote nationwide|Remote nationwide/i.test(html)) {
    console.log('NO REMOTE MSG', c.slug); ok = false;
  }
  if (!html.includes(c.contentImage)) { console.log('IMG NOT IN HTML', c.slug); ok = false; }
  const heroMatch = html.match(/<section class="cs-hero"[\s\S]*?<\/section>/);
  if (heroMatch && /<img[^>]+service-areas/i.test(heroMatch[0])) {
    console.log('CITY IMG IN HERO', c.slug); ok = false;
  }
  if (c.approxWordCount < 900) console.log('LOW WORDS', c.slug, c.approxWordCount);
  for (const stem of BANNED) {
    if (html.includes(stem)) {
      console.log('TEMPLATED STEM', c.slug, stem);
      ok = false;
    }
  }
  if (!html.includes(c.whyParagraphs[0].slice(0, 40))) {
    console.log('UNIQUE WHY MISSING', c.slug);
    ok = false;
  }
  if (!html.includes(c.formTitle)) {
    console.log('UNIQUE FORM TITLE MISSING', c.slug);
    ok = false;
  }
  if (SALES_DOOR.includes(c.slug)) {
    if (!html.includes('id="before-after"') || !html.includes('id="estimates"')) {
      console.log('SALES DOOR MISSING', c.slug);
      ok = false;
    }
  }
}
const sizes = {};
for (const f of fs.readdirSync('images/service-areas').filter((x) => x.endsWith('.jpg'))) {
  const n = fs.statSync(`images/service-areas/${f}`).size;
  if (sizes[n]) console.log('SAME SIZE', sizes[n], f);
  else sizes[n] = f;
}
const locs = (fs.readFileSync('sitemap.xml', 'utf8').match(/<loc>/g) || []).length;
console.log('cities', cities.length, 'sitemap locs', locs, 'qa', ok ? 'PASS' : 'FAIL');
