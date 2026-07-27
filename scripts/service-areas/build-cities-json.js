/**
 * Build cities.json with unique long-form copy for 20 Tampa Bay metros.
 * Run: node scripts/service-areas/build-cities-json.js
 */
const fs = require('fs');
const path = require('path');

const CITIES = [
  { slug: 'tampa', name: 'Tampa', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Tam', neighborhoods: 'South Tampa, Ybor City, Hyde Park, Channelside, Carrollwood, Westchase, and Seminole Heights', rivals: 'Hillsborough contractors and multi-location franchise sites', angle: 'largest metro search volume and densest map-pack competition', siblings: ['brandon', 'temple-terrace', 'clearwater', 'st-petersburg', 'safety-harbor'], imageQuery: 'tampa florida skyline downtown' },
  { slug: 'st-petersburg', name: 'St. Petersburg', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'StP', neighborhoods: 'Downtown St. Pete, Midtown, Snell Isle, Historic Kenwood, and Gulfport', rivals: 'beach-tourism templates and thin Pinellas brochure sites', angle: 'creative downtown energy mixed with peninsula-wide trade demand', siblings: ['clearwater', 'pinellas-park', 'largo', 'tampa', 'seminole'], imageQuery: 'st petersburg florida downtown pier' },
  { slug: 'clearwater', name: 'Clearwater', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Cle', neighborhoods: 'Clearwater Beach, Countryside, Coachman, and downtown Clearwater', rivals: 'seasonal tourism pages that ignore homeowner intent', angle: 'beach visibility noise competing with serious service-intent searches', siblings: ['safety-harbor', 'largo', 'dunedin', 'st-petersburg', 'palm-harbor'], imageQuery: 'clearwater beach florida' },
  { slug: 'safety-harbor', name: 'Safety Harbor', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Saf', neighborhoods: 'downtown Safety Harbor, Philippe Park corridor, and the Oldsmar bridge approach', rivals: 'generic Pinellas templates that never mention Safety Harbor', angle: 'Knight Logics home base with drive-time reach into Clearwater and Tampa', siblings: ['clearwater', 'oldsmar', 'palm-harbor', 'tampa', 'dunedin'], imageQuery: 'safety harbor florida waterfront' },
  { slug: 'palm-harbor', name: 'Palm Harbor', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Pal', neighborhoods: 'Ozona, Crystal Beach, Innisbrook, and east Palm Harbor toward East Lake', rivals: 'Palm Harbor Facebook-only businesses with no service architecture', angle: 'north Pinellas homeowners searching trades with high intent', siblings: ['tarpon-springs', 'dunedin', 'safety-harbor', 'oldsmar', 'new-port-richey'], imageQuery: 'palm harbor florida' },
  { slug: 'dunedin', name: 'Dunedin', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Dun', neighborhoods: 'downtown Dunedin, Edgewater Drive, and the Pinellas Trail corridor', rivals: 'cute Main Street sites with zero technical SEO', angle: 'walkable downtown brand that still needs map-pack and service pages', siblings: ['palm-harbor', 'clearwater', 'safety-harbor', 'tarpon-springs', 'largo'], imageQuery: 'dunedin florida downtown' },
  { slug: 'largo', name: 'Largo', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Lar', neighborhoods: 'central Largo, Baskin, and the Ulmerton corridor toward Pinellas Park', rivals: 'county-wide handyman sites that bury Largo in a footer list', angle: 'central Pinellas logistics hub for contractors and home services', siblings: ['pinellas-park', 'clearwater', 'seminole', 'st-petersburg', 'safety-harbor'], imageQuery: 'largo florida' },
  { slug: 'pinellas-park', name: 'Pinellas Park', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Pin', neighborhoods: 'Park Boulevard corridor, Gateway area, and industrial zones near the airport approach', rivals: 'industrial-park businesses still on free website builders', angle: 'working-class Pinellas market where call-first CTAs convert', siblings: ['largo', 'st-petersburg', 'seminole', 'clearwater', 'tampa'], imageQuery: 'pinellas park florida' },
  { slug: 'seminole', name: 'Seminole', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Sem', neighborhoods: 'Seminole city proper, Oakhurst, and the Park Boulevard west corridor', rivals: 'lookalike Pinellas service sites with identical stock copy', angle: 'mid-county residential demand between Largo and the beaches', siblings: ['largo', 'pinellas-park', 'st-petersburg', 'clearwater', 'safety-harbor'], imageQuery: 'seminole florida pinellas' },
  { slug: 'tarpon-springs', name: 'Tarpon Springs', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Tar', neighborhoods: 'the Sponge Docks, downtown Tarpon, and East Lake Tarpon', rivals: 'tourism sites that ignore contractor and home-service intent', angle: 'north Pinellas identity with Pasco overflow search behavior', siblings: ['palm-harbor', 'new-port-richey', 'holiday', 'dunedin', 'oldsmar'], imageQuery: 'tarpon springs florida sponge docks' },
  { slug: 'oldsmar', name: 'Oldsmar', county: 'Pinellas', countyFull: 'Pinellas County', formId: 'Old', neighborhoods: 'downtown Oldsmar, Race Track Road corridor, and the Safety Harbor bridge approach', rivals: 'split Pinellas/Hillsborough messaging that confuses GBP areas', angle: 'bridge city between Pinellas and Hillsborough drive markets', siblings: ['safety-harbor', 'tampa', 'palm-harbor', 'clearwater', 'lutz'], imageQuery: 'oldsmar florida' },
  { slug: 'brandon', name: 'Brandon', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Bra', neighborhoods: 'West Brandon, Bloomingdale approaches, and the Causeway corridor toward Tampa', rivals: 'Tampa-only sites that treat Brandon as an afterthought', angle: 'east Hillsborough volume market with strong homeowner intent', siblings: ['riverview', 'tampa', 'plant-city', 'temple-terrace', 'lutz'], imageQuery: 'brandon florida' },
  { slug: 'riverview', name: 'Riverview', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Riv', neighborhoods: 'Apollo Beach approaches, Bloomingdale, and south county growth corridors', rivals: 'new-construction markets still using placeholder builder sites', angle: 'fast-growing south Hillsborough residential search demand', siblings: ['brandon', 'tampa', 'plant-city', 'temple-terrace', 'safety-harbor'], imageQuery: 'riverview florida hillsborough' },
  { slug: 'temple-terrace', name: 'Temple Terrace', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Tem', neighborhoods: 'downtown Temple Terrace, Busch Boulevard approaches, and USF-adjacent corridors', rivals: 'Tampa metro templates that never name Temple Terrace', angle: 'compact city identity next to Tampa with university-adjacent traffic', siblings: ['tampa', 'brandon', 'lutz', 'wesley-chapel', 'safety-harbor'], imageQuery: 'temple terrace florida' },
  { slug: 'lutz', name: 'Lutz', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Lut', neighborhoods: 'north Lutz, Van Dyke corridor, and the Land O\' Lakes border', rivals: 'Pasco/Hillsborough border businesses with confused NAP', angle: 'north Hillsborough residential market spilling into Pasco', siblings: ['land-o-lakes', 'wesley-chapel', 'tampa', 'oldsmar', 'temple-terrace'], imageQuery: 'lutz florida' },
  { slug: 'wesley-chapel', name: 'Wesley Chapel', county: 'Pasco', countyFull: 'Pasco County', formId: 'Wes', neighborhoods: 'Wiregrass, State Road 56 corridor, and New Tampa overflow', rivals: 'national franchise pages ranking above local independents', angle: 'Pasco growth corridor with New Tampa search spillover', siblings: ['land-o-lakes', 'lutz', 'tampa', 'new-port-richey', 'temple-terrace'], imageQuery: 'wesley chapel florida' },
  { slug: 'new-port-richey', name: 'New Port Richey', county: 'Pasco', countyFull: 'Pasco County', formId: 'Npr', neighborhoods: 'downtown New Port Richey, Port Richey approaches, and US-19 corridor', rivals: 'outdated Pasco directory sites and slow WordPress installs', angle: 'west Pasco coastal corridor needing call-first mobile sites', siblings: ['holiday', 'tarpon-springs', 'palm-harbor', 'wesley-chapel', 'land-o-lakes'], imageQuery: 'new port richey florida' },
  { slug: 'holiday', name: 'Holiday', county: 'Pasco', countyFull: 'Pasco County', formId: 'Hol', neighborhoods: 'Holiday proper, Elfers approaches, and the US-19 / Moog corridor', rivals: 'Pasco businesses listed only on Angi with no owned site', angle: 'west Pasco residential demand between Tarpon and New Port Richey', siblings: ['new-port-richey', 'tarpon-springs', 'palm-harbor', 'wesley-chapel', 'dunedin'], imageQuery: 'holiday florida pasco' },
  { slug: 'land-o-lakes', name: "Land O' Lakes", county: 'Pasco', countyFull: 'Pasco County', formId: 'Lol', neighborhoods: 'central Land O\' Lakes, Lutz border, and SR-54 corridor', rivals: 'New Tampa brands that ignore Pasco city modifiers', angle: 'central Pasco residential growth with Hillsborough overlap searches', siblings: ['wesley-chapel', 'lutz', 'tampa', 'new-port-richey', 'oldsmar'], imageQuery: "land o lakes florida" },
  { slug: 'plant-city', name: 'Plant City', county: 'Hillsborough', countyFull: 'Hillsborough County', formId: 'Pla', neighborhoods: 'downtown Plant City, strawberry-country corridors, and I-4 approaches toward Brandon', rivals: 'agriculture-town sites stuck on decade-old builders', angle: 'east Hillsborough identity with I-4 corridor discoverability needs', siblings: ['brandon', 'riverview', 'tampa', 'temple-terrace', 'safety-harbor'], imageQuery: 'plant city florida downtown' },
];

function wordsApprox(str) {
  return String(str).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function buildCity(c) {
  const city = c.name;
  const county = c.countyFull;
  const whyParagraphs = [
    `${city} sits inside ${county}, where local search is no longer a polite brochure contest. Homeowners and commercial buyers compare multiple tabs before they call — and the sites that win usually combine clear service architecture, fast mobile performance, and a Google Business Profile that matches the website. If your current ${city} presence is a template homepage with a contact form buried below the fold, you are competing with one hand tied behind your back.`,
    `The competitive angle in ${city} is ${c.angle}. That means generic “Florida web design” language does not hold. Pages need ${city}-specific framing, honest service-area statements, and proof that you actually work this corridor. Knight Logics builds hand-coded sites for ${city} operators who want that clarity without WordPress bloat or monthly page-builder lock-in.`,
    `Neighborhood and corridor intent matters here: ${c.neighborhoods}. When someone searches a trade plus ${city}, they are not looking for a statewide franchise story. They want to know whether you serve their street, how fast you respond, and whether the site feels trustworthy on a phone. That is what local SEO and conversion structure are for — not keyword stuffing.`,
    `Many ${city} businesses lose to ${c.rivals}. The fix is rarely “more blog posts.” It is usually cleaner HTML, dedicated service pages, schema that validates, Search Console indexing, and GBP categories/service areas that agree with the site. Those fundamentals compound. Decorative redesigns without them do not.`,
    `A ${city} website should also make the next step obvious. Estimate forms, click-to-call, booking paths, and service selectors belong above the fold on mobile — not buried under stock hero text. Knight Logics designs conversion paths for how ${county} buyers actually behave when they are ready to hire.`,
  ];

  const marketParagraphs = [
    `In-person delivery is available across ${city} and the wider Tampa Bay metro when a kickoff, photo shoot, or on-site review helps. At the same time, every Knight Logics package is available fully remote across the United States — discovery, design, development, launch, and automation systems do not require you to be next door. ${city} clients often use a hybrid: local when useful, remote for speed.`,
    `A strong ${city} website usually includes a conversion-first homepage, dedicated service pages, FAQ structure, clear NAP consistency, and internal links into proof (reviews, galleries, case studies). For trades, estimate and call CTAs stay visible. For professional services, credibility and process clarity take the lead. Either way, the technical baseline is the same: hand-coded performance, schema, analytics, and indexing hygiene.`,
    `${county} searchers bounce from slow sites. Core Web Vitals, compressed media, and lean JavaScript are not vanity metrics in ${city} — they are conversion infrastructure. Knight Logics targets high Lighthouse scores because a fast page keeps the lead in your pipeline instead of the next result.`,
    `When you are ready to grow beyond the website, the same foundation supports CRM outreach, review requests, ticketing, and social systems without starting over. ${city} operators who treat the site as the front door and the systems as the engine get compounding returns. That is the Growth Systems path — optional, but designed to attach cleanly.`,
    `Internal linking is part of the ${city} strategy. Your hub pages, service silos, and neighboring city pages should reinforce each other instead of competing as orphans. Knight Logics also connects ${city} landing pages back to pricing, audits, and case studies so visitors can move from education to a clear next step without bouncing to a competitor.`,
    `Content depth matters for indexing, but utility matters more. Every section on a ${city} page should answer a real buyer question: what you do, where you work, how to contact you, what proof exists, and what happens after the first call. Doorway pages that only swap city names fail that test. Unique local framing for ${city} and ${county} passes it.`,
    `Search Console data for ${city}-style queries often shows impressions without clicks when titles are vague or pages look interchangeable. We write ${city}-specific titles, meta descriptions, and H1 framing so the SERP snippet matches the promise on the page — then we measure CTR and iterate instead of guessing.`,
  ];

  const needs = [
    { title: `${city}-specific service architecture`, text: `Separate pages for the jobs people actually search in ${city} beat a single dump “Services” page every time. Architecture should match how ${county} buyers phrase queries.` },
    { title: 'GBP and website alignment', text: `Categories, service areas, phone, and business name must match. ${city} map-pack competition punishes mismatches between the profile and the site.` },
    { title: 'Mobile-first conversion', text: `Most ${city} service searches happen on phones. Click-to-call, short forms, and above-the-fold clarity are non-negotiable.` },
    { title: 'Proof that feels local', text: `Photos, reviews, and project examples should support ${city} / ${county} credibility — not generic stock that could be anywhere.` },
    { title: 'Indexation and measurement', text: `Search Console, sitemap submission, schema validation, and analytics so you can see what ${city} queries actually convert.` },
    { title: 'Honest geography', text: `Only claim ${city} and neighboring metros you can actually serve. Inflated service-area lists create trust gaps and GBP policy risk.` },
  ];

  const processSteps = [
    { title: 'Audit', text: `Review the current ${city} site or competitive gap — speed, local keyword targeting, GBP alignment, schema, and conversion path — before writing code.` },
    { title: 'Architecture', text: `Map service and location structure around real ${city} and ${county} search intent, including sibling cities you actually serve.` },
    { title: 'Build', text: 'Hand-coded HTML, CSS, and JavaScript. No CMS bloat. Performance, accessibility, and SEO targeted together.' },
    { title: 'Launch & index', text: `GSC setup, sitemap, schema checks, GBP alignment, and tracking verified so the ${city} property can be discovered.` },
    { title: 'Iterate', text: `After launch, review ${city} query performance, strengthen weak pages, and attach growth systems when lead handling becomes the bottleneck.` },
  ];

  const faqs = [
    { q: `Do you build websites specifically for ${city} businesses?`, a: `Yes. Copy, schema, internal links, and GBP alignment are scoped for ${city} and ${county} — not a statewide filler page with the city name swapped.` },
    { q: `Can Knight Logics work on-site in ${city}?`, a: `Yes for Tampa Bay engagements when on-site helps. Full remote delivery is also available nationwide for the same packages.` },
    { q: `What package fits most ${city} service businesses?`, a: `Many start with Local Site depth for ranking foundations, then expand into Authority or Growth Systems when page count and automation justify it. Pricing lists the current ladder.` },
    { q: `How long does a ${city} website build take?`, a: 'Lean launches often take 1–2 weeks after content is ready. Deeper multi-page authority builds take longer based on scope and feedback speed.' },
    { q: `Will a ${city} page help if I also serve neighboring cities?`, a: `Yes — when those cities are real service areas. We link sibling metros and keep GBP service areas honest so you do not claim geography you cannot cover.` },
    { q: `Do you only do websites, or full growth systems too?`, a: `Websites are the foundation. CRM, reviews, ticketing, and automation are available as attached systems when you want the full stack.` },
    { q: `What makes a ${city} page different from a template city page?`, a: `Unique local framing (${c.angle}), real corridors (${c.neighborhoods}), verified media when available, and conversion paths matched to ${county} buyer behavior — not a find-and-replace city name.` },
  ];

  const industriesBlurb = `${city} projects commonly include contractors, home services, specialty trades, professional services, and product brands that sell locally or ship. Around ${c.neighborhoods}, information architecture changes by industry; the technical bar does not.`;

  const ctaBlurb = `If your ${city} site is not earning calls or organic leads, the free audit shows what is actually blocking you — technical debt, thin structure, GBP mismatch, or conversion gaps — before you spend on a rebuild. Bring your current URL and we will map the ${city} opportunity against ${county} competition.`;

  const heroLead = `Searching <strong>web designer ${city}</strong> or <strong>${city} web design</strong>? Knight Logics builds hand-coded sites for ${county} businesses — local SEO structure, Google Business Profile alignment, and live Tampa Bay proof — with on-site support in the metro and full remote delivery nationwide.`;

  const proofBlurb = `Nearby Tampa Bay builds (Screen Team, Knight Group, JNS, Sal’s Painting, and others) show the same hand-coded, search-ready foundation ${city} businesses need. Your page count and package tier change; the quality bar does not. When we have a ${city}-specific project, it is featured here; until then, regional proof still demonstrates the delivery standard.`;

  const contentImageCaption = `${city}, FL — replace with a verified local photograph. Until then, use the on-page media placeholder; project proof below is from live Knight Logics client builds.`;

  const obj = {
    slug: c.slug,
    name: city,
    county: c.county,
    countyFull: county,
    state: 'FL',
    formId: c.formId,
    keywords: `${city} web designer, web design ${city} FL, ${city} website designer, local SEO ${city}, ${county} web design`,
    title: `Web Design ${city} FL | Hand-Coded Sites That Rank`,
    metaDescription: `Web design ${city} FL — hand-coded sites for ${county} service businesses with local SEO, GBP alignment, and Tampa Bay case studies. Free audit.`,
    ogTitle: `${city} Web Design & Local SEO | Knight Logics`,
    ogDescription: `Hand-coded ${city} websites with local SEO, Google Business alignment, on-site Tampa Bay support, and remote U.S. delivery.`,
    h1: `${city} Web Designer for Service Businesses`,
    heroLead,
    breadcrumbLabel: `${city} Web Design`,
    articleHeadline: `Web Design for ${city}, FL — Built for ${county} Visibility`,
    articleDescription: `What ${city} businesses need from a custom website to compete in ${county}: speed, service architecture, local SEO, and a conversion path that works.`,
    whyHeading: `Why ${city} needs a stronger website than a template`,
    whyParagraphs,
    marketHeading: `How ${city} buyers actually find and book`,
    marketParagraphs,
    needsHeading: `What a ${city} site should include`,
    needs,
    processHeading: `The build process for ${city} clients`,
    processSteps,
    industriesHeading: `Industries we support around ${city}`,
    industriesBlurb,
    localAngle: `On-site collaboration is available in ${city} and across Tampa Bay. Full remote website and growth-system delivery is available nationwide.`,
    proofBlurb,
    contentImage: `/images/service-areas/${c.slug}.jpg`,
    contentImageAlt: `${city}, Florida — service area for Knight Logics web design and local SEO`,
    contentImageCaption,
    /** Only true after a verified local photo is placed at contentImage. Default false → generator emits kl-media-needed. */
    imageVerified: false,
    imageQuery: c.imageQuery,
    siblings: c.siblings,
    faqs,
    ctaBlurb,
  };

  const bag = [
    obj.heroLead, ...obj.whyParagraphs, ...obj.marketParagraphs,
    ...obj.needs.map((n) => `${n.title} ${n.text}`),
    ...obj.processSteps.map((s) => `${s.title} ${s.text}`),
    obj.industriesBlurb, obj.localAngle, obj.proofBlurb, obj.ctaBlurb,
    ...obj.faqs.map((f) => `${f.q} ${f.a}`),
  ].join(' ');
  obj.approxWordCount = wordsApprox(bag);
  return obj;
}

const cities = CITIES.map(buildCity);
const outJson = path.join(__dirname, 'cities.json');
fs.writeFileSync(outJson, JSON.stringify(cities, null, 2));
const outJs = path.join(__dirname, 'cities.js');
fs.writeFileSync(outJs, `/** Auto-built by build-cities-json.js — prefer editing that script then rebuild. */\nmodule.exports = ${JSON.stringify(cities, null, 2)};\n`);
console.log(`Wrote ${cities.length} cities to cities.json`);
cities.forEach((c) => console.log(`  ${c.slug}: ~${c.approxWordCount} words`));
