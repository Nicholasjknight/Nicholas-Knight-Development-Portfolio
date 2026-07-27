/**
 * Diversify media across growth page slots so the same video/image
 * is not repeated with different labels on one page.
 * Also replaces HTML mockup fallbacks with real captures or media-needed briefs.
 */
const { images } = require('./growth-content-media');
const { tradeNetworkForSlug } = require('./growth-trade-network');

const TRADE_NETWORK_IMAGE = '/images/added-media/Tracking%20Referral%20Payouts.png';

function img(src, alt, width, height) {
  const item = { type: 'image', src, alt };
  if (width) item.width = width;
  if (height) item.height = height;
  return item;
}

function mediaNeeded(page, brief, specs = 'Screenshot · 1600×900 · redact PII', aspect = '16:9') {
  return {
    type: 'media-needed',
    aspect,
    page,
    brief,
    specs,
    alt: brief,
  };
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
    images.crmSystemUi,
    img('/images/added-media/Free Audit & Call.png', 'Electrician estimate and contact conversion paths'),
    img('/images/added-media/gbp-reviews.webp', 'Google Business reviews integration'),
  ],
  'painter-business-growth-systems': [
    img('/images/sals-hero.webp', "Sal's Painting website hero"),
    images.salsPainting,
    img('/images/added-media/lighthouse-perfect.webp', 'Search-ready painter site performance scores'),
    img('/images/added-media/indexing.png', 'Search Console baseline after painter launch'),
    images.referralPayoutsUi,
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
    images.crmSystemUi,
  ],
  'starting-a-new-business': [
    images.kgHero,
    images.googleBusinessProfile,
    images.knightCommandShell,
    images.emailAgentUi,
    images.faithWorks,
    images.screenTeam,
    images.roofMonstersShowcase,
    img('/images/added-media/Screen Teams Business Cards.png', 'Business card brand materials for a local service company'),
    img('/images/added-media/Screen Team Yard Signs.png', 'Yard signs and field brand materials for a local trade business'),
  ],
};

/** Real captures — never HTML mockups */
const FALLBACK_IMAGES = [
  images.knightCommandShell,
  images.crmSystemUi,
  images.emailAgentUi,
  images.referralPayoutsUi,
  images.referralQrUi,
  images.referralCheckoutUi,
  img('/images/added-media/gbp-reviews.webp', 'Google Business reviews carousel'),
  img('/images/added-media/indexing.png', 'Search Console indexing report'),
  img('/images/added-media/Free Audit & Call.png', 'Free audit and call conversion paths'),
  img('/images/added-media/lighthouse-perfect.webp', 'Lighthouse performance scores'),
];

/** When the same video would repeat, swap later slots to distinct UI stills / placeholders */
const VIDEO_FOLLOWUPS = {
  '/images/added-media/crm%20outreach.mp4': [
    images.crmSystemUi,
    images.emailAgentUi,
    mediaNeeded('/crm-outreach-lead-generation', 'CRM reply triage → booked estimate view (crm_reply) with brand lane visible — redact lead emails', 'Screenshot · 1600×900 · redact PII'),
  ],
  '/videos/automation/crm-outreach-dashboard.mp4': [
    images.crmSystemUi,
    images.emailAgentUi,
    mediaNeeded('/crm-outreach-lead-generation', 'CRM reply triage → booked estimate view (crm_reply) with brand lane visible — redact lead emails', 'Screenshot · 1600×900 · redact PII'),
  ],
  '/images/added-media/email%20agent.mp4': [
    images.emailAgentUi,
    mediaNeeded('/email-agent-automation', 'Email-Agent provider → view → bounce loop UI — show form vs crm_reply separation', 'Screenshot · 1600×900 · redact addresses'),
    images.crmSystemUi,
  ],
  '/videos/automation/email-agent-routing.mp4': [
    images.emailAgentUi,
    mediaNeeded('/email-agent-automation', 'Email-Agent provider → view → bounce loop UI — show form vs crm_reply separation', 'Screenshot · 1600×900 · redact addresses'),
    images.crmSystemUi,
  ],
  '/images/added-media/referral%20system%20kl.mp4': [
    images.referralQrUi,
    images.referralPayoutsUi,
    images.referralCheckoutUi,
  ],
  '/images/added-media/referral%20system.mp4': [
    images.referralQrUi,
    images.referralPayoutsUi,
    images.referralCheckoutUi,
  ],
  '/videos/automation/referral-system-dashboard.mp4': [
    images.referralQrUi,
    images.referralPayoutsUi,
    images.referralCheckoutUi,
  ],
  '/images/added-media/social%20media%20manager.mp4': [
    mediaNeeded('/social-media-automation-systems', 'Social Poster queue — brand lanes, scheduled posts, last-success timestamps', 'Screenshot · 1600×900 · redact tokens'),
    mediaNeeded('/social-media-automation-systems', 'Social Ops engagement / growth-agent sweep UI from Knight Command Social Ops tab', 'Screenshot · 1600×900 · redact tokens'),
    images.knightCommandShell,
  ],
  '/videos/automation/social-media-manager.mp4': [
    mediaNeeded('/social-media-automation-systems', 'Social Poster queue — brand lanes, scheduled posts, last-success timestamps', 'Screenshot · 1600×900 · redact tokens'),
    mediaNeeded('/social-media-automation-systems', 'Social Ops engagement / growth-agent sweep UI from Knight Command Social Ops tab', 'Screenshot · 1600×900 · redact tokens'),
    images.knightCommandShell,
  ],
  '/videos/automation/kg-dispatch-mobile-app.mp4': [
    mediaNeeded('/ticketing-invoicing-job-workflows', 'KG Dispatch mobile before/process/after photo capture on a live job', 'Phone screenshot · 1080×1920 · redact address'),
    mediaNeeded('/ticketing-invoicing-job-workflows', 'KG Dispatch admin ticket → Stripe invoice closeout view', 'Screenshot · 1600×900 · redact PII'),
  ],
};

