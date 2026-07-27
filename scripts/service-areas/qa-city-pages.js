const fs = require('fs');
const cities = JSON.parse(fs.readFileSync('scripts/service-areas/cities.json', 'utf8'));
const h1 = new Set();
const meta = new Set();
const img = new Set();
let ok = true;
for (const c of cities) {
  if (h1.has(c.h1)) { console.log('DUP H1', c.slug); ok = false; }
  h1.add(c.h1);
  if (meta.has(c.metaDescription)) { console.log('DUP META', c.slug); ok = false; }
  meta.add(c.metaDescription);
  if (img.has(c.contentImage)) { console.log('DUP IMG PATH', c.slug); ok = false; }
  img.add(c.contentImage);
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
}
const sizes = {};
for (const f of fs.readdirSync('images/service-areas').filter((x) => x.endsWith('.jpg'))) {
  const n = fs.statSync(`images/service-areas/${f}`).size;
  if (sizes[n]) console.log('SAME SIZE', sizes[n], f);
  else sizes[n] = f;
}
const locs = (fs.readFileSync('sitemap.xml', 'utf8').match(/<loc>/g) || []).length;
console.log('cities', cities.length, 'sitemap locs', locs, 'qa', ok ? 'PASS' : 'FAIL');
