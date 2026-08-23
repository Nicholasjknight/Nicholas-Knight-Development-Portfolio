/**
 * Build cities.json with unique long-form copy for 20 Tampa Bay metros.
 * Run: node scripts/service-areas/build-cities-json.js
 */
const fs = require('fs');
const path = require('path');

/** Verified Wikimedia Commons photos. Keep in sync with replace-city-images.js. */
const IMAGE_META = {
  tampa: { alt: 'Downtown Tampa, Florida skyline', caption: 'Downtown Tampa along the Hillsborough River.' },
  'st-petersburg': { alt: 'Downtown St. Petersburg, Florida', caption: 'Downtown St. Petersburg.' },
  clearwater: { alt: 'Clearwater Beach, Florida looking toward the Gulf', caption: 'Clearwater Beach on the Gulf of Mexico.' },
  'safety-harbor': { alt: 'Safety Harbor, Florida waterfront on Tampa Bay', caption: 'Safety Harbor waterfront on Tampa Bay.' },
  'palm-harbor': { alt: 'Brooker Creek at John Chesnut Sr. Park, Palm Harbor, Florida', caption: 'Brooker Creek at John Chesnut Sr. Park in Palm Harbor.' },
  dunedin: { alt: 'Dunedin City Hall, Dunedin, Florida', caption: 'Dunedin City Hall.' },
  largo: { alt: 'Largo Public Library, Largo, Florida', caption: 'Largo Public Library.' },
  'pinellas-park': { alt: 'CSX Clearwater Subdivision in Pinellas Park, Florida', caption: 'Rail corridor through Pinellas Park.' },
  seminole: { alt: 'Lake Walsingham sunset, Seminole, Florida', caption: 'Lake Walsingham in Seminole.' },
  'tarpon-springs': { alt: 'Sponge Docks in Tarpon Springs, Florida', caption: 'Tarpon Springs Sponge Docks.' },
  oldsmar: { alt: 'Aerial view of Oldsmar, Florida', caption: 'Aerial view of Oldsmar and Old Tampa Bay.' },
  brandon: { alt: 'Westfield Brandon mall, Brandon, Florida', caption: 'Westfield Brandon mall — the commercial center of Brandon.' },
  riverview: { alt: 'Alafia River near Riverview, Hillsborough County, Florida', caption: 'Alafia River near Lithia Springs — the river corridor through Riverview.' },
  'temple-terrace': { alt: 'Temple Terrace entry tower on 56th Street, Florida', caption: 'Temple Terrace entry on 56th Street.' },
  lutz: { alt: 'Historic Lutz train depot, Lutz, Florida', caption: 'Historic Lutz train depot.' },
  'wesley-chapel': { alt: 'Wesley Chapel, Florida commercial corridor', caption: 'Wesley Chapel in Pasco County.' },
  'new-port-richey': { alt: 'Sims Park amphitheatre, New Port Richey, Florida', caption: 'Sims Park amphitheatre in New Port Richey.' },
  holiday: { alt: 'Anclote River Park, Holiday, Florida', caption: 'Sailboats at Anclote River Park in Holiday.' },
  'land-o-lakes': { alt: "US 41 and State Road 54 in Land O' Lakes, Florida, from the air", caption: "US 41 and State Road 54 in Land O' Lakes, from a hot-air balloon." },
  'plant-city': { alt: 'Downtown Plant City, Florida commercial district', caption: 'Downtown Plant City commercial district.' },
};

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

const UNIQUE = require('./city-unique-copy');

const REQUIRED_COPY = [
  'heroLead', 'formTitle', 'formLead', 'whyHeading', 'whyParagraphs',
  'localAngle', 'marketHeading', 'marketParagraphs', 'needsHeading', 'needs',
  'processHeading', 'processSteps', 'industriesHeading', 'industriesBlurb',
  'industries', 'proofBlurb', 'proofPattern', 'proofSpeed', 'proofPerfHeading',
  'proofLabHeading', 'proofMapsHeading', 'proofMaps', 'faqs', 'ctaBlurb',
];

const BANNED_STEMS = [
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
  'sits inside',
];

