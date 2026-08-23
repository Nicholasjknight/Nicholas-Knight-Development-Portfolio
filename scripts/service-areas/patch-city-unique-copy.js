/**
 * Surgically replace templated copy on existing web-designer-*.html pages.
 * Does not regenerate pages. Keeps Tampa / St. Pete / Clearwater sales-door blocks.
 *
 * Run after build-cities-json.js:
 *   node scripts/service-areas/patch-city-unique-copy.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf8'));
const UNIQUE = require('./city-unique-copy');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withTel(s) {
  return String(s).replace(
    /\(813\) 773-5553/g,
    '<a href="tel:+18137735553" style="color:#64ffda;">(813) 773-5553</a>'
  );
}

function replaceOnce(html, find, repl, label, slug) {
  const idx = html.indexOf(find);
  if (idx === -1) throw new Error(`${slug}: missing ${label}`);
  if (html.indexOf(find, idx + 1) !== -1) {
    throw new Error(`${slug}: ${label} matched more than once`);
  }
  return html.slice(0, idx) + repl + html.slice(idx + find.length);
}

function replaceOptional(html, find, repl) {
  const idx = html.indexOf(find);
  if (idx === -1) return html;
  return html.slice(0, idx) + repl + html.slice(idx + find.length);
}

function oldTemplateFaqs(cityName) {
  return [
    `Do you build websites specifically for ${cityName} businesses?`,
    `Can Knight Logics work on-site in ${cityName}?`,
    `What package fits most ${cityName} service businesses?`,
    `How long does a ${cityName} website build take?`,
    `Will a ${cityName} page help if I also serve neighboring cities?`,
    'Do you only do websites, or full growth systems too?',
    `What makes a ${cityName} page different from a template city page?`,
  ];
}

function faqCard(faq) {
  return `<div style="padding:20px; background:rgba(255,255,255,.03); border-radius:6px;">
                    <h3 style="color:#e6f1ff; font-size:1.05rem; margin:0 0 8px;">${esc(faq.q)}</h3>
                    <p style="margin:0;">${esc(faq.a)}</p>
                </div>`;
}

function needsHtml(needs) {
  return `<ul style="padding-left: 1.4em; margin-bottom: 24px;">
${needs
    .map(
      (n) =>
        `                <li style="margin-bottom: 12px;"><strong>${esc(n.title)}</strong> &mdash; ${esc(n.text)}</li>`
    )
    .join('\n')}
            </ul>`;
}

function processHtml(steps) {
  return `<div style="display:grid; gap: 16px; margin-bottom: 24px;">
${steps
    .map(
      (s, i) => `                <div style="display:flex; gap:16px; align-items:flex-start; padding:20px; background:rgba(100,255,218,.03); border:1px solid rgba(100,255,218,.1); border-radius:6px;">
                    <span style="color:#64ffda; font-size:1.3rem; font-weight:700; min-width:28px;">${i + 1}.</span>
                    <div><strong style="color:#e6f1ff; display:block; margin-bottom:4px;">${esc(s.title)}</strong> ${esc(s.text)}</div>
                </div>`
    )
    .join('\n')}
            </div>`;
}

function industriesHtml(items) {
  return `<ul style="padding-left: 1.4em; margin-bottom: 24px; display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px 24px;">
${items.map((item) => `                <li>${esc(item)}</li>`).join('\n')}
            </ul>`;
}

function replaceUntil(html, oldHeading, newHeading, afterHtml, untilNeedle, slug, label) {
  const startNeedle = `>${oldHeading}</h2>`;
  const start = html.indexOf(startNeedle);
  if (start === -1) throw new Error(`${slug}: missing ${label} heading "${oldHeading}"`);
  const h2Start = html.lastIndexOf('<h2', start);
  if (h2Start === -1) throw new Error(`${slug}: could not find ${label} <h2>`);
  const headingOpenEnd = html.indexOf('>', h2Start) + 1;
  const until = html.indexOf(untilNeedle, start + startNeedle.length);
  if (until === -1) throw new Error(`${slug}: missing ${label} end marker`);
  const newBlock = `${html.slice(h2Start, headingOpenEnd)}${esc(newHeading)}</h2>\n${afterHtml}\n\n            `;
  return html.slice(0, h2Start) + newBlock + html.slice(until);
}

function extractJsonObject(html, fromIndex) {
  const start = html.indexOf('{', fromIndex);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return { start, end: i + 1, json: html.slice(start, i + 1) };
    }
  }
  return null;
}

function replaceFaqJsonLd(html, cityName, uniqueFaqs, slug) {
  const marker = '"@type": "FAQPage"';
  const markerAt = html.indexOf(marker);
  if (markerAt === -1) throw new Error(`${slug}: missing FAQ JSON-LD`);
  const scriptOpen = html.lastIndexOf('<script type="application/ld+json">', markerAt);
  if (scriptOpen === -1) throw new Error(`${slug}: missing FAQ script tag`);
  const extracted = extractJsonObject(html, scriptOpen);
  if (!extracted) throw new Error(`${slug}: could not parse FAQ JSON-LD`);
  const data = JSON.parse(extracted.json);
  const oldQs = new Set(oldTemplateFaqs(cityName));
  let ui = 0;
  data.mainEntity = data.mainEntity.map((item) => {
    if (oldQs.has(item.name) && ui < uniqueFaqs.length) {
      const faq = uniqueFaqs[ui];
      ui += 1;
      return {
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      };
    }
    return item;
  });
  if (ui !== uniqueFaqs.length) {
    throw new Error(`${slug}: replaced ${ui} FAQ JSON-LD items, expected ${uniqueFaqs.length}`);
  }
  const pretty = JSON.stringify(data, null, 8);
  const scriptClose = html.indexOf('</script>', extracted.end);
  if (scriptClose === -1) throw new Error(`${slug}: missing FAQ script close`);
  return `${html.slice(0, scriptOpen)}<script type="application/ld+json">\n    ${pretty}\n    </script>${html.slice(scriptClose + 9)}`;
}

function patchPage(city) {
  const u = UNIQUE[city.slug];
  if (!u) throw new Error(`Missing unique copy for ${city.slug}`);
  const file = path.join(root, `web-designer-${city.slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const cityName = city.name;

  const oldHero = `Searching <strong style="color:#e6f1ff;">web designer ${cityName}</strong> or <strong style="color:#e6f1ff;">${cityName} web design</strong>? Knight Logics builds hand-coded sites for ${city.countyFull} businesses — local SEO structure, Google Business Profile alignment, and live Tampa Bay proof — with on-site support in the metro and full remote delivery nationwide.`;
  html = replaceOnce(html, oldHero, esc(u.heroLead), 'hero lead', city.slug);

  const formH2Open = '<h2 style="margin:12px 0 6px;font-size:1.1rem;color:#fff;line-height:1.15;">';
  const formPOpen = '<p style="margin:0;color:rgba(255,255,255,.72);font-size:.86rem;line-height:1.35;">';
  const formBlockRe = new RegExp(
    `${formH2Open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?</h2>\\s*${formPOpen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?</p>`
  );
  if (!formBlockRe.test(html)) throw new Error(`${city.slug}: missing form title/lead`);
  html = html.replace(
    formBlockRe,
    `${formH2Open}${esc(u.formTitle)}</h2>\n                            ${formPOpen}${withTel(esc(u.formLead))}</p>`
  );

  const whyParas = u.whyParagraphs.map((p) => `            <p>${esc(p)}</p>`).join('\n');
  html = replaceUntil(
    html,
    `Why ${cityName} needs a stronger website than a template`,
    u.whyHeading,
    whyParas,
    '<div style="margin: 28px 0 36px; padding: 24px 26px;',
    city.slug,
    'why'
  );

  const oldLocal = `On-site collaboration is available in ${cityName} and across Tampa Bay. Full remote website and growth-system delivery is available nationwide.`;
  html = replaceOnce(html, oldLocal, esc(u.localAngle), 'local angle', city.slug);

  const marketParas = u.marketParagraphs.map((p) => `            <p>${esc(p)}</p>`).join('\n');
  html = replaceUntil(
    html,
    `How ${cityName} buyers actually find and book`,
    u.marketHeading,
    marketParas,
    '<section class="kl-proof-section"',
    city.slug,
    'market'
  );

  const oldProof = `Nearby Tampa Bay builds (Screen Team, Knight Group, JNS, Sal’s Painting, and others) show the same hand-coded, search-ready foundation ${cityName} businesses need. Your page count and package tier change; the quality bar does not. When we have a ${cityName}-specific project, it is featured here; until then, regional proof still demonstrates the delivery standard.`;
  html = replaceOnce(html, oldProof, esc(u.proofBlurb), 'proof blurb', city.slug);

  html = replaceOnce(
    html,
    `The same pattern we use for ${cityName} launches: service silos, estimate CTAs, schema, and pages built for map-pack clicks on phones.`,
    esc(u.proofPattern),
    'proof pattern',
    city.slug
  );
  html = replaceOnce(
    html,
    `Speed that survives Slow 4G in ${cityName}`,
    esc(u.proofPerfHeading),
    'proof speed heading',
    city.slug
  );
  html = replaceOnce(
    html,
    `Every Knight Logics build targets strong Lighthouse and PageSpeed results so ${cityName} visitors from Maps do not bounce before the estimate form loads.`,
    esc(u.proofSpeed),
    'proof speed',
    city.slug
  );
  html = replaceOnce(
    html,
    `Performance for ${cityName} local results`,
    esc(u.proofLabHeading),
    'proof lab heading',
    city.slug
  );
  html = replaceOnce(
    html,
    `The map layer ${cityName} sites cannot ignore`,
    esc(u.proofMapsHeading),
    'proof maps heading',
    city.slug
  );
  html = replaceOnce(
    html,
    `The local map pack is often the first thing a ${cityName} searcher sees. Sites ship with`,
    `${esc(u.proofMaps)} Sites ship with`,
    'proof maps',
    city.slug
  );

  html = replaceUntil(
    html,
    `What a ${cityName} site should include`,
    u.needsHeading,
    `            ${needsHtml(u.needs)}`,
    '<article class="svc-mirror fade-in" style="margin: 2.5rem 0;">',
    city.slug,
    'needs'
  );

  html = replaceUntil(
    html,
    `The build process for ${cityName} clients`,
    u.processHeading,
    `            ${processHtml(u.processSteps)}`,
    `<h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">Industries we support around ${cityName}</h2>`,
    city.slug,
    'process'
  );

  const industryParas = `            <p>${esc(u.industriesBlurb)}</p>\n            ${industriesHtml(u.industries)}`;
  html = replaceUntil(
    html,
    `Industries we support around ${cityName}`,
    u.industriesHeading,
    industryParas,
    '<p><a href="/nicholas-knight"',
    city.slug,
    'industries'
  );

  const oldFaqs = oldTemplateFaqs(cityName);
  oldFaqs.forEach((oldQ, i) => {
    const cardRe = new RegExp(
      `<div style="padding:20px; background:rgba\\(255,255,255,\\.03\\); border-radius:6px;">\\s*<h3[^>]*>${oldQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h3>\\s*<p style="margin:0;">[\\s\\S]*?</p>\\s*</div>`
    );
    if (!cardRe.test(html)) throw new Error(`${city.slug}: missing FAQ card "${oldQ}"`);
    html = html.replace(cardRe, faqCard(u.faqs[i]));
  });

  html = replaceFaqJsonLd(html, cityName, u.faqs, city.slug);

  const oldCta = `If your ${cityName} site is not earning calls or organic leads, the free audit shows what is actually blocking you — technical debt, thin structure, GBP mismatch, or conversion gaps — before you spend on a rebuild. Bring your current URL and we will map the ${cityName} opportunity against ${city.countyFull} competition.`;
  html = replaceOnce(html, oldCta, esc(u.ctaBlurb), 'cta blurb', city.slug);

  html = replaceOptional(html, '"dateModified": "2026-07-24"', '"dateModified": "2026-08-23"');

  fs.writeFileSync(file, html);
}

if (cities.length !== 20) throw new Error(`Expected 20 cities, got ${cities.length}`);
for (const city of cities) patchPage(city);
console.log(`Patched unique copy on ${cities.length} city pages`);
