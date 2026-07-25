/** Shared media paths for growth page content */

const heroPanelPool = [
  '/images/showcase/faith-works-og-card.jpg',
  '/images/screen-team-showcase-800.webp',
  '/images/KGHero.webp',
  '/images/JNS-HomeImage.webp',
  '/images/momhero.webp',
  '/images/websitehero.webp?v=20260604perf1'
];

const SLUG_HERO_PANELS = {
  'roofing-business-growth-systems': [
    '/images/showcase/roof-monsters-og-card.webp',
    '/images/showcase/roof-monsters-homepage-wave.webp',
    '/images/showcase/roof-monsters-project.webp',
    '/images/showcase/roof-monsters-showcase-800.webp'
  ]
};

/** object-position for cover crops — tuned so people stay in frame */
const heroImageFocus = {
  '/images/showcase/faith-works-og-card.jpg': { desktop: '42% 38%', mobile: '44% 36%' },
  '/images/screen-team-showcase-800.webp': { desktop: '74% 48%', mobile: '82% 50%' },
  '/images/KGHero.webp': { desktop: '76% 44%', mobile: '82% 46%' },
  '/images/JNS-HomeImage.webp': { desktop: '55% 42%', mobile: '58% 44%' },
  '/images/showcase/hospitality-events-hours-mockup.webp': { desktop: '50% 42%', mobile: '50% 40%' },
  '/images/showcase/hospitality-menus-ordering-mockup.webp': { desktop: '50% 42%', mobile: '50% 40%' },
  '/images/momhero.webp': { desktop: '50% 32%', mobile: '50% 28%' },
  '/images/websitehero.webp': { desktop: '38% 36%', mobile: '42% 38%' },
  '/images/websitehero.webp?v=20260604perf1': { desktop: '38% 36%', mobile: '42% 38%' },
  '/images/showcase/roof-monsters-og-card.webp': { desktop: '50% 40%', mobile: '50% 38%' },
  '/images/showcase/roof-monsters-homepage-wave.webp': { desktop: '48% 42%', mobile: '50% 40%' },
  '/images/showcase/roof-monsters-project.webp': { desktop: '50% 45%', mobile: '52% 48%' },
  '/images/showcase/roof-monsters-showcase-800.webp': { desktop: '50% 42%', mobile: '50% 40%' }
};

const heroMobilePriority = [
  '/images/screen-team-showcase-800.webp',
  '/images/KGHero.webp',
  '/images/websitehero.webp?v=20260604perf1',
  '/images/JNS-HomeImage.webp',
  '/images/showcase/faith-works-og-card.jpg',
  '/images/momhero.webp'
];

function normalizeHeroSrc(src) {
  if (!src) return '';
  return src.split('?')[0];
}

function getHeroFocus(src, mobile = false) {
  const key = src || '';
  const bare = normalizeHeroSrc(key);
  const entry = heroImageFocus[key] || heroImageFocus[bare];
  if (!entry) return '50% 42%';
  return mobile ? entry.mobile : entry.desktop;
}

function pickMobileHeroImage(panels, primarySrc) {
  const barePrimary = normalizeHeroSrc(primarySrc);
  if (barePrimary && (heroImageFocus[primarySrc] || heroImageFocus[barePrimary])) {
    const match = panels.find((p) => normalizeHeroSrc(p) === barePrimary);
    if (match) return match;
    if (primarySrc && !/KnightLogicsLogo/i.test(primarySrc)) return primarySrc;
  }

  for (const preferred of heroMobilePriority) {
    const found = panels.find((p) => normalizeHeroSrc(p) === normalizeHeroSrc(preferred));
    if (found) return found;
  }

  return panels[0];
}

function isLogoHero(src) {
  return !src || /KnightLogicsLogo/i.test(src);
}

