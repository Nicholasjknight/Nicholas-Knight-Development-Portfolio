/**
 * Assign distinct gallery images across industry page slots
 * (problem split, media blocks, proof) so the same asset is not repeated.
 */
const { images } = require('./growth-content-media');
const { tradeNetworkForSlug } = require('./growth-trade-network');

const TRADE_NETWORK_IMAGE = '/images/showcase/case-study-referral-network-mockup.webp';

function img(src, alt, width, height) {
  const item = { type: 'image', src, alt };
  if (width) item.width = width;
  if (height) item.height = height;
  return item;
}

/** Per-slug ordered gallery — first entry should match heroImage when possible */
const PAGE_GALLERIES = {
  'handyman-business-growth-systems': [
    images.kgHero,
    img('/images/knight-group-hero.webp', 'Knight Group website hero section'),
    img('/images/KnightGroup-HomeImage.webp', 'Knight Group homepage layout'),
    img('/images/knight-group-website.webp', 'Knight Group handyman site overview'),
    img('/images/knightgroup-gbp.png', 'Knight Group Google Business Profile'),
    img('/images/KnightGroup - Rich Local.png', 'Knight Group local search rich results'),
    img('/images/added-media/knight-group-site.webp', 'Knight Group site showcase'),
  ],
  'roofing-business-growth-systems': [
    images.caseStudyRoofing,
    images.roofMonstersHome,
    images.roofMonstersProject,
    images.roofMonstersLighthouse,
    images.roofMonstersSemrush,
    images.roofMonstersGsc,
    images.roofMonstersShowcase,
    img('/images/showcase/Roof-monsters-fb-banner-image.png', 'Roof Monsters Facebook banner and brand mark'),
    img('/images/showcase/RM-MonsterHouseLogo.png', 'Roof Monsters logo mark'),
  ],
  'screen-enclosure-business-growth-systems': [
    images.screenTeam,
    img('/images/screen-team-hero.webp', 'Screen Team pool enclosure website hero'),
    img('/images/screen-team-showcase-400.webp', 'Screen Team website showcase'),
    img('/images/added-media/screen-team-site.webp', 'Screen Team site overview'),
    img('/images/added-media/Screen Team Page.png', 'Screen Team website page layout'),
  ],
  'excavation-business-growth-systems': [
    images.faithWorks,
    img('/images/city hero.webp', 'Local service area landing page example'),
    img('/images/added-media/indexing.png', 'Search Console indexing for local SEO'),
    img('/images/added-media/embedded Google map and reviews carousel.png', 'Google map and reviews on service site'),
  ],
  'electrician-business-growth-systems': [
    img('/images/farrell-hero.webp', 'Farrell Electric website hero'),
    images.farrellElectric,
    images.caseStudyCrm,
    img('/images/added-media/Free Audit & Call.png', 'Electrician estimate and contact conversion paths'),
    img('/images/added-media/gbp-reviews.webp', 'Google Business reviews integration'),
  ],
  'painter-business-growth-systems': [
    img('/images/sals-hero.webp', "Sal's Painting website hero"),
    images.salsPainting,
    img('/images/added-media/lighthouse-perfect.webp', 'Search-ready painter site performance scores'),
    img('/images/added-media/indexing.png', 'Search Console baseline after painter launch'),
    images.caseStudyReferral,
  ],
  'contractor-growth-systems': [
    images.jns,
    img('/images/jns-hero.webp', 'JNS Construction website hero'),
    images.kgHero,
    images.screenTeam,
    images.faithWorks,
    img('/images/added-media/JNS Construction Page.png', 'JNS Construction website layout'),
  ],
  'home-service-business-growth-systems': [
    images.screenTeam,
    images.kgHero,
    images.faithWorks,
    img('/images/added-media/embedded Google map and reviews carousel.png', 'Map and reviews on home service site'),
    images.caseStudyCrm,
  ],
  'starting-a-new-business': [
    images.kgHero,
    images.googleBusinessProfile,
    images.knightCommandShell,
    images.caseStudySocial,
    images.faithWorks,
    images.screenTeam,
    images.roofMonstersShowcase,
    img('/images/added-media/Screen Teams Business Cards.png', 'Business card brand materials for a local service company'),
    img('/images/added-media/Screen Team Yard Signs.png', 'Yard signs and field brand materials for a local trade business'),
  ],
};

