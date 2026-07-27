/** Verified client facts — sitemap counts checked 2026-06-26 */
const KG = {
  key: 'kg',
  name: 'Knight Group',
  pageCount: 97,
  sitemapCount: 97,
  sitemapUrl: 'https://www.knightgroup.com/sitemap.xml',
  liveUrl: 'https://www.knightgroup.com/',
  trade: 'handyman',
  lighthouse: { performance: 96, accessibility: 100, seo: 100 },
  breakdown: {
    servicePages: 36,
    cityPages: 30,
    galleryPages: 8,
    policyPages: 4,
    corePages: 9,
    taskLandingPages: 10
  },
  summary:
    '97 indexable URLs — 36 handyman service silos, 30+ Pinellas/Pasco/Hillsborough city pages, 8 project galleries, booking/pricing surfaces, and task-specific repair landing pages.',
  shortProof:
    '97-page handyman local SEO with Lighthouse 96/100/100, booking flow, and live kg OutreachEngine lane.',
  outreachNote:
    'Knight Group runs as the kg brand lane in OutreachEngine — separate templates, caps, and sender identity from Knight Logics, Screen Team, and Faith Works.',
  geography: 'Safety Harbor hub with coverage across Pinellas, Hillsborough, and Pasco counties.',
  schema: 'LocalBusiness, FAQ, BreadcrumbList, Organization, and Review snippets validated in Rich Results.',
  bookingPath: '/booking — estimate-first conversion surface aligned to Google sitelinks and GBP actions.',
  media: { type: 'image', src: '/images/KGHero.webp', alt: 'Knight Group handyman website hero' }
};

const FW = {
  key: 'fw',
  name: 'Faith Works',
  pageCount: 82,
  sitemapCount: 81,
  sitemapUrl: 'https://faithworksclearing.com/sitemap.xml',
  liveUrl: 'https://faithworksclearing.com/',
  trade: 'land clearing / excavation',
  summary:
    '82-page land clearing and forestry mulching architecture — dedicated service pages plus city and area coverage across Polk County and Central Florida.',
  shortProof:
    '82-page outdoor-services local SEO with schema, GA4/GSC, GBP alignment, and faithworks OutreachEngine lane in the growth stack.',
  outreachNote:
    'Faith Works runs as the faithworks brand lane in OutreachEngine — same CRM engine as kg and st with separate templates, caps, and sender identity.',
  geography: 'Auburndale hub serving Polk County and Central Florida land clearing markets.',
  schema: 'Service, LocalBusiness, FAQ, and BreadcrumbList schema across the page network.',
  growthSystem:
    'Full growth system client — deep local SEO site, faithworks OutreachEngine lane, Email-Agent routing, and local visibility ops aligned to the Knight Logics stack.',
  media: {
    type: 'image',
    src: '/images/showcase/faith-works-og-card.webp',
    alt: 'Faith Works land clearing website'
  }
};

const ST = {
  key: 'st',
  name: 'Screen Team',
  pageCount: 81,
  sitemapCount: 81,
  sitemapUrl: 'https://screenteamllc.com/sitemap.xml',
  liveUrl: 'https://screenteamllc.com/',
  trade: 'screen repair / pool enclosures',
  summary:
    '81-page Tampa Bay screen repair and pool enclosure site — service silos, metro city pages, gallery proof, and quote-first conversion paths.',
  shortProof:
    '81-page enclosure trade local SEO with st OutreachEngine lane, Email-Agent ST mapping, and growth-system CRM alignment.',
  outreachNote:
    'Screen Team runs as the st brand lane in OutreachEngine — separate from kg and faithworks with dedicated send caps and templates.',
  geography: 'Tampa Bay metros — Safety Harbor, Clearwater, Largo, Palm Harbor, St. Petersburg, and surrounding coverage.',
  schema: 'LocalBusiness, FAQ, BreadcrumbList, and Organization schema validated in Rich Results.',
  growthSystem:
    'Full growth system client — local SEO depth, st OutreachEngine lane, Email-Agent mapping, social and directory groundwork in the Knight Logics stack.',
  media: {
    type: 'image',
    src: '/images/screen-team-showcase-800.webp',
    alt: 'Screen Team pool enclosure website'
  }
};

const RM = {
  key: 'rm',
  name: 'Roof Monsters',
  pageCount: 79,
  sitemapCount: 79,
  sitemapUrl: 'https://roofmonsters.co/sitemap.xml',
  liveUrl: 'https://roofmonsters.co/',
  trade: 'roofing',
  lighthouse: { performance: 97, accessibility: 100, seo: 100 },
  summary:
    '79+ indexable URLs on roofmonsters.co — estimate-first lead capture, service and area depth, gallery proof, and storm-season local SEO for Tampa Bay roofing.',
  shortProof:
    'Live roofing growth system with Lighthouse 97/100/100/100, Semrush 99% site health, Ahrefs 100, and GSC sitemap success with 79 discovered pages.',
  outreachNote:
    'Roof Monsters Email-Agent routing is live for info@roofmonsters.co; cold outreach stays off unless explicitly enabled for the brand.',
  geography: 'Tampa Bay roofing coverage with service and city pages built for storm-season search.',
  schema: 'LocalBusiness, FAQ, BreadcrumbList, and Organization schema on the public site.',
  growthSystem:
    'Official roofing network anchor — live site, case study, and roofing-business-growth-systems playbook.',
  media: {
    type: 'image',
    src: '/images/showcase/roof-monsters-og-card.webp',
    alt: 'Roof Monsters live roofing website on roofmonsters.co'
  }
};