function pickHeroPanels(slug, primarySrc) {
  const slugPanels = SLUG_HERO_PANELS[slug];
  if (slugPanels && slugPanels.length >= 4) {
    return slugPanels.slice(0, 4);
  }

  const panels = [];
  if (!isLogoHero(primarySrc)) {
    panels.push(primarySrc);
  }

  const key = String(slug || 'page');
  const excludeMomHero = /restaurant-bar|hospitality-system/.test(key);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 3)) % heroPanelPool.length;
  }

  for (let i = 0; panels.length < 4; i += 1) {
    const candidate = heroPanelPool[(hash + i) % heroPanelPool.length];
    if (excludeMomHero && normalizeHeroSrc(candidate) === '/images/momhero.webp') continue;
    if (!panels.includes(candidate)) panels.push(candidate);
    if (i > heroPanelPool.length * 2) break;
  }

  while (panels.length < 4) {
    const fallback = heroPanelPool[panels.length % heroPanelPool.length];
    if (excludeMomHero && normalizeHeroSrc(fallback) === '/images/momhero.webp') {
      panels.push('/images/showcase/hospitality-events-hours-mockup.webp');
    } else {
      panels.push(fallback);
    }
  }

  return panels.slice(0, 4);
}

module.exports = {
  heroPanelPool,
  heroImageFocus,
  heroMobilePriority,
  normalizeHeroSrc,
  getHeroFocus,
  pickMobileHeroImage,
  isLogoHero,
  pickHeroPanels,
  videos: {
    crm: { type: 'video', src: '/videos/automation/crm-outreach-dashboard.mp4', vtt: '/videos/automation/crm-outreach-dashboard.vtt', title: 'CRM outreach dashboard' },
    email: { type: 'video', src: '/videos/automation/email-agent-routing.mp4', vtt: '/videos/automation/email-agent-routing.vtt', title: 'Email-Agent routing' },
    social: { type: 'video', src: '/videos/automation/social-media-manager.mp4', vtt: '/videos/automation/social-media-manager.vtt', title: 'Social media manager' },
    dispatch: { type: 'video', src: '/videos/automation/kg-dispatch-mobile-app.mp4', vtt: '/videos/automation/kg-dispatch-mobile-app.vtt', title: 'KG Dispatch mobile app' },
    referral: { type: 'video', src: '/videos/automation/referral-system-dashboard.mp4', vtt: '/videos/automation/referral-system-dashboard.vtt', title: 'Referral system dashboard' },
    roofMonsters: {
      type: 'video',
      src: '/images/roof-monsters-rebuild.mp4',
      poster: '/images/showcase/roof-monsters-showcase-800.webp',
      title: 'Roof Monsters website rebuild walkthrough',
      controls: true
    },
    screenTeam: {
      type: 'video',
      src: '/images/ST-Update.mp4',
      poster: '/images/screen-team/banner.webp',
      title: 'Screen Team website walkthrough',
      controls: true
    },
    knightGroup: {
      type: 'video',
      src: '/images/Knight-Group-Website-Update.mp4',
      poster: '/images/showcase/knight-group-showcase.webp',
      title: 'Knight Group website walkthrough',
      controls: true
    },
    salsPainting: {
      type: 'video',
      src: '/images/salspainting-upgrade.mp4',
      poster: '/images/sals-hero.webp',
      title: "Sal's Painting website walkthrough",
      controls: true
    },
    momsResin: {
      type: 'video',
      src: '/images/momsresintables-site.mp4',
      poster: '/images/momhero.webp',
      title: "Mom's Resin Tables website walkthrough",
      controls: true
    }
  },
  images: {
    kgHero: { type: 'image', src: '/images/KGHero.webp', alt: 'Knight Group handyman website hero' },
    screenTeam: { type: 'image', src: '/images/screen-team-showcase-800.webp', alt: 'Screen Team LLC local service website', width: 800, height: 450 },
    faithWorks: { type: 'image', src: '/images/showcase/faith-works-og-card.jpg', alt: 'Faith Works Outdoor Services local SEO site', width: 1200, height: 630 },
    jns: { type: 'image', src: '/images/JNS-HomeImage.webp', alt: 'JNS Construction contractor website' },
    farrellElectric: { type: 'image', src: '/images/farrell/hero.png', alt: 'Farrell Electric website hero', width: 1200, height: 630 },
    salsPainting: { type: 'image', src: '/images/sals-hero.webp', alt: "Sal's Painting website hero", width: 1200, height: 630 },
    moms: { type: 'image', src: '/images/momhero.webp', alt: "Mom's Resin Tables e-commerce storefront" },
    hospitality: {
      type: 'image',
      src: '/images/showcase/hospitality-menus-ordering-mockup.webp',
      alt: 'Illustration of restaurant menu specials and order-ahead checkout',
      width: 1200,
      height: 750
    },
    hospitalityEvents: {
      type: 'image',
      src: '/images/showcase/hospitality-events-hours-mockup.webp',
      alt: 'Illustration of restaurant events calendar and business hours on owned domain',
      width: 1200,
      height: 750
    },
    hospitalityMenus: {
      type: 'image',
      src: '/images/showcase/hospitality-menus-ordering-mockup.webp',
      alt: 'Illustration of admin-editable menu specials and Stripe order-ahead checkout',
      width: 1200,
      height: 750
    },
    logo: { type: 'image', src: '/images/KnightLogicsLogo2.webp', alt: 'Knight Logics growth systems' },
    caseStudyCrm: { type: 'image', src: '/images/showcase/case-study-crm-outreach-mockup.webp', alt: 'CRM outreach queue dashboard', width: 1200, height: 675 },
    caseStudyVendoroo: { type: 'image', src: '/images/showcase/case-study-vendoroo-ticket-mockup.webp', alt: 'Vendor ticket and invoice workflow', width: 1200, height: 675 },
    caseStudyKnightCommand: { type: 'image', src: '/images/showcase/case-study-knight-command-mockup.webp', alt: 'Knight Command admin shell', width: 1200, height: 675 },
    knightCommandShell: { type: 'image', src: '/images/added-media/knight-command.webp', alt: 'Knight Command admin shell', width: 2853, height: 1261 },
    googleBusinessProfile: { type: 'image', src: '/images/added-media/google-business-profile.webp', alt: 'Google Business Profile for a local service business', width: 1377, height: 1264 },
    caseStudyReferral: { type: 'image', src: '/images/showcase/case-study-referral-network-mockup.webp', alt: 'Referral network attribution dashboard', width: 1200, height: 675 },
    caseStudySocial: { type: 'image', src: '/images/showcase/case-study-social-poster-mockup.webp', alt: 'Social posting queue dashboard', width: 1200, height: 675 },
    caseStudyRoofing: { type: 'image', src: '/images/showcase/roof-monsters-og-card.webp', alt: 'Roof Monsters live roofing website on roofmonsters.co', width: 1200, height: 630 },
    roofMonstersHome: { type: 'image', src: '/images/showcase/roof-monsters-homepage-wave.webp', alt: 'Roof Monsters homepage — Your Roof Is Our Proof', width: 1920, height: 1080 },
    roofMonstersProject: { type: 'image', src: '/images/showcase/roof-monsters-project.webp', alt: 'Roof Monsters completed Tampa Bay roofing project', width: 1200, height: 800 },
    roofMonstersLighthouse: { type: 'image', src: '/images/showcase/roof-monsters-lighthouse-97.webp', alt: 'Roof Monsters Lighthouse scores — 97 performance, 100 accessibility SEO', width: 1200, height: 800 },
    roofMonstersSemrush: { type: 'image', src: '/images/showcase/roof-monsters-semrush-99.webp', alt: 'Roof Monsters Semrush site health 99 percent', width: 1200, height: 800 },
    roofMonstersGsc: { type: 'image', src: '/images/showcase/roof-monsters-gsc-sitemap.webp', alt: 'Google Search Console sitemap success — 79 discovered pages', width: 1200, height: 800 },
    roofMonstersShowcase: { type: 'image', src: '/images/showcase/roof-monsters-showcase-800.webp', alt: 'Roof Monsters website showcase card', width: 800, height: 500 },
    caseStudyKnightLogics: { type: 'image', src: '/images/showcase/case-study-knightlogics-platform-mockup.webp', alt: 'Knight Logics marketing and ops platform', width: 1200, height: 675 }
  }
};