const FALLBACK_IMAGES = [
  img('/images/showcase/case-study-crm-outreach-mockup.webp', 'CRM outreach queue dashboard', 1200, 675),
  img('/images/showcase/case-study-knight-command-mockup.webp', 'Knight Command admin shell', 1200, 675),
  img('/images/showcase/case-study-social-poster-mockup.webp', 'Social posting queue dashboard', 1200, 675),
  img('/images/showcase/case-study-vendoroo-ticket-mockup.webp', 'Vendor ticket and invoice workflow', 1200, 675),
  img('/images/showcase/case-study-knightlogics-platform-mockup.webp', 'Knight Logics marketing platform', 1200, 675),
  img('/images/added-media/gbp-reviews.webp', 'Google Business reviews carousel'),
  img('/images/added-media/indexing.png', 'Search Console indexing report'),
  img('/images/added-media/Free Audit & Call.png', 'Free audit and call conversion paths'),
  img('/images/added-media/lighthouse-perfect.webp', 'Lighthouse performance scores'),
  img('/images/city hero.webp', 'City service-area landing page'),
];

function normalizeSrc(src) {
  return String(src || '').split('?')[0].toLowerCase();
}

function cloneMedia(m) {
  if (!m) return m;
  return { ...m };
}

function galleryForSlug(slug) {
  return PAGE_GALLERIES[slug] || null;
}

function pickFromGallery(gallery, used) {
  for (const item of gallery) {
    const key = normalizeSrc(item.src);
    if (!key || used.has(key)) continue;
    used.add(key);
    return cloneMedia(item);
  }
  return null;
}

function pickFallback(used) {
  for (const item of FALLBACK_IMAGES) {
    const key = normalizeSrc(item.src);
    if (!key || used.has(key)) continue;
    used.add(key);
    return cloneMedia(item);
  }
  return null;
}

function pickReplacement(gallery, used) {
  return pickFromGallery(gallery, used) || pickFallback(used);
}

/**
 * Mutates page in place: replaces duplicate image slots with the next unused gallery item.
 */
function diversifyPageMedia(page) {
  const gallery = galleryForSlug(page.slug);
  if (!gallery || gallery.length < 2) return page;

  const used = new Set();
  const heroSrc = page.heroImage?.src;
  if (heroSrc) used.add(normalizeSrc(heroSrc));
  if (tradeNetworkForSlug(page.slug)) {
    const net = tradeNetworkForSlug(page.slug);
    const netSrc = net?.networkImage?.src || TRADE_NETWORK_IMAGE;
    used.add(normalizeSrc(netSrc));
  }

  if (page.problem?.media?.type === 'image') {
    const key = normalizeSrc(page.problem.media.src);
    if (used.has(key)) {
      const next = pickReplacement(gallery, used);
      if (next) page.problem.media = next;
    } else {
      used.add(key);
    }
  }

  if (Array.isArray(page.mediaBlocks)) {
    for (const block of page.mediaBlocks) {
      if (block.media?.type !== 'image') continue;
      const key = normalizeSrc(block.media.src);
      if (used.has(key)) {
        const next = pickReplacement(gallery, used);
        if (next) block.media = next;
      } else {
        used.add(key);
      }
    }
  }

  if (page.proof?.image) {
    const key = normalizeSrc(page.proof.image);
    if (used.has(key)) {
      const next = pickReplacement(gallery, used);
      if (next) {
        page.proof.image = next.src;
        if (next.alt) page.proof.imageAlt = next.alt;
      }
    } else {
      used.add(key);
    }
  }

  // proofGrid is curated per-client — do not swap images across brands.

  return page;
}

module.exports = {
  PAGE_GALLERIES,
  diversifyPageMedia,
  galleryForSlug,
};