const CLIENTS = { kg: KG, fw: FW, st: ST, rm: RM };

const KG_STATS = [
  { value: '97', label: 'Indexable pages — Knight Group' },
  { value: '96', label: 'Lighthouse performance — KG' },
  { value: '36', label: 'Handyman service silos — KG' }
];

const FW_STATS = [
  { value: '82', label: 'Indexable pages — Faith Works' },
  { value: '81', label: 'URLs in live sitemap.xml' },
  { value: 'fw', label: 'OutreachEngine faithworks lane' }
];

const ST_STATS = [
  { value: '81', label: 'Indexable pages — Screen Team' },
  { value: '6', label: 'Core service silos — ST' },
  { value: 'st', label: 'OutreachEngine st brand lane' }
];

const RM_STATS = [
  { value: '97', label: 'Lighthouse performance — RM' },
  { value: '79', label: 'GSC discovered pages — RM' },
  { value: '99%', label: 'Semrush site health — RM' }
];

const TRIO_PROOF =
  'Three live Tampa Bay growth-system clients prove the stack at different scales: Knight Group (97 handyman pages, kg lane), Faith Works (82 land-clearing pages, faithworks lane), and Screen Team (81 enclosure pages, st lane).';

const TRIO_STATS = [
  { value: '82', label: 'Pages — Faith Works growth system' },
  { value: '81', label: 'Pages — Screen Team growth system' },
  { value: '97', label: 'Pages — Knight Group growth system' }
];

function clientMediaBlock(clientKey, align = 'right') {
  const c = CLIENTS[clientKey] || KG;
  const titleSuffix =
    clientKey === 'kg'
      ? `${c.pageCount}-page handyman growth site`
      : clientKey === 'fw'
        ? `${c.pageCount}-page land clearing growth site`
        : clientKey === 'rm'
          ? `${c.pageCount}+-page roofing growth site`
          : `${c.pageCount}-page enclosure growth site`;
  return {
    kicker: 'Live client architecture',
    title: `${c.name} — ${titleSuffix}`,
    text: `${c.summary} ${c.growthSystem || c.outreachNote}`,
    bullets: [c.geography, c.schema, c.outreachNote, c.bookingPath || 'Quote and call CTAs aligned to service-intent searches.'].filter(Boolean),
    align,
    media: c.media
  };
}

function kgMediaBlock(align = 'right') {
  return clientMediaBlock('kg', align);
}

function fwMediaBlock(align = 'right') {
  return clientMediaBlock('fw', align);
}

function stMediaBlock(align = 'right') {
  return clientMediaBlock('st', align);
}

/** Primary live-client proof for a slug — balances/src pages should not default to KG everywhere */
const SLUG_PRIMARY_CLIENT = {
  'handyman-business-growth-systems': 'kg',
  'contractor-growth-systems': 'st',
  'home-service-business-growth-systems': 'st',
  'screen-enclosure-business-growth-systems': 'st',
  'excavation-business-growth-systems': 'fw',
  'local-visibility-systems': 'fw',
  'service-area-page-strategy': 'fw',
  'website-growth-audit': 'fw',
  'crm-outreach-lead-generation': 'st',
  'email-agent-automation': 'st',
  'review-request-systems': 'st',
  'social-media-automation-systems': 'kg',
  'business-growth-systems': 'fw',
  'performance-partner-program': 'fw',
  'online-ordering-systems': 'fw',
  'roofing-business-growth-systems': 'rm',
  'case-study-crm-outreach-system': 'st',
  'case-study-social-poster': 'kg'
};

function primaryClientForSlug(slug) {
  return SLUG_PRIMARY_CLIENT[slug] || 'fw';
}

function clientStatsForSlug(slug) {
  const key = primaryClientForSlug(slug);
  if (key === 'kg') return KG_STATS;
  if (key === 'st') return ST_STATS;
  if (key === 'rm') return RM_STATS;
  return FW_STATS;
}

function clientMediaBlockForSlug(slug, align = 'right') {
  return clientMediaBlock(primaryClientForSlug(slug), align);
}

function hasClientMediaBlock(blocks, clientKey) {
  if (!blocks || !blocks.length) return false;
  const c = CLIENTS[clientKey];
  if (!c) return false;
  return blocks.some(
    (b) =>
      (b.title && new RegExp(c.name, 'i').test(b.title)) ||
      (b.media && b.media.src && b.media.src === c.media.src)
  );
}

const CLIENT_MEDIA_SLUGS = [
  'handyman-business-growth-systems',
  'contractor-growth-systems',
  'home-service-business-growth-systems',
  'screen-enclosure-business-growth-systems',
  'excavation-business-growth-systems',
  'local-visibility-systems',
  'service-area-page-strategy'
];

module.exports = {
  KG,
  FW,
  ST,
  RM,
  CLIENTS,
  KG_STATS,
  FW_STATS,
  ST_STATS,
  RM_STATS,
  TRIO_PROOF,
  TRIO_STATS,
  kgMediaBlock,
  fwMediaBlock,
  stMediaBlock,
  clientMediaBlock,
  clientMediaBlockForSlug,
  clientStatsForSlug,
  primaryClientForSlug,
  hasClientMediaBlock,
  CLIENT_MEDIA_SLUGS,
  SLUG_PRIMARY_CLIENT
};