const MOCKUP_REPLACEMENTS = {
  '/images/showcase/case-study-knight-command-mockup.webp': images.knightCommandShell,
  '/images/showcase/case-study-crm-outreach-mockup.webp': images.crmSystemUi,
  '/images/showcase/case-study-referral-network-mockup.webp': images.referralPayoutsUi,
  '/images/showcase/case-study-social-poster-mockup.webp': mediaNeeded(
    '/social-media-automation-systems',
    'Real Social Poster queue screenshot from Knight Command — replace HTML mockup',
    'Screenshot · 1600×900 · redact tokens'
  ),
  '/images/showcase/case-study-vendoroo-ticket-mockup.webp': mediaNeeded(
    '/ticketing-invoicing-job-workflows',
    'Real Vendoroo / KG Dispatch ticket queue — replace HTML mockup; redact homeowner PII',
    'Screenshot · 1600×900 · redact PII'
  ),
  '/images/showcase/case-study-knightlogics-platform-mockup.webp': images.knightCommandShell,
};

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
    const key = normalizeSrc(item.src || item.brief);
    if (!key || used.has(key)) continue;
    used.add(key);
    return cloneMedia(item);
  }
  return null;
}

function pickReplacement(gallery, used) {
  return (gallery && pickFromGallery(gallery, used)) || pickFallback(used);
}

function replaceMockupMedia(media, used) {
  if (!media?.src) return media;
  const key = normalizeSrc(media.src);
  const repl = MOCKUP_REPLACEMENTS[key] || MOCKUP_REPLACEMENTS[media.src];
  if (!repl) return media;
  const next = cloneMedia(repl);
  const nextKey = normalizeSrc(next.src || next.brief);
  if (nextKey) used.add(nextKey);
  return next;
}

function diversifyVideoSlot(media, usedVideos, followupIndex, pageSlug, usedImages) {
  if (!media || media.type !== 'video') return media;
  const key = normalizeSrc(media.src);
  if (!usedVideos.has(key)) {
    usedVideos.add(key);
    return media;
  }

  const followups = VIDEO_FOLLOWUPS[key] || VIDEO_FOLLOWUPS[media.src] || [];
  const candidate = followups[followupIndex] || followups[followups.length - 1];
  if (candidate) {
    const next = cloneMedia(candidate);
    if (next.type === 'image' && next.src) usedImages.add(normalizeSrc(next.src));
    if (next.type === 'media-needed') {
      next.page = next.page || `/${pageSlug}`;
    }
    return next;
  }

  const needed = mediaNeeded(
    `/${pageSlug}`,
    `Distinct UI capture for "${media.title || 'this workflow'}" — do not reuse the same video again on this page`,
    'Screenshot or short clip · unique to this section'
  );
  return needed;
}

/**
 * Mutates page in place: replaces duplicate image/video slots and HTML mockups.
 */
function diversifyPageMedia(page) {
  const gallery = galleryForSlug(page.slug);
  const usedImages = new Set();
  const usedVideos = new Set();
  const videoFollowupCount = new Map();

  const heroSrc = page.heroImage?.src;
  if (heroSrc) usedImages.add(normalizeSrc(heroSrc));
  if (tradeNetworkForSlug(page.slug)) {
    const net = tradeNetworkForSlug(page.slug);
    const netSrc = net?.networkImage?.src || TRADE_NETWORK_IMAGE;
    usedImages.add(normalizeSrc(netSrc));
  }

  function touchMedia(media) {
    if (!media) return media;
    let next = replaceMockupMedia(media, usedImages);

    if (next.type === 'video') {
      const vKey = normalizeSrc(next.src);
      const idx = videoFollowupCount.get(vKey) || 0;
      next = diversifyVideoSlot(next, usedVideos, Math.max(0, idx - 1), page.slug, usedImages);
      videoFollowupCount.set(vKey, idx + 1);
      return next;
    }

    if (next.type === 'image' && next.src) {
      const key = normalizeSrc(next.src);
      if (usedImages.has(key)) {
        const replacement = pickReplacement(gallery, usedImages);
        if (replacement) return replacement;
      } else {
        usedImages.add(key);
      }
    }

    return next;
  }

  if (page.problem?.media) {
    page.problem.media = touchMedia(page.problem.media);
  }

  if (Array.isArray(page.mediaBlocks)) {
    for (const block of page.mediaBlocks) {
      if (block.media) block.media = touchMedia(block.media);
    }
  }

  if (page.proof?.image) {
    const fake = { type: 'image', src: page.proof.image, alt: page.proof.imageAlt };
    const fixed = touchMedia(fake);
    if (fixed.type === 'image' && fixed.src) {
      page.proof.image = fixed.src;
      if (fixed.alt) page.proof.imageAlt = fixed.alt;
    } else if (fixed.type === 'media-needed') {
      page.proof.mediaNeeded = fixed;
    }
  }

  return page;
}

module.exports = {
  PAGE_GALLERIES,
  diversifyPageMedia,
  galleryForSlug,
  MOCKUP_REPLACEMENTS,
  VIDEO_FOLLOWUPS,
};
