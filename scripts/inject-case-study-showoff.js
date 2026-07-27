/**
 * Inject shared walkthrough + FAQ blocks into hand-crafted case study HTML.
 * Idempotent: skips pages that already contain cs-media-grid.
 */
const fs = require('fs');
const path = require('path');
const { videos, images } = require('./growth-content-media');
const { renderWalkthrough, renderFaq, VER } = require('./growth-page-template');

const ROOT = path.join(__dirname, '..');

const PAGES = {
  'case-study-screen-team.html': {
    ogImage: 'https://knightlogics.com/images/showcase/screen-team-og-card.png',
    walkthrough: {
      title: 'Site walkthrough &amp; proof',
      intro: 'Watch the Screen Team rebuild, then real workspace stills — banner, job photos, and service previews from the Screen Team site.',
      primary: { ...videos.screenTeam, poster: '/images/screen-team/banner.webp' },
      proofs: [
        { src: '/images/screen-team/banner.webp', alt: 'Screen Team LLC homepage banner', caption: 'Live homepage banner from the Screen Team workspace — quote-first enclosure brand.', width: 1920, height: 1080 },
        { src: '/images/screen-team/job-pool-enclosure.jpg', alt: 'Screen Team pool enclosure job photo', caption: 'Real job photography from Screen Team’s gallery — pool enclosure work in Tampa Bay.', width: 1200, height: 800 }
      ],
      audits: [
        { src: '/images/screen-team/services/pool-enclosures.jpg', alt: 'Pool enclosure service preview', title: 'Pool enclosures', text: 'Service-page preview art from the Screen Team site build.' },
        { src: '/images/screen-team/services/rescreens.jpg', alt: 'Rescreen service preview', title: 'Rescreens', text: 'High-intent service coverage for repair and replacement work.' },
        { src: '/images/screen-team/services/screen-lanais.jpg', alt: 'Screen lanai service preview', title: 'Screen lanais', text: 'Lanai and patio screening depth on the live site.' },
        { src: '/images/screen-team/services/window-screens.jpg', alt: 'Window screen service preview', title: 'Window screens', text: 'Window and garage screen lanes with matching CTAs.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build a similar local growth site',
      ctaSecondaryHref: '/home-service-business-growth-systems',
      ctaSecondaryLabel: 'Home service systems'
    },
    faq: [
      { q: 'Is Screen Team a one-off brochure site?', a: 'No. It is a 36-page growth system with quote-first CTAs, local SEO depth, and live OutreachEngine / Email-Agent lanes — the same stack pattern used on Faith Works and Knight Group.' },
      { q: 'Can you rebuild my trade site like this?', a: 'Yes. We scope service pages, city coverage, conversion CTAs, and optional CRM outreach for your trade and territory.' },
      { q: 'What scores should I expect?', a: 'Screen Team ships with strong Lighthouse performance and SEO scores. Exact numbers depend on imagery and third-party scripts — we optimize for re-testable results, not vanity screenshots.' },
      { q: 'Does this include ongoing outreach?', a: 'Screen Team runs on the st OutreachEngine lane. Outreach is optional per client and configured with brand-safe caps and templates.' }
    ]
  },
  'case-study-knight-group.html': {
    ogImage: 'https://knightlogics.com/images/showcase/knight-group-og-card.jpg',
    walkthrough: {
      title: 'Site walkthrough &amp; proof',
      intro: 'Knight Group website walkthrough plus the hero and architecture stills behind the 97-page growth system.',
      primary: { ...videos.knightGroup },
      proofs: [
        { src: '/images/KGHero.webp', alt: 'Knight Group handyman website hero', caption: 'Live hero with booking-oriented conversion paths.', width: 1200, height: 675 },
        { src: '/images/showcase/knight-group-showcase.webp', alt: 'Knight Group showcase', caption: 'Showcase card used across Knight Logics proof grids.', width: 1200, height: 675 }
      ],
      audits: [
        { src: '/images/showcase/knight-group-og-card.jpg', alt: 'OG card', title: '97-page architecture', text: 'Service and area depth built for handyman search demand.' },
        { src: images.caseStudyCrm.src, alt: 'CRM', title: 'kg OutreachEngine lane', text: 'Real booked work from targeted outreach campaigns.' },
        { src: images.screenTeam.src, alt: 'Network', title: 'Same growth stack', text: 'Pairs with Screen Team and Faith Works in the network.' },
        { src: images.caseStudyReferral.src, alt: 'Referrals', title: 'Referral-ready', text: 'Built to plug into partner attribution when the network expands.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Plan a handyman growth system',
      ctaSecondaryHref: '/home-service-business-growth-systems',
      ctaSecondaryLabel: 'Home service systems'
    },
    faq: [
      { q: 'What makes Knight Group different from a template site?', a: 'Hand-coded IA with deep service/area coverage, booking-oriented CTAs, and a live kg OutreachEngine lane that produced real booked work — not a theme demo.' },
      { q: 'Can you build this for another handyman brand?', a: 'Yes. We adapt the architecture to your services, cities, and booking flow, then optionally wire CRM outreach and Email-Agent.' },
      { q: 'Is outreach included by default?', a: 'The site is CRM-ready. Outreach campaigns are scoped separately with brand templates and daily caps.' },
      { q: 'How does this connect to Knight Logics systems?', a: 'Knight Group is a live client proof for home-service growth systems, CRM outreach, and the broader Tampa Bay trade network.' }
    ]
  },
  'case-study-sals-painting.html': {
    ogImage: 'https://knightlogics.com/images/showcase/sals-painting-og-card.jpg',
    walkthrough: {
      title: 'Site walkthrough &amp; proof',
      intro: 'Sal’s Painting upgrade walkthrough with hero and brand stills that show the conversion-focused rebuild.',
      primary: { ...videos.salsPainting },
      proofs: [
        { src: '/images/sals-hero.webp', alt: "Sal's Painting website hero", caption: 'Hero built for estimate requests and local painting trust.', width: 1200, height: 630 },
        { src: '/images/showcase/sals-painting-og-card.jpg', alt: "Sal's Painting OG card", caption: 'Brand proof card used across Knight Logics listings.', width: 1200, height: 630 }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Rebuild your trade website',
      ctaSecondaryHref: '/contractor-growth-systems',
      ctaSecondaryLabel: 'Contractor systems'
    },
    faq: [
      { q: 'Was this a full growth system or a site refresh?', a: 'A conversion-focused website upgrade with stronger hero, trust, and estimate paths — scoped to what Sal’s needed without overbuilding unused automation.' },
      { q: 'Can painters get the same treatment?', a: 'Yes. We scope service pages, gallery proof, estimate CTAs, and optional local SEO depth for painting and related trades.' },
      { q: 'Do you include CRM outreach?', a: 'Optional. Many painting clients start with the site and add OutreachEngine once lists and brand templates are ready.' },
      { q: 'How fast can a similar rebuild ship?', a: 'Depends on content and photography readiness. We prioritize a launchable conversion path first, then expand pages.' }
    ]
  },
  'case-study-moms-resin-tables.html': {
    ogImage: 'https://knightlogics.com/images/showcase/moms-resin-og-card.webp',
    walkthrough: {
      title: 'Storefront walkthrough &amp; proof',
      intro: 'Mom’s Resin Tables site walkthrough with storefront stills that show product-led e-commerce UX.',
      primary: { ...videos.momsResin },
      proofs: [
        { src: '/images/momhero.webp', alt: "Mom's Resin Tables e-commerce storefront", caption: 'Product-led hero and storefront experience.', width: 1200, height: 675 },
        { src: '/images/showcase/moms-resin-og-card.webp', alt: "Mom's Resin OG card", caption: 'Brand card for listings and social proof.', width: 1200, height: 630 }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build a product-led storefront',
      ctaSecondaryHref: '/business-growth-systems',
      ctaSecondaryLabel: 'Growth systems'
    },
    faq: [
      { q: 'Is this a Shopify theme or custom build?', a: 'A custom Knight Logics storefront experience tailored to resin table product storytelling — not a generic theme drop-in.' },
      { q: 'Can you do similar for other makers?', a: 'Yes. We build product-led sites with clear purchase paths, gallery proof, and performance-minded front ends.' },
      { q: 'Does it include ongoing ads or SEO?', a: 'The case study focuses on the site build. SEO, ads, and automation can be scoped as follow-on lanes.' },
      { q: 'What should makers prepare before kickoff?', a: 'Product photos, pricing clarity, and shipping/policy copy. Strong assets make the storefront feel premium on day one.' }
    ]
  },
  'case-study-faith-works.html': {
    ogImage: 'https://knightlogics.com/images/showcase/faith-works-og-card.webp',
    walkthrough: {
      title: 'Site proof &amp; local SEO depth',
      intro: 'Faith Works Outdoor Services assets from the client workspace — clearing banner, equipment, and stump before/after. No repeated brand cards, no other trade sites in this walkthrough.',
      primary: {
        type: 'image',
        src: '/images/faith-works/clearing-banner.webp',
        alt: 'Faith Works land clearing banner',
        caption: 'Clearing banner from the Faith Works client workspace — outdoor services brand at work.',
        width: 1920,
        height: 1080
      },
      proofs: [
        { src: '/images/faith-works/equipment.webp', alt: 'Faith Works equipment fleet', caption: 'Equipment gallery still — the fleet homeowners see when they evaluate land-clearing capacity.', width: 1200, height: 800 },
        { src: '/images/faith-works/tractor-grapple.webp', alt: 'Faith Works tractor with grapple', caption: 'Field equipment in use — proof imagery that belongs on service and gallery pages.', width: 1200, height: 800 }
      ],
      audits: [
        { src: '/images/faith-works/stump-before.webp', alt: 'Stump before removal', title: 'Before — stump removal', text: 'Before still from the Faith Works stump-removal gallery.' },
        { src: '/images/faith-works/stump-after.webp', alt: 'Stump after removal', title: 'After — leveled ground', text: 'After still — the transformation homeowners hire for.' },
        { src: '/images/showcase/faith-works-og-card.webp', alt: 'Faith Works site card', title: 'Live site card', text: 'OG card for the 82-page local SEO build — used once here.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build outdoor-services growth systems',
      ctaSecondaryHref: '/excavation-business-growth-systems',
      ctaSecondaryLabel: 'Excavation lane'
    },
    faq: [
      { q: 'Why is Faith Works a flagship proof?', a: 'It demonstrates deep local SEO page architecture for outdoor services — not a thin five-page brochure — with live CRM lane support.' },
      { q: 'Can excavation or land-clearing companies get this?', a: 'Yes. We scope service pages, city coverage, trust content, and optional outreach for outdoor and heavy-equipment trades.' },
      { q: 'Is there a walkthrough video?', a: 'This page leads with still proof and architecture. Video assets are added when a dedicated capture is available; the live site remains the primary demo.' },
      { q: 'How does it connect to Screen Team and Knight Group?', a: 'All three run on the same Knight Logics growth stack patterns — sites, CRM lanes, and Email-Agent mapping.' }
    ]
  },
  'case-study-jns.html': {
    ogImage: 'https://knightlogics.com/images/showcase/jns-og-card.jpg',
    walkthrough: {
      title: 'Contractor site proof',
      intro: 'JNS Construction homepage and indexing proof — contractor web presence built for credibility and discovery.',
      primary: { ...images.jns },
      proofs: [
        { src: '/images/jns-hero.webp', alt: 'JNS Construction hero', caption: 'Hero and trust layout for contractor credibility.', width: 1200, height: 675 },
        { src: '/images/showcase/jns-og-card.jpg', alt: 'JNS OG card', caption: 'Brand card used across Knight Logics proof grids.', width: 1200, height: 630 }
      ],
      audits: [
        { src: '/images/JNS - Rich Main.png', alt: 'Rich results', title: 'Rich results', text: 'Structured data validated for stronger SERP presentation.' },
        { src: '/images/JNS - Indexed.png', alt: 'Indexed pages', title: 'Indexation proof', text: 'Search Console visibility for contractor pages.' },
        { src: images.caseStudyVendoroo.src, alt: 'Ops systems', title: 'Ops-ready', text: 'Pairs with ticketing and invoice workflow conversations.' },
        { src: images.faithWorks.src, alt: 'Network', title: 'Trade network', text: 'Contractor proof alongside Faith Works and Screen Team.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build a contractor website',
      ctaSecondaryHref: '/contractor-growth-systems',
      ctaSecondaryLabel: 'Contractor systems'
    },
    faq: [
      { q: 'Is JNS a full growth system or a site build?', a: 'A contractor website case study focused on credibility, indexing, and conversion foundations — with room to add CRM and job workflows later.' },
      { q: 'Can general contractors get the same structure?', a: 'Yes. We build service pages, project proof, and local discovery paths tailored to your trades and metros.' },
      { q: 'Do you handle Google Business Profile too?', a: 'Local visibility and GBP alignment are available as a paired lane with the website build.' },
      { q: 'How does this relate to Vendoroo-style ops?', a: 'JNS is web proof; Vendoroo documents ticket-to-invoice field ops. Many contractors eventually want both.' }
    ]
  },
  'case-study-farrell-electric.html': {
    ogImage: 'https://knightlogics.com/images/farrell/hero.png',
    walkthrough: {
      layout: 'feature',
      title: 'Preview launch walkthrough',
      intro: 'One project photo from the Farrell Electric workspace — paired with the brand mark and Preview Launch stats. No duplicate crops, no other trade sites.',
      primary: {
        type: 'image',
        src: '/images/farrell/hero.png',
        alt: 'Farrell Electric website hero',
        caption: 'Farrell Electric Preview Launch — the only full project photo from the client workspace. One hero, used once.',
        width: 1672,
        height: 941
      },
      proofs: [
        { src: '/images/farrell/logo-cropped.png', alt: 'Farrell Electric logo', caption: 'Brand mark from the Farrell Electric workspace — not a second crop of the hero.', width: 756, height: 304 }
      ],
      stats: [
        { value: '3', label: 'Pages built' },
        { value: 'Preview', label: 'Launch tier' },
        { value: 'Schema', label: 'Electrician' },
        { value: 'GitHub', label: 'Pages host' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Start with a Preview Launch',
      ctaSecondaryHref: '/home-service-websites',
      ctaSecondaryLabel: 'Home service websites'
    },
    faq: [
      { q: 'Is Farrell Electric a paid client case study?', a: 'It is a GitHub Pages demo built for a friend who did not pursue a paid project. It still demonstrates Preview Launch structure and contact conversion.' },
      { q: 'What is Preview Launch?', a: 'A compact multi-page site with essential SEO meta and contact paths — useful when you need a credible web presence before investing in a full growth system.' },
      { q: 'Can this become a full growth system later?', a: 'Yes. Preview Launch sites are designed to expand into deeper service pages, local SEO, and automation lanes when you are ready.' },
      { q: 'Why show it if it is not a paid engagement?', a: 'Honest portfolio proof. It shows craft and conversion basics without overstating scope or inventing metrics.' }
    ]
  },
  'case-study-knight-logics.html': {
    ogImage: 'https://knightlogics.com/images/showcase/case-study-knightlogics-platform-mockup.webp',
    walkthrough: {
      title: 'Platform walkthrough &amp; proof',
      intro: 'Knight Logics is the marketing and ops platform behind the growth system — mockups and live-site proof of the hand-coded hub.',
      primary: { ...images.caseStudyKnightLogics },
      proofs: [
        { src: '/images/websitehero.webp', alt: 'Knight Logics website hero', caption: 'Live knightlogics.com hero and service hub.', width: 1200, height: 675 },
        { src: images.caseStudyKnightCommand.src, alt: 'Knight Command', caption: 'Internal ops shell that powers daily growth operations.', width: 1200, height: 675 }
      ],
      audits: [
        { src: images.caseStudyCrm.src, alt: 'CRM', title: 'CRM outreach', text: 'Production OutreachEngine for multi-brand campaigns.' },
        { src: images.caseStudyReferral.src, alt: 'Referrals', title: 'Referral network', text: 'Partner attribution and payout visibility.' },
        { src: images.caseStudySocial.src, alt: 'Social', title: 'Social Poster', text: 'Multi-brand posting runners with failure visibility.' },
        { src: images.caseStudyVendoroo.src, alt: 'Field ops', title: 'Field workflows', text: 'Ticket-to-invoice patterns for vendor ops.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build your growth platform',
      ctaSecondaryHref: '/business-growth-systems',
      ctaSecondaryLabel: 'Growth systems'
    },
    faq: [
      { q: 'Why is Knight Logics a case study on its own site?', a: 'The site is a living demonstration — hand-coded HTML/CSS/JS, schema, indexing, and the same performance discipline we apply to client builds.' },
      { q: 'Is this a CMS?', a: 'No. It is a custom multi-page portfolio and service hub. Internal ops tools (Knight Command, CRM, Social Poster) sit alongside it as production systems.' },
      { q: 'Can you build a similar hub for my company?', a: 'Yes. We scope marketing sites, owner dashboards, and automation embeds so your brand and ops share one coherent system.' },
      { q: 'Where do client proofs live?', a: 'On dedicated case study pages — Roof Monsters, Screen Team, Knight Group, Faith Works, and the system case studies for CRM, referrals, and social.' }
    ]
  },
  'case-study-evidencedesk-ai.html': {
    ogImage: 'https://evidencedeskai.com/opengraph-image',
    walkthrough: {
      layout: 'feature',
      title: 'Product site walkthrough',
      intro: 'Live product preview stays in the hero panel above. This section shows the EvidenceDesk brand mark plus conversion-architecture craft — no second copy of the same OG image.',
      primary: {
        type: 'image',
        src: '/images/evidencedesk/logo.png',
        alt: 'EvidenceDesk AI logo',
        caption: 'EvidenceDesk AI brand mark from the client workspace.',
        width: 1200,
        height: 630
      },
      proofs: [
        { src: images.caseStudyKnightLogics.src, alt: 'Knight Logics platform craft', caption: 'Same conversion and trust discipline applied to legal-tech product UX.', width: 1200, height: 675 }
      ],
      stats: [
        { value: 'Legal-tech', label: 'Product site' },
        { value: 'Intake', label: 'Attorney paths' },
        { value: 'Trust', label: 'Security pages' },
        { value: 'Live', label: 'evidencedeskai.com' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Structure your product site',
      ctaSecondaryHref: '/case-studies',
      ctaSecondaryLabel: 'All case studies'
    },
    faq: [
      { q: 'What problem did EvidenceDesk need solved?', a: 'Legal-tech buyers need trust, clarity, and intake routing — not a generic startup landing page. We structured attorney paths, security content, and conversion architecture.' },
      { q: 'Is this a full SaaS build or a marketing site?', a: 'A conversion-ready product website and information architecture engagement — the public face of the product, not the entire backend platform.' },
      { q: 'Can you do similar for other B2B products?', a: 'Yes. We specialize in trust-heavy funnels, role-based pages, and intake flows for complex B2B and professional services products.' },
      { q: 'Where can I see the live site?', a: 'Visit evidencedeskai.com for the live product site, then book a consult if you want a similar structure for your product.' }
    ]
  }
};

function bumpStyleVer(html) {
  return html
    .replace(/style\.css\?v=[^"'\s]+/g, `style.css?v=${VER}`)
    .replace(/script\.js\?v=[^"'\s]+/g, `script.js?v=${VER}`)
    .replace(/header\.html\?v=[^"'\s]+/g, `header.html?v=${VER}`)
    .replace(/footer\.html\?v=[^"'\s]+/g, `footer.html?v=${VER}`);
}

function setOgImage(html, ogImage) {
  if (!ogImage) return html;
  let out = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${ogImage}">`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${ogImage}">`
  );
  return out;
}

function findScoresEnd(html) {
  const start = html.indexOf('<div class="cs-scores">');
  if (start === -1) return -1;
  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      i += 4;
      continue;
    }
    if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) return i;
      continue;
    }
    i += 1;
  }
  return -1;
}

function replaceWalkthrough(html, block) {
  const re = /<section class="kl-growth-section">\s*<div class="container">\s*<div class="section-header fade-in">[\s\S]*?(?:cs-media-grid|cs-feature-media)[\s\S]*?<\/section>/;
  if (re.test(html)) {
    return html.replace(re, block.trim());
  }
  return insertAfterScoresOrHero(html, block);
}

function insertAfterScoresOrHero(html, block) {
  const scoresEnd = findScoresEnd(html);
  if (scoresEnd !== -1) {
    return `${html.slice(0, scoresEnd)}\n\n${block}\n\n${html.slice(scoresEnd)}`;
  }
  const heroRe = /(<section class="(?:cs-hero|ed-hero)"[\s\S]*?<\/section>)/;
  const hm = html.match(heroRe);
  if (hm) {
    return html.replace(hm[0], `${hm[0]}\n\n${block}`);
  }
  return html;
}

function insertFaqBeforeCta(html, faqHtml) {
  if (/Common questions/.test(html) && /kl-growth-faq/.test(html)) return html;
  const markers = [
    '<section class="cs-cta">',
    '<section class="cs-cta-section">',
    '<section class="svc-cta-band">'
  ];
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      return `${html.slice(0, idx)}\n${faqHtml}\n${html.slice(idx)}`;
    }
  }
  // Before footer
  const f = html.indexOf('<div id="footer-container"');
  if (f !== -1) {
    return `${html.slice(0, f)}\n${faqHtml}\n${html.slice(f)}`;
  }
  return html;
}

function deepenFarrell(html) {
  if (/Preview Launch is honest about scope/.test(html)) return html;
  const extra = `
                <p>Preview Launch is honest about scope: a compact multi-page electrician site with essential contact conversion and basic SEO meta — hosted on GitHub Pages without a custom domain. It still demonstrates the craft bar for early-stage trade sites.</p>
                <p>When a client is ready to invest further, the same foundation expands into deeper service pages, local SEO, review systems, and optional CRM outreach. Farrell remains in the portfolio as a clear example of that first credible step.</p>`;
  // Insert after first overview paragraph block if possible
  return html.replace(
    /(A GitHub Pages demo built for a friend[^<]*<\/p>)/,
    `$1${extra}`
  );
}

function deepenKnightLogics(html) {
  if (/living demonstration of the growth stack/.test(html)) return html;
  const extra = `
                <p>Knight Logics is a living demonstration of the growth stack: marketing pages, schema, indexing discipline, and the internal systems (Knight Command, CRM, referrals, Social Poster) that run the business behind the site.</p>
                <p>Prospects who want “something like this for themselves” are not buying a theme — they are buying a coherent platform where the website, ops shell, and automation lanes share one operator workflow.</p>`;
  return html.replace(
    /(This site is itself a demonstration of what I build\.[^<]*<\/p>)/,
    `$1${extra}`
  );
}

let updated = 0;
for (const [file, cfg] of Object.entries(PAGES)) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    console.warn('Missing', file);
    continue;
  }
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = bumpStyleVer(html);
  html = setOgImage(html, cfg.ogImage);
  html = replaceWalkthrough(html, renderWalkthrough(cfg.walkthrough));
  html = insertFaqBeforeCta(html, renderFaq(cfg.faq));
  if (file === 'case-study-farrell-electric.html') html = deepenFarrell(html);
  if (file === 'case-study-knight-logics.html') html = deepenKnightLogics(html);
  if (html !== before) {
    fs.writeFileSync(full, html);
    updated += 1;
    console.log('Updated', file);
  } else {
    console.log('Unchanged', file);
  }
}
console.log(`Done. Updated ${updated}/${Object.keys(PAGES).length} hand-crafted case studies.`);