function wordsApprox(str) {
  return String(str).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function assertCopy(c, u) {
  if (!u) throw new Error(`Missing unique copy for ${c.slug}`);
  for (const key of REQUIRED_COPY) {
    if (u[key] == null || u[key] === '') throw new Error(`${c.slug} missing ${key}`);
  }
  if (u.whyParagraphs.length !== 5) throw new Error(`${c.slug} needs 5 why paragraphs`);
  if (u.marketParagraphs.length !== 5) throw new Error(`${c.slug} needs 5 market paragraphs`);
  if (u.needs.length !== 6) throw new Error(`${c.slug} needs 6 needs`);
  if (u.processSteps.length !== 5) throw new Error(`${c.slug} needs 5 process steps`);
  if (u.industries.length !== 6) throw new Error(`${c.slug} needs 6 industries`);
  if (u.faqs.length !== 7) throw new Error(`${c.slug} needs 7 FAQs`);
  const bag = [
    u.heroLead, u.formTitle, u.formLead, ...u.whyParagraphs, ...u.marketParagraphs,
    u.industriesBlurb, u.localAngle, u.proofBlurb, u.ctaBlurb,
    ...u.faqs.map((f) => `${f.q} ${f.a}`),
  ].join('\n');
  for (const stem of BANNED_STEMS) {
    if (bag.includes(stem)) throw new Error(`${c.slug} still has banned stem: ${stem}`);
  }
}

function buildCity(c) {
  const city = c.name;
  const county = c.countyFull;
  const u = UNIQUE[c.slug];
  assertCopy(c, u);

  const media = IMAGE_META[c.slug] || {};
  const contentImageCaption = media.caption || `${city}, FL — replace with a verified local photograph. Until then, use the on-page media placeholder; project proof below is from live Knight Logics client builds.`;

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
    heroLead: u.heroLead,
    formTitle: u.formTitle,
    formLead: u.formLead,
    breadcrumbLabel: `${city} Web Design`,
    articleHeadline: `Web Design for ${city}, FL — Built for ${county} Visibility`,
    articleDescription: `What ${city} businesses need from a custom website to compete in ${county}: speed, service architecture, local SEO, and a conversion path that works.`,
    whyHeading: u.whyHeading,
    whyParagraphs: u.whyParagraphs,
    marketHeading: u.marketHeading,
    marketParagraphs: u.marketParagraphs,
    needsHeading: u.needsHeading,
    needs: u.needs,
    processHeading: u.processHeading,
    processSteps: u.processSteps,
    industriesHeading: u.industriesHeading,
    industriesBlurb: u.industriesBlurb,
    industries: u.industries,
    localAngle: u.localAngle,
    proofBlurb: u.proofBlurb,
    proofPattern: u.proofPattern,
    proofSpeed: u.proofSpeed,
    proofPerfHeading: u.proofPerfHeading,
    proofLabHeading: u.proofLabHeading,
    proofMapsHeading: u.proofMapsHeading,
    proofMaps: u.proofMaps,
    contentImage: `/images/service-areas/${c.slug}.webp`,
    contentImageAlt: media.alt || `${city}, Florida — service area for Knight Logics web design and local SEO`,
    contentImageCaption,
    /** Only true after a verified local photo is placed at contentImage. Default false → generator emits kl-media-needed. */
    imageVerified: Boolean(media.alt),
    imageQuery: c.imageQuery,
    siblings: c.siblings,
    faqs: u.faqs,
    ctaBlurb: u.ctaBlurb,
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

function assertNoSharedOpeners(list) {
  const fields = [
    ['heroLead', (c) => c.heroLead],
    ['formTitle', (c) => c.formTitle],
    ['why0', (c) => c.whyParagraphs[0]],
    ['market0', (c) => c.marketParagraphs[0]],
    ['cta', (c) => c.ctaBlurb],
    ['industriesBlurb', (c) => c.industriesBlurb],
  ];
  for (const [label, pick] of fields) {
    const seen = new Map();
    for (const city of list) {
      const value = pick(city);
      if (seen.has(value)) {
        throw new Error(`Shared ${label}: ${seen.get(value)} and ${city.slug}`);
      }
      seen.set(value, city.slug);
    }
  }
}

assertNoSharedOpeners(cities);

const outJson = path.join(__dirname, 'cities.json');
fs.writeFileSync(outJson, JSON.stringify(cities, null, 2));
const outJs = path.join(__dirname, 'cities.js');
fs.writeFileSync(outJs, `/** Auto-built by build-cities-json.js — prefer editing that script then rebuild. */\nmodule.exports = ${JSON.stringify(cities, null, 2)};\n`);
console.log(`Wrote ${cities.length} cities to cities.json`);
cities.forEach((c) => console.log(`  ${c.slug}: ~${c.approxWordCount} words`));
