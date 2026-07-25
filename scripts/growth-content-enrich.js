const {
  KG,
  FW,
  ST,
  KG_STATS,
  FW_STATS,
  ST_STATS,
  TRIO_PROOF,
  TRIO_STATS,
  kgMediaBlock,
  clientMediaBlockForSlug,
  clientStatsForSlug,
  hasClientMediaBlock,
  primaryClientForSlug,
  CLIENT_MEDIA_SLUGS
} = require('./growth-content-client-facts');
const { videos, images } = require('./growth-content-media');

const PROOF = {
  kg: {
    href: '/case-study-knight-group',
    image: '/images/KGHero.webp',
    imageAlt: 'Knight Group handyman website',
    title: 'Knight Group — 97-page growth architecture',
    text: `${KG.lighthouse.performance}/100/${KG.lighthouse.seo} Lighthouse scores, booking flow, and kg OutreachEngine lane with real booked work.`,
    badge: 'Live client'
  },
  screenTeam: {
    href: '/case-study-screen-team',
    image: ST.media.src,
    imageAlt: ST.media.alt,
    title: `Screen Team — ${ST.pageCount}-page growth system`,
    text: `${ST.pageCount} indexable pages for pool enclosure and screen repair across Tampa Bay — st OutreachEngine lane, Email-Agent mapping, and full growth stack.`,
    badge: 'Live client'
  },
  knightCommand: {
    href: '/case-study-knight-command',
    image: '/images/showcase/case-study-knight-command-mockup.webp',
    imageAlt: 'Knight Command admin shell with outreach, referrals, and ops tabs',
    title: 'Knight Command ops shell',
    text: 'Unified /admin tabs for CRM, email, social, referrals, and logs on ports 5050–8501.',
    badge: 'Internal system'
  },
  crmOutreach: {
    href: '/case-study-crm-outreach-system',
    image: '/images/showcase/case-study-crm-outreach-mockup.webp',
    imageAlt: 'CRM outreach queue dashboard with segmented lists and reply routing',
    title: 'OutreachEngine in production',
    text: 'Flask SQLite CRM with kl, kg, st, and faithworks brand lanes — scheduler cadence and Email-Agent reply routing on live client campaigns.',
    badge: 'Live workflow'
  },
  vendoroo: {
    href: '/case-study-vendoroo-ticket-invoice-system',
    image: '/images/showcase/case-study-vendoroo-ticket-mockup.webp',
    imageAlt: 'Vendor portal ticket intake, mobile job flow, and Stripe invoice trigger',
    title: 'Vendoroo-style ticket workflow',
    text: 'Portal intake, mobile proof, PDF packets, and Stripe invoice triggers in one path.',
    badge: 'Active build'
  },
  referral: {
    href: '/case-study-referral-network-system',
    image: '/images/showcase/case-study-referral-network-mockup.webp',
    imageAlt: 'Referral network dashboard with QR attribution and payout visibility',
    title: 'Referral network infrastructure',
    text: '/ref/:partner paths, Neon Postgres events, QR brochures, and Stripe webhook payouts.',
    badge: 'Live workflow'
  },
  socialPoster: {
    href: '/case-study-social-poster',
    image: '/images/showcase/case-study-social-poster-mockup.webp',
    imageAlt: 'Multi-brand social posting queue with API and Playwright runners',
    title: 'Social Poster on port 8501',
    text: 'Multi-brand queues with API and Playwright runners plus GBP post integration.',
    badge: 'Live workflow'
  },
  hospitalityPattern: {
    href: '/case-study-hospitality-system-pattern',
    image: '/images/showcase/hospitality-menus-ordering-mockup.webp',
    imageAlt: 'Illustration of admin-editable menu specials and order-ahead checkout',
    title: 'Hospitality system pattern',
    text: 'Events calendar, admin-editable menus, and ordering-ready architecture — client case studies publish after approval.',
    badge: 'Pending approval'
  },
  roofMonsters: {
    href: '/case-study-roof-monsters',
    image: '/images/showcase/roof-monsters-og-card.webp',
    imageAlt: 'Roof Monsters live roofing website on roofmonsters.co',
    title: 'Roof Monsters — live roofing growth system',
    text: 'Live Tampa Bay roofing site with 79+ pages, estimate-first lead capture, 97 Lighthouse performance, and local SEO depth on roofmonsters.co.',
    badge: 'Live client'
  },
  roofMonstersAudit: {
    href: '/case-study-roof-monsters',
    image: '/images/showcase/roof-monsters-lighthouse-97.webp',
    imageAlt: 'Roof Monsters Lighthouse report — 97 performance and 100 accessibility SEO',
    title: 'Audit-backed technical scores',
    text: 'Desktop Lighthouse 97/100/100/100 with Semrush 99% and Ahrefs 100 health on the live roofmonsters.co launch.',
    badge: 'Live proof'
  },
  roofMonstersProject: {
    href: '/case-study-roof-monsters',
    image: '/images/showcase/roof-monsters-project.webp',
    imageAlt: 'Roof Monsters completed Tampa Bay roofing project',
    title: 'Project proof + estimate-first CTAs',
    text: 'Gallery-ready project proof paired with storm-season estimate capture — the visual language of the live roofing build.',
    badge: 'Live client'
  },
  faithWorks: {
    href: '/case-study-faith-works',
    image: FW.media.src,
    imageAlt: FW.media.alt,
    title: 'Faith Works — 82-page growth system',
    text: `${FW.pageCount} land clearing and forestry mulching pages across Central Florida — faithworks OutreachEngine lane, schema, GA4/GSC, and GBP alignment in the full growth stack.`,
    badge: 'Live client'
  },
  jns: {
    href: '/case-study-jns',
    image: '/images/JNS-HomeImage.webp',
    imageAlt: 'JNS Construction website',
    title: 'JNS Construction bundle',
    text: 'Focused contractor website launch with service clarity and conversion paths.',
    badge: 'Live client'
  },
  farrellElectric: {
    href: '/case-study-farrell-electric',
    image: 'https://farrell-electric.github.io/farrell-electric-website/HeroImage.png',
    imageAlt: 'Farrell Electric website',
    title: 'Farrell Electric starter launch',
    text: 'Multi-page electrician site with essential SEO and contact conversion — open lane reference.',
    badge: 'Case study'
  },
  salsPainting: {
    href: '/case-study-sals-painting',
    image: '/images/sals-hero.webp',
    imageAlt: "Sal's Painting website",
    title: "Sal's Painting search-ready site",
    text: 'Search-optimized painter launch with analytics, schema, and brand foundation.',
    badge: 'Case study'
  }
};

function applyKgReplacements(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/19 pages/gi, '97 indexable pages')
    .replace(/19-page/gi, '97-page');
}

function applyKgReplacementsDeep(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return applyKgReplacements(obj);
  if (Array.isArray(obj)) return obj.map(applyKgReplacementsDeep);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'value' && v === '19' && typeof obj.label === 'string' && /knight group/i.test(obj.label)) {
        out[k] = '97';
      } else {
        out[k] = applyKgReplacementsDeep(v);
      }
    }
    return out;
  }
  return obj;
}

function hasAnyClientMediaBlock(blocks) {
  return hasClientMediaBlock(blocks, 'kg') || hasClientMediaBlock(blocks, 'fw') || hasClientMediaBlock(blocks, 'st');
}

function mergeStats(existing, extra) {
  if (!extra || !extra.length) return existing;
  if (!existing || !existing.length) return extra;
  const labels = new Set(existing.map((s) => s.label));
  return [...existing, ...extra.filter((s) => !labels.has(s.label))];
}

function deepMerge(page, enrichment) {
  const merged = applyKgReplacementsDeep(JSON.parse(JSON.stringify(page)));
  for (const key of Object.keys(enrichment)) {
    if (key === 'mediaBlocks' && enrichment.mediaBlocks) {
      merged.mediaBlocks = [...(merged.mediaBlocks || []), ...enrichment.mediaBlocks];
    } else if (key === 'stats' && enrichment.stats) {
      merged.stats = mergeStats(merged.stats, enrichment.stats);
    } else {
      merged[key] = enrichment[key];
    }
  }
  return merged;
}

function hashSlug(slug) {
  return [...String(slug || '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** One primary + system-specific secondary — avoid stacking identical FW/ST/KG captions on every page. */
function defaultProofGrid(slug) {
  const pool = [
    PROOF.kg,
    PROOF.screenTeam,
    PROOF.faithWorks,
    PROOF.crmOutreach,
    PROOF.referral,
    PROOF.socialPoster,
    PROOF.knightCommand,
    PROOF.jns,
    PROOF.vendoroo
  ];
  const map = {
    'business-growth-systems': [PROOF.kg, PROOF.faithWorks, PROOF.screenTeam, PROOF.roofMonsters, PROOF.farrellElectric, PROOF.salsPainting, PROOF.jns, PROOF.hospitalityPattern],
    'crm-outreach-lead-generation': [PROOF.crmOutreach, PROOF.kg],
    'ticketing-invoicing-job-workflows': [PROOF.vendoroo, PROOF.jns],
    'referral-network-systems': [PROOF.referral, PROOF.knightCommand],
    'local-visibility-systems': [PROOF.faithWorks, PROOF.screenTeam],
    'website-growth-audit': [PROOF.roofMonstersAudit, PROOF.kg],
    'online-ordering-systems': [PROOF.hospitalityPattern, PROOF.jns],
    'contractor-growth-systems': [PROOF.screenTeam, PROOF.jns],
    'home-service-business-growth-systems': [PROOF.kg, PROOF.screenTeam],
    'performance-partner-program': [PROOF.knightCommand, PROOF.crmOutreach],
    'handyman-business-growth-systems': [PROOF.kg, PROOF.crmOutreach],
    'electrician-business-growth-systems': [PROOF.farrellElectric, PROOF.kg],
    'painter-business-growth-systems': [PROOF.salsPainting, PROOF.kg],
    'roofing-business-growth-systems': [PROOF.roofMonsters, PROOF.roofMonstersAudit, PROOF.roofMonstersProject],
    'screen-enclosure-business-growth-systems': [PROOF.screenTeam, PROOF.socialPoster],
    'excavation-business-growth-systems': [PROOF.faithWorks, PROOF.jns],
    'restaurant-bar-growth-systems': [PROOF.hospitalityPattern, PROOF.socialPoster],
    'starting-a-new-business': [PROOF.kg, PROOF.faithWorks, PROOF.screenTeam, PROOF.roofMonsters, PROOF.farrellElectric, PROOF.salsPainting, PROOF.jns, PROOF.hospitalityPattern],
    'ai-business-automation': [PROOF.knightCommand, PROOF.socialPoster],
    'workflow-automation': [PROOF.knightCommand, PROOF.crmOutreach],
    'email-agent-automation': [PROOF.crmOutreach, PROOF.knightCommand],
    'social-media-automation-systems': [PROOF.socialPoster, PROOF.screenTeam],
    'stripe-invoice-automation': [PROOF.vendoroo, PROOF.jns],
    'job-photo-pdf-reports': [PROOF.vendoroo, PROOF.jns],
    'review-request-systems': [PROOF.screenTeam, PROOF.roofMonsters],
    'service-area-page-strategy': [PROOF.faithWorks, PROOF.screenTeam],
    'business-dashboard-development': [PROOF.knightCommand, PROOF.referral],
    'internal-business-tools': [PROOF.knightCommand, PROOF.crmOutreach],
    'api-integration-services': [PROOF.referral, PROOF.vendoroo],
    'case-study-knight-command': [PROOF.crmOutreach, PROOF.referral, PROOF.socialPoster],
    'case-study-crm-outreach-system': [PROOF.kg, PROOF.crmOutreach],
    'case-study-vendoroo-ticket-invoice-system': [PROOF.vendoroo, PROOF.jns],
    'case-study-referral-network-system': [PROOF.referral, PROOF.knightCommand],
    'case-study-social-poster': [PROOF.socialPoster, PROOF.knightCommand],
    'case-study-hospitality-system-pattern': [PROOF.hospitalityPattern, PROOF.socialPoster]
  };
  if (map[slug]) return map[slug];
  if (slug.startsWith('case-study-')) return [PROOF.knightCommand, PROOF.crmOutreach];
  const h = hashSlug(slug);
  return [pool[h % pool.length], pool[(h + 3) % pool.length]];
}

function defaultSectionIntros(page) {
  const name = page.title || page.h1 || String(page.slug || 'this lane').replace(/-/g, ' ');
  return {
    deliverablesIntro: `What ships when we scope ${name} for your trade, territory, and operator workflow.`,
    outcomesIntro: `Results ${name} is designed to produce for owners who review queues weekly — not vanity dashboards.`,
    proofsIntro: `Examples that belong to ${name}. Primary proof first; secondary only when it shares the same system pattern.`
  };
}

const enrichments = {
  'business-growth-systems': {
    context: {
      title: 'One stack — not five tabs',
      layout: 'wide',
      paragraphs: [
        'We do not just design fancy websites — we build sophisticated growth systems that help local businesses get found, capture leads, and follow up. Start with a basic setup (site, Google Business Profile, email, phone) or add CRM outreach, Email-Agent, social, referrals, and field ops as you are ready — the same stack behind Faith Works, Screen Team, and Knight Group in Tampa Bay.'
      ]
    },
    connections: null,
    outcomesIntro: 'What a connected growth stack is built to move — more qualified leads, faster follow-up, repeat work, and numbers you can actually check.',
    outcomes: [
      { title: 'More leads that fit', text: 'Local SEO, graded outreach lists, and referral lanes bring estimate-ready prospects — property managers, complementary trades, and homeowners searching your services — not random spam.' },
      { title: 'Fewer lost leads', text: 'Website forms and CRM replies route into Email-Agent with notifications or auto-acknowledgements — so nothing sits in a personal inbox until tomorrow.' },
      { title: 'Faster first response', text: 'High-fit outreach replies surface in crm_reply queues while the lead is still comparing vendors — speed wins estimate-first trades.' },
      { title: 'Repeat-service customers', text: 'Graded targeting and fast follow-up attract accounts that buy ongoing work; dispatch and invoicing keep them in your system after the first job.' },
      { title: 'Marketing from field work', text: 'Before/process/after photos become gallery pages and social posts automatically — proof content without a second upload step.' },
      { title: 'Attribution you can defend', text: 'Referral partners, outreach lists, GBP posts, and form fills tie back to consults and booked jobs — not vanity traffic with no source.' }
    ],
    proofsIntro: 'Live client sites across Tampa Bay — full growth systems and focused launches — not only the flagship stack.',
    proofGrid: [
      PROOF.kg,
      PROOF.faithWorks,
      PROOF.screenTeam,
      PROOF.roofMonsters,
      PROOF.farrellElectric,
      PROOF.salsPainting,
      PROOF.jns,
      PROOF.hospitalityPattern
    ],
    stats: TRIO_STATS
  },
  'crm-outreach-lead-generation': {
    deliverablesIntro: 'OutreachEngine configuration for contractor email outreach — lists, caps, brand lanes, and reply routing.',
    outcomesIntro: 'Outbound lead generation outcomes operators can check after each send window.',
    proofsIntro: 'CRM outreach proof — OutreachEngine case study first, then a brand lane that booked real work.',
    proofGrid: [PROOF.crmOutreach, PROOF.kg],
    context: {
      title: 'Production outreach, not spreadsheet Gmail',
      paragraphs: [
        'CRM outreach for local service businesses needs brand separation, send caps, bounce discipline, and reply routing — not copy-paste from a shared spreadsheet. OutreachEngine is the live engine behind kl, kg, st, and faithworks brand lanes.',
        'Property manager outreach and complementary-trade lists run under daily send caps so domain reputation stays intact while the pipeline compounds. Knight Group’s kg lane produced substantial booked work from one well-targeted campaign using the same scheduler pattern.',
        'Replies surface in Email-Agent crm_reply views on port 5100 so operators review outreach responses without mixing them into personal Gmail threads.'
      ]
    },
    deliverables: [
      { title: 'List & segmentation', items: ['ICP definition by trade, geography, and company size', 'Import and tag lists with bounce suppression rules', 'Property manager, HOA, and complementary trade segments', 'Preview sends before scheduler jobs fire'] },
      { title: 'Engine configuration', items: ['Per-brand sender profiles for kl/kg/st separation', 'first_touch and followup scheduler jobs with 20–40 daily caps', 'Template library with proof links and service context', 'Bounce detection flags before reputation damage'] },
      { title: 'Reply & reporting', items: ['Email-Agent crm_reply routing on port 5100', 'Queue depth and send window visibility in CRM UI', 'Lead-source reporting by list and message variant', 'Knight Command Outreach CRM tab embed when co-deployed'] }
    ],
    connections: {
      kicker: 'Reply path',
      title: 'OutreachEngine → Email-Agent → operator review',
      text: 'Outreach sends from OutreachEngine; replies land in Email-Agent views mapped to the correct brand lane; operators triage from Knight Command or dedicated CRM tabs.',
      bullets: ['Flask + SQLite backend with reliable scheduler', 'Brand switcher prevents cross-template mistakes', 'Failure and bounce visibility before the week is wasted', 'Crawlable how-it-works prose sits next to the muted demo video'],
      links: [['/email-agent-automation', 'Email-Agent'], ['/case-study-crm-outreach-system', 'CRM Case Study'], ['/case-study-knight-group', 'Knight Group Proof']]
    },
    outcomes: [
      { title: 'Predictable pipeline', text: 'Follow-up cadence enforced by scheduler instead of depending on someone remembering inbox checks.' },
      { title: 'Protected reputation', text: 'Daily caps and bounce suppression keep domains healthy while lists scale.' },
      { title: 'Brand-safe sends', text: 'KG, KL, and ST lanes stay isolated — templates and senders do not cross-contaminate.' },
      { title: 'Measurable replies', text: 'Reply rate per list and message variant visible for weekly operator review.' }
    ]
  },
  'ticketing-invoicing-job-workflows': {
    context: {
      title: 'One path from portal ticket to paid invoice',
      paragraphs: [
        'Property maintenance vendors and field trades often receive work through vendor portals, complete jobs on site, then rebuild proof and invoices manually. Photos sit on phones, PDFs get recreated per manager format, and Stripe invoices are typed separately from job records.',
        'The ticketing lane unifies intake queue, mobile status updates, photo attachments per job ID, branded PDF completion packets, and Stripe invoice or payment link triggers on completion milestones.',
        'The Vendoroo-style active build documents the pattern — internal reference workflow for portal-driven vendors, integrated with job-photo-pdf-reports and stripe-invoice-automation sub-lanes.'
      ]
    },
    deliverables: [
      { title: 'Intake & assignment', items: ['Vendor portal, email, and manual ticket sources into one queue', 'Assignment rules and status workflow for field crews', 'Mobile-friendly job updates from phone or tablet on site', 'Required photo step before closeout when configured'] },
      { title: 'Proof & billing', items: ['Field photos tied to job ID — not camera rolls', 'Branded PDF completion reports for portal upload', 'Stripe invoice or payment link on completion trigger', 'Webhook sync for paid invoice status on job screen'] },
      { title: 'Owner visibility', items: ['Open jobs vs billed jobs dashboard', 'Bottleneck alerts for overdue invoices', 'Optional Email-Agent notifications on status changes', 'Integration hooks for property manager portal formats'] }
    ],
    connections: {
      kicker: 'Field ops stack',
      title: 'Ticket → photo → PDF → Stripe',
      text: 'Sub-services cover specialized layers; the flagship lane scopes the full ticket-to-invoice path for portal-heavy vendors.',
      bullets: ['job-photo-pdf-reports for completion packet patterns', 'stripe-invoice-automation for payment link triggers', 'Vendoroo case study as active internal build reference', 'Contractor growth systems for trades adding ops after site launch'],
      links: [['/job-photo-pdf-reports', 'Photo & PDF Reports'], ['/stripe-invoice-automation', 'Stripe Automation'], ['/case-study-vendoroo-ticket-invoice-system', 'Vendoroo Case Study']]
    },
    outcomes: [
      { title: 'Less re-entry', text: 'Office staff stops copying ticket details into side systems and rebuilding invoices from scratch.' },
      { title: 'Faster billing', text: 'Photo proof visible before invoice goes out — reducing billing lag after job completion.' },
      { title: 'Portal compliance', text: 'PDF packets structured for manager upload formats — fewer rejections on proof.' },
      { title: 'Payment clarity', text: 'Paid status syncs back to the job record instead of living only in Stripe.' }
    ]
  },
  'referral-network-systems': {
    deliverablesIntro: 'Referral tracking infrastructure — /ref paths, Neon events, partner dashboards, and payout sync.',
    outcomesIntro: 'Partner attribution outcomes that reduce payout disputes and speed network onboarding.',
    proofsIntro: 'Referral network proof — tracked partner paths and Knight Command embed, not a generic CRM grid.',
    proofGrid: [PROOF.referral, PROOF.knightCommand],
    context: {
      title: 'Partner attribution that scales trust',
      paragraphs: [
        'Referral partners send work through brochures, word of mouth, and complementary trades — but generic analytics cannot tell you which partner earned credit. Disputes slow network growth when payout status lives in spreadsheets.',
        'The referral infrastructure uses /ref/:partner entry paths, QR brochure assets, Neon Postgres event logging, referral-dashboard partner visibility, and Stripe webhook-driven payout settlement.',
        'Knight Command embeds referral ops on the 5050 family inside the Referrals tab — partners self-serve status checks instead of email disputes with ownership.'
      ]
    },
    deliverables: [
      { title: 'Tracking infrastructure', items: ['/ref/:partner landing paths with consult form attribution', 'QR brochure assets for print and field distribution', 'Neon Postgres event store for scans, forms, and conversions', 'Attribution windows defined in written program terms'] },
      { title: 'Partner experience', items: ['referral-dashboard with earned vs paid visibility', 'Partner onboarding with unique codes and assets', 'Webhook settlement for referral fee status', 'Data boundaries — partners see their stats, not owner-only leaks'] },
      { title: 'Program operations', items: ['Knight Command Referrals tab embed', 'Stripe webhook integration for payout sync', 'Monthly owner review of top-performing partners', 'API integration hooks for CRM and invoicing lanes'] }
    ],
    connections: {
      kicker: 'Network growth',
      title: 'Referrals connect to outreach and growth systems',
      text: 'Referral partners complement outbound CRM — attribution must be defensible before scaling Tampa Bay trade network experiments.',
      bullets: ['business-growth-systems for full stack deployment', 'api-integration-services for Stripe and Neon wiring', 'performance-partner-program when shared upside fits', 'case-study-referral-network-system documents live workflow'],
      links: [['/referral-program', 'Join Referral Program'], ['/case-study-referral-network-system', 'Referral Case Study'], ['/api-integration-services', 'API Integrations']]
    },
    outcomes: [
      { title: 'Dispute reduction', text: 'Partners check earned vs paid status in dashboard instead of arguing over spreadsheet rows.' },
      { title: 'Faster onboarding', text: 'Unique codes and QR assets deploy in days — not weeks of custom dev per partner.' },
      { title: 'Data-backed expansion', text: 'Owners see which QR campaigns and partner codes produce consults before scaling network spend.' },
      { title: 'Embedded ops', text: 'Referral support happens inside Knight Command without orphan dashboard URLs.' }
    ]
  },
  'local-visibility-systems': {
    context: {
      title: 'Map-pack readiness tied to real geography',
      paragraphs: [
        'Local visibility is more than meta tags — it is Google Business Profile alignment, service-area page architecture, schema validation, internal linking, and content that matches how customers search by city and service intent.',
        'Faith Works deploys 82 indexable land-clearing pages across Polk County and Central Florida — service silos plus city and area coverage with schema, GA4/GSC, and faithworks OutreachEngine lane in the growth stack.',
        'Screen Team runs 36 indexable enclosure and screen-repair pages across Tampa Bay metros with st OutreachEngine lane and Email-Agent ST mapping.',
        'Knight Group adds the handyman reference at 97 pages — 36 service silos, 30+ city pages, Lighthouse 96 performance, and kg lane campaigns that produced real booked work.'
      ],
      note: 'Local visibility assumes a conversion-ready website — audit and fix foundation gaps before scaling city pages.'
    },
    deliverables: [
      { title: 'Technical foundation', items: ['LocalBusiness, FAQ, and BreadcrumbList schema', 'Search Console setup and indexation monitoring', 'PageSpeed-first hand-coded builds', 'Canonical and internal linking architecture'] },
      { title: 'Geography & GBP', items: ['Service-area hub and city page strategy', 'Google Business Profile cleanup and post cadence', 'Sitelink-aligned booking or estimate paths', 'Review request timing post-job completion'] },
      { title: 'Content & proof', items: ['Service silo pages for distinct repair intents', 'Project galleries and trust signals', 'GBP post alignment with website campaigns', 'service-area-page-strategy documentation for expansion'] }
    ],
    connections: {
      kicker: 'Discovery stack',
      title: 'SEO, GBP, and social post cadence',
      text: 'Local visibility connects to social-media-automation-systems for scheduled GBP posts and review-request-systems for reputation growth.',
      bullets: ['website-growth-audit for baseline before build', 'Faith Works 82-page footprint for wide geography trades', 'Screen Team 36-page depth for metro enclosure coverage', 'Knight Group 97-page handyman reference when trade fits'],
      links: [['/service-area-page-strategy', 'Service Area Strategy'], ['/review-request-systems', 'Review Requests'], ['/case-study-screen-team', 'Screen Team Example']]
    },
    outcomes: [
      { title: 'Search intent match', text: 'City and service pages align to how customers actually query — not generic national template copy.' },
      { title: 'Rich result eligibility', text: 'Schema validated for LocalBusiness, FAQ, and review snippets where content supports it.' },
      { title: 'GBP coherence', text: 'Profile hours, services, and posts match owned website messaging.' },
      { title: 'Measurable geography', text: 'Indexable page count and rankings tracked per metro — Faith Works (82), Screen Team (36), and Knight Group (97) show responsible scale by trade.' }
    ]
  },
  'website-growth-audit': {
    context: {
      title: 'Baseline before build scope',
      paragraphs: [
        'A growth audit documents what is broken, what is working, and which lanes deserve investment before anyone writes code. Most local businesses discover conversion gaps, schema issues, GBP misalignment, and automation bottlenecks they did not know existed.',
        'Audits cover website clarity, technical SEO, lead capture paths, outreach readiness, referral attribution gaps, and ops visibility — prioritized by impact and your team\'s capacity to adopt new tools.',
        TRIO_PROOF + ' Use these live baselines when comparing your foundation to a production growth stack.'
      ]
    },
    deliverables: [
      { title: 'Website & conversion review', items: ['Mobile CTA placement and offer clarity', 'Page speed and Core Web Vitals snapshot', 'Form and call tracking gaps', 'Analytics and Search Console access check'] },
      { title: 'Discovery assessment', items: ['Schema and indexation review', 'GBP alignment vs owned site', 'Service-area coverage vs actual crew radius', 'Competitor geography gap analysis'] },
      { title: 'Systems readiness', items: ['CRM and outreach maturity score', 'Referral attribution documentation', 'Automation and dashboard opportunity map', 'Written prioritized recommendation list'] }
    ],
    connections: {
      kicker: 'Audit → build path',
      title: 'Findings map to flagship lanes',
      text: 'Audit output routes to business-growth-systems, individual lanes, or trade-specific sub-pages depending on urgency and budget.',
      bullets: ['Free audit entry point before paid scope', 'Faith Works and Screen Team for large geography trades', 'Knight Group benchmark when handyman depth applies', 'No obligation to adopt full stack — lane-scoped builds available'],
      links: [['/business-growth-systems', 'Growth Systems'], ['/book-consultation', 'Book Consultation'], ['/performance-partner-program', 'Partner Program']]
    },
    outcomes: [
      { title: 'Clear priorities', text: 'Owners receive ranked fixes — not a 40-page generic SEO report.' },
      { title: 'Scoped investment', text: 'Build quotes tied to documented gaps instead of template package pricing.' },
      { title: 'Baseline captured', text: 'Metrics documented before launch — essential for performance partnerships.' },
      { title: 'Honest fit assessment', text: 'We flag when a simple site refresh is enough vs when full systems make sense.' }
    ]
  },
  'online-ordering-systems': {
    context: {
      title: 'Owned-domain ordering without POS lock-in',
      paragraphs: [
        'Restaurants and retail businesses often outgrow brochure sites but are not ready for full Toast or Square ecosystem lock-in. Ordering-ready architecture on an owned domain keeps brand control while leaving hooks for future POS integration.',
        'The hospitality lane documents a reusable system pattern — admin-editable menus and events, mobile-first layout, Stripe-ready checkout path, and local visibility alignment. Client-branded case studies publish after approval and site transfer.',
        'Hand-coded builds avoid bloated page builders that tank mobile performance during peak order windows.'
      ]
    },
    deliverables: [
      { title: 'Ordering architecture', items: ['Menu and category structure with mobile cart UX', 'Stripe-ready checkout or payment link patterns', 'Pickup vs delivery flow scoping', 'Admin-editable content for non-developer staff'] },
      { title: 'Hospitality UX', items: ['Events calendar on owned domain', 'Hours and specials sync patterns', 'LocalBusiness schema for discovery', 'Photography and brand alignment'] },
      { title: 'Launch readiness', items: ['GBP alignment before public marketing', 'Ordering flow staging and test transactions', 'Kitchen ops consultation on volume fit', 'Future POS integration hooks documented'] }
    ],
    connections: {
      kicker: 'Hospitality lane',
      title: 'Pairs with restaurant-bar-growth-systems',
      text: 'Ordering is one layer of the hospitality growth stack — events, local SEO, and review strategy launch together when client approves go-live.',
      bullets: ['restaurant-bar-growth-systems for full hospitality scope', 'case-study-hospitality-system-pattern for capability documentation', 'local-visibility-systems for GBP and schema', 'stripe-invoice-automation patterns for payment sync'],
      links: [['/restaurant-bar-growth-systems', 'Restaurant Systems'], ['/case-study-hospitality-system-pattern', 'Hospitality System Pattern'], ['/local-visibility-systems', 'Local Visibility']]
    },
    outcomes: [
      { title: 'Brand-owned checkout', text: 'Customers order on your domain — not a third-party marketplace that owns the relationship.' },
      { title: 'Staff-friendly updates', text: 'Menu and event changes without developer tickets for daily specials.' },
      { title: 'Performance-safe UX', text: 'Hand-coded mobile layout handles peak traffic without page builder bloat.' },
      { title: 'POS-ready path', text: 'Architecture documents future integration when kitchen volume justifies it.' }
    ]
  },
  'contractor-growth-systems': {
    context: {
      title: 'Trades need visibility, leads, and ops — not templates',
      paragraphs: [
        'Contractor and field trades join a repeatable playbook: launch a credible online presence, publish a case study on knightlogics.com when ready, and plug into complementary referrals with tracked attribution.',
        'Established network anchors — Screen Team (enclosure), Faith Works (excavation), Knight Group (handyman) — prove depth at 36, 82, and 97 pages. Open lanes like electricians and painters add new partners using the same infrastructure.',
        'Each trade lane page describes the stack for prospects in that vertical — not a client microsite. Reference builds show what is possible; your brand gets its own lane, outreach caps, and referral codes.'
      ]
    },
    deliverables: [
      { title: 'Trade web & SEO', items: ['Service silo pages for distinct repair intents', 'City and service-area pages for real crew radius', 'Call-first and estimate CTAs above the fold on mobile', 'LocalBusiness and FAQ schema validation'] },
      { title: 'Lead systems', items: ['OutreachEngine for property managers and complementary trades', 'Form tracking with CRM intake rules', 'Referral /ref/:partner paths for partner trades', 'Review requests at job completion'] },
      { title: 'Field ops add-ons', items: ['Ticket intake for vendor portal work', 'Job photos and PDF proof packets', 'Stripe invoice triggers on completion', 'Owner dashboard for open vs billed jobs'] }
    ],
    connections: {
      kicker: 'Trade lane index',
      title: 'Network anchors + open recruitment lanes',
      text: 'Sub-pages document each vertical playbook. Anchors have live reference builds; open lanes actively recruit electricians, painters, and adjacent trades.',
      bullets: ['screen-enclosure — Screen Team reference (36 pages)', 'excavation — Faith Works reference (82 pages)', 'handyman — Knight Group reference (97 pages)', 'electrician & painter — open lanes with case study starters'],
      links: [['/screen-enclosure-business-growth-systems', 'Screen Enclosure'], ['/excavation-business-growth-systems', 'Excavation Lane'], ['/electrician-business-growth-systems', 'Electrician Lane'], ['/painter-business-growth-systems', 'Painter Lane'], ['/referral-network-systems', 'Referral Network']]
    },
    outcomes: [
      { title: 'Geography that converts', text: 'City pages match metros crews actually serve — reducing unqualified estimate requests.' },
      { title: 'Outbound beyond referrals', text: 'Property manager and HOA outreach runs on production OutreachEngine patterns.' },
      { title: 'Portal discipline', text: 'Ticket-to-invoice path available when vendor portal work dominates ops.' },
      { title: 'Trade-specific proof', text: 'Case studies per vertical — not one generic contractor portfolio page.' }
    ],
    stats: TRIO_STATS
  },
  'home-service-business-growth-systems': {
    context: {
      title: 'Property-facing trades live on urgent calls and repeat work',
      paragraphs: [
        'Home service businesses — handyman, cleaning, painting, screen repair — compete on speed. Customers call three competitors in ten minutes; slow sites, hidden phone numbers, and stale GBP profiles lose the visit before you quote.',
        'Screen Team demonstrates the residential growth stack at 36 pages — st OutreachEngine lane, quote-first CTAs, and Tampa Bay metro coverage for enclosure and screen repair.',
        'Faith Works and Knight Group round out the proof set at 82 and 97 pages respectively — wide geography vs handyman depth — all on the same OutreachEngine and Email-Agent infrastructure.'
      ]
    },
    deliverables: [
      { title: 'Conversion foundation', items: ['Fast hand-coded sites with prominent call and form CTAs', 'Service list and trust signals above the fold on mobile', 'Booking integration when estimate flow supports it', 'After-hours intake or auto-acknowledge paths'] },
      { title: 'Discovery & reputation', items: ['GBP cleanup and post cadence', 'Service-area pages for Tampa Bay metros', 'Review request systems at job completion', 'Schema for LocalBusiness and FAQ content'] },
      { title: 'Growth lanes', items: ['OutreachEngine for property managers and HOAs', 'Referral partner QR and /ref paths', 'Email-Agent follow-up routing', 'Light ops automation when volume justifies'] }
    ],
    connections: {
      kicker: 'Residential focus',
      title: 'Call-first vs contractor portal work',
      text: 'Home service lane emphasizes repeat residential and call-first conversion; contractor lane adds heavier portal and excavation footprints.',
      bullets: ['screen-enclosure-business-growth-systems for enclosure trades', 'handyman-business-growth-systems for estimate-first crews', 'local-visibility-systems for map-pack readiness', 'review-request-systems for reputation growth'],
      links: [['/screen-enclosure-business-growth-systems', 'Screen Enclosure Systems'], ['/excavation-business-growth-systems', 'Excavation Systems'], ['/electrician-business-growth-systems', 'Electrician Lane'], ['/painter-business-growth-systems', 'Painter Lane'], ['/local-visibility-systems', 'Local Visibility'], ['/case-study-screen-team', 'Screen Team Case Study']]
    },
    outcomes: [
      { title: 'Faster first response', text: 'Leads route into tracked queues — not voicemail black holes.' },
      { title: 'Map visibility', text: 'GBP and city pages aligned to how homeowners search by service and metro.' },
      { title: 'Repeat work growth', text: 'Review and referral systems capture customers who would otherwise forget your name.' },
      { title: 'Outbound optionality', text: 'Property manager outreach scales when referral-only lead flow plateaus.' }
    ],
    stats: ST_STATS
  },
  'performance-partner-program': {
    context: {
      title: 'Shared upside with written attribution rules',
      paragraphs: [
        'Monthly agency retainers rarely tie fees to measurable outcomes. Performance partnerships need a base fee for systems work, a 90-day measurement window, baseline captured before launch, and written scope on what counts as a attributable lead or booking.',
        'Partnership fit assumes tracking infrastructure exists or will be built — CRM outreach, analytics, referral attribution, and owner dashboards from the business-growth-systems lane.',
        TRIO_PROOF + ' Documented baselines on all three clients exemplify the measurement foundation performance terms require.'
      ]
    },
    deliverables: [
      { title: 'Partnership structure', items: ['Base monthly fee for systems and maintenance work', 'Performance component tied to agreed metrics', '90-day measurement window with frozen baseline', 'Minimum term, cancellation, and dispute terms in writing'] },
      { title: 'Attribution infrastructure', items: ['Call, form, booking, or revenue signal definitions', 'CRM and referral attribution wiring', 'Monthly owner dashboard with caps and failures', 'Knight Command-style visibility for queue review'] },
      { title: 'Reporting cadence', items: ['Monthly review with tracked outcomes', 'Prioritized next actions from ops data', 'Vanity metric exclusion from performance counts', 'Written changelog when scope or metrics adjust'] }
    ],
    connections: {
      kicker: 'Systems prerequisite',
      title: 'Performance requires measurable lanes',
      text: 'We do not offer performance-only deals on brochure sites without tracking — foundation and systems lanes deploy first or in parallel.',
      bullets: ['business-growth-systems as typical partnership stack', 'website-growth-audit for baseline documentation', 'referral-network-systems for partner attribution', 'crm-outreach-lead-generation for pipeline metrics'],
      links: [['/business-growth-systems', 'Growth Systems'], ['/website-growth-audit', 'Growth Audit'], ['/book-consultation', 'Book Consultation']]
    },
    outcomes: [
      { title: 'Aligned incentives', text: 'Both parties know what counts before work starts — reducing attribution fights later.' },
      { title: 'Defensible metrics', text: 'Leads and bookings tracked in systems — not guessed from analytics spikes.' },
      { title: 'Predictable base', text: 'Systems maintenance funded while performance component rewards shared upside.' },
      { title: 'Exit clarity', text: 'Cancellation and dispute process agreed upfront — not negotiated under pressure.' }
    ]
  },
  'ai-business-automation': {
    deliverablesIntro: 'Safe AI automation boundaries — routing, drafts, and rules engines your team will maintain.',
    outcomesIntro: 'Business process outcomes where AI assists and deterministic rules still own high-risk sends.',
    proofsIntro: 'Automation proof from Knight Command embeds and Social Poster runners — not chatbot demos.',
    proofGrid: [PROOF.knightCommand, PROOF.socialPoster],
    context: {
      title: 'Automation that matches daily ops — not demo chatbots',
      paragraphs: [
        'AI business automation for local companies means routing email, generating social drafts, triaging CRM replies, and connecting internal tools — not deploying a generic chatbot that nobody maintains.',
        'Knight Logics production lanes include Email-Agent on port 5100, Social Poster on 8501, OutreachEngine scheduler jobs, and Knight Command embeds that operators actually open during morning review.',
        'Automation scope stays lean: wire what your team will use weekly, document failure paths, and surface errors in Logs tabs instead of silent breakage.'
      ]
    },
    deliverables: [
      { title: 'Communication automation', items: ['Email-Agent multi-inbox routing with brand mapping', 'CRM reply triage into crm_reply views', 'Template-assisted outreach drafts with human send approval', 'Auto-acknowledge paths for after-hours form fills'] },
      { title: 'Content & social lanes', items: ['Social Poster queue with API and Playwright runners', 'GBP post scheduling aligned to campaigns', 'Failure reporting in Social Ops tabs', 'Per-brand credential isolation for KL/KG/ST'] },
      { title: 'Internal tool wiring', items: ['workflow-automation between existing SaaS and custom tools', 'api-integration-services for webhooks and data sync', 'business-dashboard-development for owner visibility', 'Documented port map and operator runbooks'] }
    ],
    connections: {
      kicker: 'Automation map',
      title: 'Sub-lanes cover specialized patterns',
      text: 'AI automation is the umbrella; email-agent, social-media, workflow, and API lanes scope individual deployments.',
      bullets: ['email-agent-automation for inbox routing depth', 'social-media-automation-systems for port 8501 runners', 'internal-business-tools for custom operator UIs', 'case-study-knight-command for embed architecture'],
      links: [['/email-agent-automation', 'Email-Agent'], ['/social-media-automation-systems', 'Social Automation'], ['/workflow-automation', 'Workflow Automation']]
    },
    outcomes: [
      { title: 'Visible failures', text: 'Broken automations surface same day in ops logs — not discovered when customers complain.' },
      { title: 'Human-in-the-loop', text: 'Outreach and social sends respect caps and approval where brand risk matters.' },
      { title: 'Less tab switching', text: 'Services embed in Knight Command instead of orphan localhost bookmarks.' },
      { title: 'Adoptable scope', text: 'Phased rollout so teams are not overwhelmed on day one.' }
    ]
  },
  'internal-business-tools': {
    context: {
      title: 'Operator UIs your team will actually open',
      paragraphs: [
        'Internal business tools are custom dashboards, intake forms, job trackers, and admin shells built for how your team sells and delivers — not off-the-shelf CRM features you never configure.',
        'Knight Command at /admin is the reference pattern: tabbed shell with embeds to referral dashboard, OutreachEngine, Email-Agent, and Social Poster on documented ports.',
        'Internal tools prioritize mobile-readable layouts, role gates, and modular upgrades so one service can deploy without rebuilding the entire admin.'
      ]
    },
    deliverables: [
      { title: 'Admin & dashboards', items: ['Authenticated /admin or operator entry paths', 'Tab or sidebar navigation to live service embeds', 'Mobile-readable queue and metric cards', 'Role-based access before embeds load'] },
      { title: 'Operational UIs', items: ['Job tracker and ticket intake interfaces', 'Partner and referral dashboard views', 'Content admin for non-developer staff', 'Failure and log aggregation tabs'] },
      { title: 'Integration layer', items: ['iframe or proxy embeds to Flask and Streamlit services', 'Webhook receivers for Stripe and portal events', 'api-integration-services for third-party sync', 'Documented port and service map for operators'] }
    ],
    connections: {
      kicker: 'Build patterns',
      title: 'Extends business-dashboard-development',
      text: 'Dashboard development scopes reporting; internal tools add interactive operator workflows and embed architecture.',
      bullets: ['business-dashboard-development for owner metrics', 'case-study-knight-command as shell reference', 'ticketing-invoicing for field job UIs', 'workflow-automation for background jobs behind UIs'],
      links: [['/business-dashboard-development', 'Dashboard Development'], ['/case-study-knight-command', 'Knight Command'], ['/api-integration-services', 'API Integrations']]
    },
    outcomes: [
      { title: 'Single login', text: 'Operators authenticate once to reach growth and ops tools.' },
      { title: 'Modular upgrades', text: 'New services slot into tabs without redesigning the entire admin.' },
      { title: 'Field usability', text: 'Job and ticket UIs work on phone browsers crews already carry.' },
      { title: 'Reduced shadow IT', text: 'Replace spreadsheets with tools wired to your actual data stores.' }
    ]
  },
  'api-integration-services': {
    context: {
      title: 'Webhooks and sync that survive production',
      paragraphs: [
        'API integration services connect Stripe, Neon Postgres, vendor portals, CRMs, and custom dashboards with webhook receivers, retry logic, and visible failure states — not one-off scripts that break silently.',
        'Referral network infrastructure depends on Stripe webhook settlement, Neon event logging, and /ref path routing. Ticketing lanes sync invoice paid status back to job records.',
        'Integrations are documented with operator runbooks so failures triage from Logs tabs instead of emergency developer calls.'
      ]
    },
    deliverables: [
      { title: 'Webhook infrastructure', items: ['Stripe payment and payout event receivers', 'Signed webhook validation and idempotency', 'Failure queue with retry and alert surfacing', 'Event log for audit and dispute resolution'] },
      { title: 'Data sync', items: ['Neon Postgres or SQLite event stores', 'CRM and form attribution piping', 'Portal ticket intake connectors', 'Third-party SaaS API clients with rate limit handling'] },
      { title: 'Operator visibility', items: ['Dashboard status for last successful sync', 'Knight Command Logs cross-reference', 'Written integration map per client', 'Staging validation before production cutover'] }
    ],
    connections: {
      kicker: 'Integration touchpoints',
      title: 'Powers referral, billing, and portal lanes',
      text: 'Most API work supports flagship lanes — referral payouts, Stripe invoices, and vendor portal intake.',
      bullets: ['referral-network-systems for Stripe + Neon pattern', 'stripe-invoice-automation for billing triggers', 'ticketing-invoicing for portal sync', 'case-study-referral-network-system as live reference'],
      links: [['/referral-network-systems', 'Referral Systems'], ['/stripe-invoice-automation', 'Stripe Automation'], ['/case-study-referral-network-system', 'Referral Case Study']]
    },
    outcomes: [
      { title: 'Reliable settlement', text: 'Referral payouts and invoice status sync without manual spreadsheet reconciliation.' },
      { title: 'Audit trail', text: 'Event logs support partner disputes and accounting review.' },
      { title: 'Faster triage', text: 'Failed webhooks visible in ops UI same day.' },
      { title: 'Portable patterns', text: 'Reusable integration templates across client deployments.' }
    ]
  },
  'workflow-automation': {
    deliverablesIntro: 'Business process automation triggers — form-to-CRM, review requests, and failure-visible jobs.',
    outcomesIntro: 'Cadence and monitoring results when background jobs replace spreadsheet reminders.',
    proofsIntro: 'Workflow proof from scheduler-backed CRM and Knight Command ops — concrete triggers, not vague RPA claims.',
    proofGrid: [PROOF.knightCommand, PROOF.crmOutreach],
    context: {
      title: 'Background jobs that respect caps and failures',
      paragraphs: [
        'Workflow automation connects scheduler jobs, email triggers, social posting windows, invoice milestones, and internal notifications — with daily caps, bounce rules, and failure reporting built in.',
        'Concrete triggers include form-to-CRM folder routing, job-complete → review-request sends, and stale-lead → follow-up jobs. OutreachEngine first_touch/followup and Social Poster windows exemplify production patterns already running.',
        'Automations fail visibly: Logs tabs and dashboard alerts replace silent breakage that leaves brand accounts quiet for days.'
      ]
    },
    deliverables: [
      { title: 'Scheduler & triggers', items: ['Cron or scheduler jobs with preview and cap enforcement', 'Status-change triggers for tickets and invoices', 'Follow-up cadence rules for outreach lanes', 'Posting window enforcement for social queues'] },
      { title: 'Notification paths', items: ['Email-Agent notifications on job or ticket changes', 'Operator alerts for failed runner executions', 'Optional SMS or webhook hooks to external systems', 'Digest summaries for weekly review'] },
      { title: 'Safety & governance', items: ['Daily send caps between 20 and 40 per brand', 'Bounce suppression before reputation damage', 'Idempotent webhook handling', 'Runbooks for pause and resume during incidents'] }
    ],
    connections: {
      kicker: 'Workflow map',
      title: 'Spans outreach, social, and billing',
      text: 'Workflow automation is the connective tissue between CRM, Email-Agent, Social Poster, and Stripe lanes.',
      bullets: ['crm-outreach-lead-generation for scheduler patterns', 'social-media-automation-systems for 8501 runners', 'stripe-invoice-automation for billing triggers', 'ai-business-automation as parent lane'],
      links: [['/crm-outreach-lead-generation', 'CRM Outreach'], ['/case-study-social-poster', 'Social Poster'], ['/workflow-automation', 'Automation Overview']]
    },
    outcomes: [
      { title: 'Consistent cadence', text: 'Follow-ups and posts fire on schedule — not when someone remembers.' },
      { title: 'Cap discipline', text: 'Send and post limits protect domain and account reputation.' },
      { title: 'Same-day failure visibility', text: 'Broken jobs surface in ops UI before customers notice gaps.' },
      { title: 'Composable workflows', text: 'New triggers added without rebuilding unrelated lanes.' }
    ]
  },
  'business-dashboard-development': {
    context: {
      title: 'Owner-readable metrics — not vanity traffic',
      paragraphs: [
        'Business dashboards for local operators need queue depth, lead sources, referral attribution, failed automations, and open jobs — readable on mobile during a morning coffee review.',
        'Knight Command Command Center tab orients operators to cross-system health; referral-dashboard and OutreachEngine provide lane-specific views embedded in one shell.',
        'Dashboards tie to real data stores — Neon Postgres events, OutreachEngine SQLite, Stripe webhooks — not exported CSVs refreshed manually.'
      ]
    },
    deliverables: [
      { title: 'Metric design', items: ['Lead source and conversion signal definitions', 'Queue depth and next-action cards', 'Referral earned vs paid summaries', 'Failed automation and bounce counters'] },
      { title: 'Dashboard UI', items: ['Mobile-first layout for owner review', 'Embeds inside Knight Command or standalone paths', 'Role gates for owner vs operator views', 'Monthly export or snapshot for partnerships'] },
      { title: 'Data plumbing', items: ['Queries against Neon, SQLite, or client DB', 'api-integration-services for external metrics', 'Performance-partner reporting cadence when applicable', 'Documentation of metric definitions'] }
    ],
    connections: {
      kicker: 'Visibility layer',
      title: 'Supports performance partnerships and daily ops',
      text: 'Dashboards make business-growth-systems and performance-partner-program measurable.',
      bullets: ['performance-partner-program for 90-day windows', 'case-study-knight-command for embed shell', 'referral-network-systems for partner metrics', 'crm-outreach-lead-generation for pipeline counts'],
      links: [['/performance-partner-program', 'Partner Program'], ['/case-study-knight-command', 'Knight Command'], ['/business-growth-systems', 'Growth Systems']]
    },
    outcomes: [
      { title: 'Morning clarity', text: 'Owners see what needs attention in under two minutes.' },
      { title: 'Partnership-ready', text: 'Baselines and monthly reports support performance fee terms.' },
      { title: 'Failure awareness', text: 'Bounce spikes and runner failures visible before weekly review.' },
      { title: 'Mobile adoption', text: 'Layouts designed for phone — not desktop-only BI tools.' }
    ]
  },
  'email-agent-automation': {
    deliverablesIntro: 'Multi-inbox routing deliverables — brand maps, view types, and provider wiring.',
    outcomesIntro: 'Business email ops outcomes when CRM replies and form leads stop living in personal Gmail.',
    proofsIntro: 'Email-Agent proof via the OutreachEngine reply loop and Knight Command embed.',
    proofGrid: [PROOF.crmOutreach, PROOF.knightCommand],
    context: {
      title: 'Multi-inbox routing with brand discipline',
      paragraphs: [
        'Email-Agent on port 5100 routes CRM outreach replies, Formspree lead routing, manual conversations, and brand-mapped inboxes for Knight Logics, Knight Group, Screen Team, and Faith Works — separate from personal Gmail chaos.',
        'Views differ by intent: crm_reply surfaces OutreachEngine responses; formspree_lead isolates website intake; manual threads stay operator-owned. Brand maps keep KL/KG/ST/FW credentials and templates isolated.',
        'Provider notes cover Gmail, Zoho, and Microsoft connections. Bounce signals loop back to OutreachEngine so bad addresses stop before the next send window. Email-Agent embeds in the Knight Command Email Agent tab.'
      ]
    },
    deliverables: [
      { title: 'Inbox wiring', items: ['Gmail, Zoho, or Microsoft inbox connections', 'Brand mapping for kl, kg, st, and faithworks lanes', 'crm_reply views separate from formspree_lead and manual mail', 'Thread tagging for lead-source attribution'] },
      { title: 'Routing rules', items: ['Outreach reply detection and queue surfacing', 'Formspree and website lead isolation', 'Auto-acknowledge templates for after-hours intake', 'Bounce and failure notifications to operators'] },
      { title: 'Operator embed', items: ['Knight Command Email Agent tab on port 5100', 'Mobile-readable reply triage layout', 'Integration with OutreachEngine campaign logging', 'Runbook for daily morning review'] }
    ],
    connections: {
      kicker: 'Reply loop',
      title: 'OutreachEngine sends → Email-Agent receives',
      text: 'CRM outreach case study documents the full send-and-reply loop in production — bounce signals return to the CRM before the next capped window.',
      bullets: ['crm-outreach-lead-generation for send configuration', 'case-study-crm-outreach-system for live workflow', 'Brand maps prevent cross-lane reply mixups', 'workflow-automation for notification triggers'],
      links: [['/crm-outreach-lead-generation', 'CRM Outreach'], ['/case-study-crm-outreach-system', 'CRM Case Study'], ['/case-study-knight-command', 'Knight Command']]
    },
    outcomes: [
      { title: 'Reply discipline', text: 'Outreach responses reviewed daily from dedicated views — not buried in personal inbox.' },
      { title: 'Brand separation', text: 'KG replies do not appear in KL or ST mapped views by accident.' },
      { title: 'Faster follow-up', text: 'Operators see unread crm_reply count without searching Gmail labels.' },
      { title: 'Audit trail', text: 'Campaign logging ties replies back to list and message variant.' }
    ]
  },
  'social-media-automation-systems': {
    deliverablesIntro: 'Social scheduling multi-brand deliverables — queues, API vs Playwright platforms, GBP posts.',
    outcomesIntro: 'Cadence and isolation results when runners fail loudly instead of going quiet for days.',
    proofsIntro: 'Social Poster proof on port 8501 — queue UI and brand isolation, not recycled website page counts.',
    proofGrid: [PROOF.socialPoster, PROOF.screenTeam],
    context: {
      title: 'Multi-brand queues with failure reporting',
      paragraphs: [
        'Social Poster on Streamlit port 8501 manages per-brand content queues, posting windows, API bridge for X and Facebook, GBP API posts, and Playwright runners for Nextdoor and LinkedIn.',
        'Pure API tools cannot post everywhere — Nextdoor and LinkedIn often need browser automation. Hybrid runners with visible failures replaced silent gaps that left accounts quiet for days.',
        'GBP local posts tie to site campaigns so map-pack messaging matches owned pages. Social Ops and Social Poster tabs in Knight Command embed the queue UI with Logs cross-reference when runners break.'
      ]
    },
    deliverables: [
      { title: 'Queue & scheduling', items: ['Per-brand isolated queues for KL, KG, ST', 'Posting window enforcement by platform', 'Content preview before scheduled send', 'Failure counters per platform and brand'] },
      { title: 'Runner infrastructure', items: ['X and Facebook API clients where stable', 'Playwright workers for Nextdoor and LinkedIn', 'GBP API integration for local post cadence', 'Credential vault per company brand'] },
      { title: 'Operator experience', items: ['Streamlit dashboard on port 8501', 'Knight Command Social Poster tab embed', 'Last success timestamp per platform', 'Logs integration for failure triage'] }
    ],
    connections: {
      kicker: 'Local + social',
      title: 'GBP posts align with local-visibility strategy',
      text: 'Social automation complements local SEO — scheduled GBP posts match website campaigns.',
      bullets: ['local-visibility-systems for discovery foundation', 'case-study-social-poster documents port 8501 workflow', 'case-study-knight-command for embed pattern', 'ai-business-automation as parent lane'],
      links: [['/case-study-social-poster', 'Social Poster Case Study'], ['/local-visibility-systems', 'Local Visibility'], ['/case-study-knight-command', 'Knight Command']]
    },
    outcomes: [
      { title: 'Reliable cadence', text: 'Scheduled posts fire with fewer surprise multi-day gaps.' },
      { title: 'Wrong-account prevention', text: 'Brand isolation stops KG content posting to ST credentials.' },
      { title: 'Same-day failure visibility', text: 'Broken runners surface in UI — not discovered during weekly audit.' },
      { title: 'GBP consistency', text: 'Profile posts align with owned-site promotions.' }
    ]
  },
  'handyman-business-growth-systems': {
    context: {
      title: 'Handyman network anchor — Knight Group benchmark',
      paragraphs: [
        'This trade lane recruits handyman and general repair partners into the Knight Logics growth stack — Knight Group is the live reference build, not a template for your brand.',
        'Estimate-first handyman companies need fast sites, booking paths, property manager outreach, and optional job records — built around how small crews actually sell in Tampa Bay.',
        'Knight Group runs 97 indexable pages per knightgroup.com/sitemap.xml — 36 service silos, 30+ city pages across Pinellas, Hillsborough, and Pasco, 8 project galleries — with Lighthouse 96/100/100 and /booking estimate surface.',
        'KG runs as the kg brand lane in OutreachEngine with separate templates and caps from Knight Logics and Screen Team. One targeted campaign produced substantial booked work.'
      ],
      note: 'Page count scales to your services and metros — 97 pages is the live benchmark, not a minimum package.'
    },
    deliverables: [
      { title: 'Site & local SEO', items: ['Service silo pages for distinct repair intents', 'City handyman pages across your service radius', 'LocalBusiness, FAQ, and BreadcrumbList schema', 'Lighthouse-first hand-coded HTML on GitHub Pages'] },
      { title: 'Conversion paths', items: ['/booking estimate-first surface aligned to GBP sitelinks', 'Call-first CTAs above the fold on mobile', 'Project galleries for trust and proof', 'Separate business phone and email routing'] },
      { title: 'Growth lanes', items: ['kg OutreachEngine campaigns for property managers and HOAs', 'Email-Agent crm_reply routing for outreach responses', 'Review request timing at job completion', 'Optional ticket and invoice ops for portal work'] }
    ],
    connections: {
      kicker: 'Live benchmark',
      title: 'Knight Group architecture at full scale',
      text: 'Handyman sub-page scopes estimate-first patterns documented on the live Knight Group deployment.',
      bullets: [`${KG.breakdown.servicePages} /Services/ pages for repair intents`, `${KG.breakdown.cityPages}+ city pages — ${KG.geography}`, KG.outreachNote, 'contractor-growth-systems parent for multi-trade context'],
      links: [['/case-study-knight-group', 'Knight Group Case Study'], ['/crm-outreach-lead-generation', 'CRM Outreach'], ['/contractor-growth-systems', 'Contractor Systems']]
    },
    outcomes: [
      { title: 'Search coverage', text: '97-page architecture matches how homeowners search by service and city.' },
      { title: 'Booking intent', text: 'Estimate surface captures sitelink and GBP action traffic.' },
      { title: 'Outbound pipeline', text: 'Property manager outreach on production OutreachEngine — not manual Gmail blasts.' },
      { title: 'Technical proof', text: 'Lighthouse 96 performance with validated Rich Results schema.' }
    ],
    stats: KG_STATS
  },
  'electrician-business-growth-systems': {
    context: {
      title: 'Open electrician lane — recruit into the network',
      paragraphs: [
        'Electrical contractors need a credible owned presence before complementary trades will send attributed referral work. Thin templates and missing service pages lose map-pack clicks to competitors with clearer residential and commercial offers.',
        'Farrell Electric documents the starter launch pattern — multi-page site, essential SEO, and contact conversion — as the first case study in the open electrician lane.',
        'Joining the lane means your brand domain, outreach caps, /ref/:partner paths, and a knightlogics.com proof page when launch is ready — alongside handyman, HVAC, and GC partners in the Tampa Bay roster.'
      ]
    },
    deliverables: [
      { title: 'Site & conversion', items: ['Residential and commercial service silos', 'Emergency and estimate CTAs above the fold', 'Trust signals — license, insurance, service area', 'Analytics and Search Console baseline'] },
      { title: 'Local discovery', items: ['GBP categories aligned to website services', 'Service-area pages for metros you mobilize to', 'LocalBusiness and FAQ schema', 'Map-pack messaging consistency'] },
      { title: 'Network onboarding', items: ['Referral slot with tracked /ref/:partner paths', 'QR brochure paths for complementary trades', 'Optional OutreachEngine for builder and PM lists', 'Case study publish when you approve marketing'] }
    ],
    connections: {
      kicker: 'Open lane',
      title: 'Farrell Electric starter reference',
      text: 'First electrician case study in the recruitment lane — not a client microsite; your build becomes the next proof.',
      bullets: ['case-study-farrell-electric for launch detail', 'contractor-growth-systems parent hub', 'referral-network-systems for attribution stack', 'handyman-business-growth-systems for complementary referrals'],
      links: [['/case-study-farrell-electric', 'Farrell Electric Case Study'], ['/referral-network-systems', 'Referral Network'], ['/contractor-growth-systems', 'Contractor Systems']]
    },
    outcomes: [
      { title: 'Credible referrals', text: 'Partners send work when your site proves service scope and contact paths.' },
      { title: 'Search foundation', text: 'Schema and GSC baseline before scaling city or service depth.' },
      { title: 'Attributed network', text: '/ref paths document complementary trade sources — not verbal handoffs.' },
      { title: 'Scalable outreach', text: 'OutreachEngine lanes when builder and PM lists justify outbound.' }
    ]
  },
  'painter-business-growth-systems': {
    context: {
      title: 'Open painting lane — search-ready recruitment',
      paragraphs: [
        'Painting companies compete on portfolio clarity and service intent — interior, exterior, cabinet, and commercial jobs rank differently. One generic page cannot capture how homeowners and remodelers search.',
        "Sal's Painting demonstrates the search-ready starter — analytics, schema, brand package, and gallery structure — as the reference for new painting partners.",
        'The painting lane plugs into handyman, drywall, and remodeling referrals with tracked attribution when you join the Tampa Bay partner roster.'
      ]
    },
    deliverables: [
      { title: 'Site & portfolio', items: ['Gallery and before/after proof', 'Service silos per paint intent', 'Estimate and call CTAs on mobile', 'Brand-aligned hero and trust pages'] },
      { title: 'Search-ready stack', items: ['GA4, Clarity, and GSC from launch', 'LocalBusiness and FAQ schema', 'GBP alignment with website services', 'City pages when metros justify depth'] },
      { title: 'Network & reputation', items: ['Referral /ref/:partner onboarding', 'Review request timing at job completion', 'Case study on knightlogics.com when ready', 'Cross-trade QR paths with handyman partners'] }
    ],
    connections: {
      kicker: 'Open lane',
      title: "Sal's Painting search-ready reference",
      text: 'Starter painter launch pattern for the recruitment lane — your brand gets its own slot and proof page.',
      bullets: ['case-study-sals-painting for launch detail', 'home-service-business-growth-systems parent', 'handyman-business-growth-systems for complementary referrals', 'referral-network-systems for attribution'],
      links: [['/case-study-sals-painting', "Sal's Painting Case Study"], ['/home-service-business-growth-systems', 'Home Service Systems'], ['/referral-network-systems', 'Referral Network']]
    },
    outcomes: [
      { title: 'Intent-matched pages', text: 'Distinct silos capture interior vs exterior vs specialty searches.' },
      { title: 'Measurable launch', text: 'Analytics baseline before scaling ads or outreach.' },
      { title: 'Referral-ready', text: 'Remodelers and handymen send work when your site proves capability.' },
      { title: 'Reputation growth', text: 'Review lane ties to job completion when volume justifies.' }
    ]
  },
  'roofing-business-growth-systems': {
    context: {
      title: 'Storm-season trust before the rush',
      kicker: 'Roofing lane',
      media: videos.roofMonsters,
      paragraphs: [
        'Roofing sells on trust, geography, and speed when storms hit Tampa Bay. Homeowners compare three local options on a phone while water is still on the ceiling — thin proof, missing city pages, or a slow estimate path costs the job before your crew can quote.',
        'Roof Monsters on roofmonsters.co is the live reference for this lane: hand-coded service and location depth, gallery proof, estimate-first CTAs, schema, Search Console launch, and audit-backed technical scores (Lighthouse 97, Semrush 99%, Ahrefs 100, 79 GSC-discovered pages).',
        'The public positioning stays honest to how referral-driven roofers actually win work — clear written estimates, licensed and insured operations, warranty language, and storm response framed as private-pay emergency help rather than insurance-claim marketing.',
        'Email-Agent routing is live for info@roofmonsters.co so estimate traffic has an ops path. OutreachEngine stays optional and brand-isolated until cold outreach is explicitly enabled — the same discipline used across kg, st, and faithworks lanes.',
        'Joining the roofing trade lane means your brand domain, local SEO architecture, estimate intake, and a knightlogics.com proof page when launch is ready — plus complementary referrals from screen enclosure, handyman, and excavation partners in the Tampa Bay roster.'
      ]
    },
    deliverables: [
      {
        title: 'Trust & content',
        items: [
          'Project proof and service definitions for repairs, installs, inspections, and storm response',
          'Insurance-adjacent FAQ content homeowners expect — without claim-chasing spam',
          'Estimate request forms and click-to-call above the fold on mobile',
          'Schema for LocalBusiness, FAQ, BreadcrumbList, and Organization'
        ]
      },
      {
        title: 'Geography',
        items: [
          'City and service-area pages for storm-season metros you actually serve',
          'Internal linking between service hubs and local pages for crawl depth',
          'Google Business Profile alignment with website messaging and services',
          'service-area-page-strategy patterns for expansion without doorway pages'
        ]
      },
      {
        title: 'Lead systems',
        items: [
          'CRM-ready form intake rules and Email-Agent mailbox routing',
          'Optional OutreachEngine for property manager and B2B lists with daily caps',
          'Referral partner QR paths and /ref/:partner attribution',
          'review-request-systems timing after job completion when volume justifies'
        ]
      }
    ],
    connections: {
      kicker: 'Roofing lane',
      title: 'Roofing vertical — Roof Monsters live',
      text: 'Official roofing lane reference: live site on roofmonsters.co, published case study, and growth-system playbook for storm-season contractors who need trust pages, local SEO, and estimate-first conversion — not another template rebuild.',
      bullets: [
        'case-study-roof-monsters for the live build and re-testable audit scores',
        'contractor-growth-systems parent lane for trade network context',
        'local-visibility-systems for map-pack, schema, and GBP readiness',
        'crm-outreach-lead-generation when outbound is explicitly enabled'
      ],
      links: [
        ['/case-study-roof-monsters', 'Roof Monsters Case Study'],
        ['/contractor-growth-systems', 'Contractor Systems'],
        ['/local-visibility-systems', 'Local Visibility']
      ]
    },
    outcomes: [
      {
        title: 'Pre-storm credibility',
        text: 'Trust pages, FAQs, and project proof are indexed before ad spend and storm-season search spikes — so traffic lands on pages that can convert.'
      },
      {
        title: 'Geo-qualified leads',
        text: 'City and service-area pages reduce out-of-area estimate requests and match how homeowners search by metro plus roofing intent.'
      },
      {
        title: 'Tracked estimates',
        text: 'Form fills and calls route into Email-Agent and CRM-ready queues instead of unmanaged voicemail during the first tropical wave.'
      },
      {
        title: 'Partner attribution',
        text: 'Referral paths document complementary trade sources so screen, handyman, and excavation partners can send work without spreadsheet disputes.'
      }
    ],
    stats: [
      { value: '97', label: 'Lighthouse performance — RM' },
      { value: '79', label: 'GSC discovered pages — RM' },
      { value: '99%', label: 'Semrush site health — RM' }
    ],
    proofGrid: [PROOF.roofMonsters, PROOF.roofMonstersAudit, PROOF.roofMonstersProject]
  },
  'screen-enclosure-business-growth-systems': {
    context: {
      title: 'Quote-first trade needs city and pool-type depth',
      paragraphs: [
        'Screen enclosure and pool cage companies compete on local search by city and pool type — customers compare three Tampa Bay vendors with clearer service pages winning the quote request.',
        'Screen Team demonstrates deep service and city page architecture for pool enclosure quotes — the live contractor local SEO reference in this vertical.',
        'Screen Team proves enclosure-specific geography and proof at 36 pages with st lane outreach; Faith Works covers wide Central Florida footprint at 82 pages; Knight Group patterns apply when complementary handyman work is in scope.'
      ]
    },
    deliverables: [
      { title: 'Service depth', items: ['Pool cage, screen room, and repair service silos', 'Photo proof and project galleries', 'Quote form and call CTAs tuned to enclosure sales', 'FAQ content for permit and HOA questions'] },
      { title: 'Geography', items: ['City pages across Tampa Bay metros', 'Hub pages linking services to areas served', 'GBP services aligned to website silos', 'Internal linking for crawl depth'] },
      { title: 'Lead & growth', items: ['CRM intake for quote requests', 'OutreachEngine for builder and realtor lists', 'Referral QR for complementary trades', 'Social Poster for project showcases'] }
    ],
    connections: {
      kicker: 'Live proof',
      title: 'Screen Team case study',
      text: 'Screen Team LLC site is the enclosure trade benchmark for local SEO depth and conversion clarity.',
      bullets: ['case-study-screen-team for live client proof', 'case-study-faith-works for wide geography reference', 'contractor-growth-systems parent', 'local-visibility-systems for schema and GBP'],
      links: [['/case-study-screen-team', 'Screen Team Case Study'], ['/contractor-growth-systems', 'Contractor Systems'], ['/local-visibility-systems', 'Local Visibility']]
    },
    outcomes: [
      { title: 'Quote volume quality', text: 'Clear pool-type pages attract qualified quote requests.' },
      { title: 'Metro coverage', text: 'City pages match how enclosure customers search.' },
      { title: 'Visual proof', text: 'Galleries support premium quote positioning.' },
      { title: 'B2B outreach option', text: 'Builder and realtor lists on OutreachEngine when referrals plateau.' }
    ]
  },
  'excavation-business-growth-systems': {
    context: {
      title: 'Heavy trades need proof, geography, and project scale',
      paragraphs: [
        'Excavation and site work companies sell on equipment capability, service radius, and project proof — not generic contractor templates with stock photos.',
        'Local SEO architecture covers service silos for grading, trenching, and site prep plus city pages across the metros your crews actually mobilize to.',
        'Faith Works and JNS patterns inform outdoor and construction trades; excavation scope adds project-scale proof and longer sales cycles.'
      ]
    },
    deliverables: [
      { title: 'Trade positioning', items: ['Equipment and capability service pages', 'Project photo proof and case highlights', 'Estimate and bid request forms', 'Insurance and licensing trust signals'] },
      { title: 'Geography', items: ['City and county coverage pages', 'service-area-page-strategy for rural vs urban radius', 'GBP categories aligned to excavation services', 'Schema for LocalBusiness'] },
      { title: 'Lead & ops', items: ['CRM intake for bid requests', 'Referral paths from builders and contractors', 'Optional job photo documentation', 'OutreachEngine for commercial prospect lists'] }
    ],
    connections: {
      kicker: 'Construction lane',
      title: 'Under contractor-growth-systems umbrella',
      text: 'Excavation sub-page scopes heavy trade patterns; JNS and Faith Works provide adjacent construction references.',
      bullets: ['contractor-growth-systems parent', 'service-area-page-strategy for wide-radius trades', 'case-study-jns for contractor bundle', 'local-visibility-systems for discovery'],
      links: [['/contractor-growth-systems', 'Contractor Systems'], ['/service-area-page-strategy', 'Service Area Strategy'], ['/case-study-jns', 'JNS Case Study']]
    },
    outcomes: [
      { title: 'Capability clarity', text: 'Owners see equipment and service scope before calling — reducing unqualified bids.' },
      { title: 'Radius honesty', text: 'Geography pages match mobilization reality — not national template claims.' },
      { title: 'Commercial pipeline', text: 'B2B outreach lists for builders and developers when ready.' },
      { title: 'Project proof', text: 'Photo galleries support higher-ticket estimate conversations.' }
    ]
  },
  'restaurant-bar-growth-systems': {
    context: {
      title: 'Hospitality needs owned-domain events and ordering',
      paragraphs: [
        'Restaurants and bars outgrow social-only event promotion when menus, hours, and specials change weekly. Staff need admin-editable content without developer tickets for every special.',
        'The hospitality lane covers events calendar UX, weekly hours with GBP alignment, admin menu patterns, Stripe-ready pickup flows, and local discovery schema — the same infrastructure we deploy once a venue is ready to launch.',
        'Hand-coded mobile performance matters during Friday night traffic — page builders that lag cost orders.'
      ]
    },
    deliverables: [
      { title: 'Hospitality web', items: ['Admin-editable menus and events', 'Mobile-first layout for on-the-go customers', 'Hours, location, and reservation CTAs', 'LocalBusiness and Event schema'] },
      { title: 'Ordering readiness', items: ['Stripe-ready checkout patterns', 'Pickup flow scoping with kitchen ops', 'online-ordering-systems architecture hooks', 'POS integration documentation for future'] },
      { title: 'Local discovery', items: ['GBP post cadence with Social Poster', 'Review request timing post-visit', 'local-visibility-systems alignment', 'Launch checklist before public marketing'] }
    ],
    connections: {
      kicker: 'Related services',
      title: 'Ordering, visibility, and reputation',
      text: 'Restaurant sites launch as one lane — events and menus on the site, checkout when kitchen ops justify it, GBP and reviews aligned at go-live.',
      bullets: ['online-ordering-systems for checkout depth', 'review-request-systems for reputation', 'social-media-automation for event promotion', 'local-visibility-systems for map discovery'],
      links: [['/online-ordering-systems', 'Ordering Systems'], ['/local-visibility-systems', 'Local Visibility'], ['/case-study-hospitality-system-pattern', 'Capability Breakdown']]
    },
    outcomes: [
      { title: 'Staff autonomy', text: 'Menu and event updates without waiting on agency turnaround.' },
      { title: 'Owned discovery', text: 'Events live on brand domain — not only ephemeral social posts.' },
      { title: 'Order-ready path', text: 'Architecture supports checkout when kitchen volume justifies.' },
      { title: 'GBP coherence', text: 'Hours and specials match website before launch marketing.' }
    ]
  },
  'starting-a-new-business': {
    stats: [
      { value: 'Foundation', label: 'Registration, email, phone & cards first' },
      { value: 'Discovery', label: 'GBP + website with SEO / GEO / AEO audits' },
      { value: 'Growth', label: 'Optional signs, then full growth systems' }
    ],
    deliverablesIntro: 'What a real new-business launch includes — foundation first, then discovery, optional field brand, and growth systems.',
    deliverablesAlign: 'center',
    outcomes: [],
    outcomesIntro: '',
    proofsIntro: 'Live sites across package levels — full growth systems and focused launches — so you can see what this path can grow into.',
    proofGrid: [
      PROOF.kg,
      PROOF.faithWorks,
      PROOF.screenTeam,
      PROOF.roofMonsters,
      PROOF.farrellElectric,
      PROOF.salsPainting,
      PROOF.jns,
      PROOF.hospitalityPattern
    ],
    proof: null,
    idealFor: [],
    context: {
      title: 'How we help you start a new business',
      paragraphs: [
        'We start with the business itself: registration and insurance footing, business email, business phone, and cards — so every public surface quotes real company contacts.',
        'Next comes Google Business Profile and the website, with audit processes for indexability, SEO, GEO, and AEO — not just a publish button. Optional yard signs, banners, and vehicle decals can follow. Growth systems (CRM, social, field ops, reviews) come after that foundation is solid.'
      ]
    },
    deliverables: [
      { title: 'Business foundation', items: ['Registration / entity clarity', 'Insurance readiness where your trade requires it', 'Business email on your domain', 'Business phone line', 'Business cards and basic brand mark'] },
      { title: 'GBP, website & audits', items: ['Google Business Profile claim / verify with matching NAP', 'Website package from Preview through Local Launch / Growth System', 'Website Audit gate before public go-live', 'Indexability plus SEO, GEO, and AEO readiness'] },
      { title: 'Optional brand + growth systems', items: ['Yard signs, banners, and vehicle decals as needed', 'CRM outreach and lead generation', 'Social posting and automation', 'Ticketing, invoicing, field ops, and review requests'] }
    ],
    connections: {
      kicker: 'What we offer',
      title: 'After the foundation — growth systems that match the live network',
      text: 'Once registration, contacts, GBP, and the website are solid, these product lanes are how Knight Group, Faith Works, Screen Team, and Roof Monsters keep growing.',
      align: 'center',
      bullets: [
        'CRM outreach and lead generation (OutreachEngine)',
        'Social media posting and automation',
        'Ticketing, invoicing, and job / field workflows',
        'Review request systems and local visibility'
      ],
      links: [
        ['/crm-outreach-lead-generation', 'CRM Outreach & Lead Generation'],
        ['/social-media-automation-systems', 'Social Media Automation'],
        ['/ticketing-invoicing-job-workflows', 'Ticketing & Job Workflows'],
        ['/review-request-systems', 'Review Request Systems'],
        ['/business-growth-systems', 'All Business Growth Systems'],
        ['/book-consultation', 'Book Consultation']
      ]
    }
  },
  'stripe-invoice-automation': {
    deliverablesIntro: 'Invoice automation scoped to job milestones — triggers, webhooks, and paid-status sync.',
    outcomesIntro: 'Cash-collection outcomes when billing fires at closeout instead of days later.',
    proofsIntro: 'Stripe invoice proof from the Vendoroo ticket-to-invoice pattern — not website SEO stats.',
    proofGrid: [PROOF.vendoroo, PROOF.jns],
    context: {
      title: 'Invoice triggers tied to job milestones',
      paragraphs: [
        'Stripe invoice automation connects completed job status, ticket closeout, or portal milestones to payment link or invoice draft creation — with paid status syncing back to the job record.',
        'Vendoroo-style active build uses this pattern: field completion triggers billing; webhook updates job screen when customer pays.',
        'api-integration-services provides webhook receivers with retry logic and visible failures — not one-off scripts.'
      ]
    },
    deliverables: [
      { title: 'Billing triggers', items: ['Completion status → invoice or payment link rules', 'Line item templates from job record fields', 'Customer email delivery via Stripe', 'Draft vs auto-send configuration per client'] },
      { title: 'Status sync', items: ['Stripe webhook paid event → job record update', 'Failed payment visibility on owner dashboard', 'Idempotent webhook handling', 'Audit log for accounting review'] },
      { title: 'Integration scope', items: ['ticketing-invoicing-job-workflows as parent lane', 'job-photo-pdf-reports before invoice send', 'Optional Email-Agent notify on invoice sent', 'Multi-job batch billing rules when needed'] }
    ],
    connections: {
      kicker: 'Billing lane',
      title: 'Part of ticket-to-invoice path',
      text: 'Stripe automation rarely stands alone — it closes the loop on field ops workflows.',
      bullets: ['ticketing-invoicing-job-workflows flagship', 'case-study-vendoroo-ticket-invoice-system reference', 'api-integration-services for webhooks', 'business-dashboard-development for open vs paid view'],
      links: [['/ticketing-invoicing-job-workflows', 'Job Workflows'], ['/case-study-vendoroo-ticket-invoice-system', 'Vendoroo Case Study'], ['/api-integration-services', 'API Integrations']]
    },
    outcomes: [
      { title: 'Faster cash collection', text: 'Invoices generate at closeout — not days later from manual entry.' },
      { title: 'Single job truth', text: 'Payment status visible on job screen alongside photos and notes.' },
      { title: 'Fewer billing errors', text: 'Line items pull from job record — not retyped from portal PDFs.' },
      { title: 'Webhook reliability', text: 'Paid events sync with retry and operator-visible failures.' }
    ]
  },
  'job-photo-pdf-reports': {
    deliverablesIntro: 'Field photo and PDF packet deliverables — capture rules, branded layouts, portal exports.',
    outcomesIntro: 'Proof outcomes property managers accept before invoice send.',
    proofsIntro: 'Photo/PDF proof from portal vendor closeout — distinct from outreach or referral grids.',
    proofGrid: [PROOF.vendoroo, PROOF.jns],
    context: {
      title: 'Completion proof property managers accept',
      paragraphs: [
        'Job photo PDF reports package field photos, notes, and branded headers into completion packets formatted for vendor portal upload — replacing manual rebuilds in Word or Canva after every job.',
        'Photos attach to job ID during mobile closeout — not scattered across crew camera rolls. PDF generation runs server-side with consistent layout per property manager requirements.',
        'Pairs with ticketing-invoicing-job-workflows and stripe-invoice-automation for full portal vendor closeout.'
      ]
    },
    deliverables: [
      { title: 'Field capture', items: ['Mobile browser photo upload per job ID', 'Required photo steps before status closeout', 'Caption and note fields tied to images', 'Offline-tolerant upload retry when signal returns'] },
      { title: 'PDF generation', items: ['Branded header and footer templates', 'Multi-photo layout per manager format', 'Auto-include job metadata and timestamps', 'Download and email delivery options'] },
      { title: 'Portal workflow', items: ['Export structured for vendor portal upload', 'Link PDF to Stripe invoice trigger', 'Owner dashboard for missing-proof jobs', 'case-study-vendoroo patterns as reference'] }
    ],
    connections: {
      kicker: 'Proof layer',
      title: 'Between field work and billing',
      text: 'PDF reports sit between mobile job updates and invoice send — office reviews proof before billing.',
      bullets: ['ticketing-invoicing-job-workflows parent', 'stripe-invoice-automation after proof approval', 'contractor-growth-systems for trades adding ops', 'case-study-vendoroo-ticket-invoice-system'],
      links: [['/ticketing-invoicing-job-workflows', 'Job Workflows'], ['/stripe-invoice-automation', 'Stripe Automation'], ['/case-study-vendoroo-ticket-invoice-system', 'Vendoroo Case Study']]
    },
    outcomes: [
      { title: 'Fewer portal rejections', text: 'Consistent PDF format matches manager upload requirements.' },
      { title: 'Proof before billing', text: 'Office sees photos before invoice goes out.' },
      { title: 'Crew discipline', text: 'Required capture step prevents forgotten camera roll hunts.' },
      { title: 'Audit trail', text: 'Timestamped proof attached to job record permanently.' }
    ]
  },
  'review-request-systems': {
    deliverablesIntro: 'Review-request automation — completion triggers, GBP links, throttle rules.',
    outcomesIntro: 'Reputation velocity outcomes timed to finished jobs, not calendar reminders.',
    proofsIntro: 'Review-system proof from enclosure and roofing GBP lanes — timing tied to completed work.',
    proofGrid: [PROOF.screenTeam, PROOF.roofMonsters],
    context: {
      title: 'Reviews asked at the right moment',
      paragraphs: [
        'Review request systems trigger SMS or email asks at job completion — when customer satisfaction is highest — instead of hoping someone remembers to mention Google weeks later.',
        'Timing integrates with job workflow status changes or manual owner trigger. Links route to Google Business Profile review flow with UTM or tracking where useful.',
        'Local visibility improves when review velocity matches real completed work — Screen Team enclosure jobs and Roof Monsters roofing closeouts exemplify reputation tied to geography strategy.'
      ]
    },
    deliverables: [
      { title: 'Request automation', items: ['Trigger on job completion or invoice paid', 'SMS or email templates with GBP review link', 'Throttle rules to avoid duplicate asks', 'Opt-out handling for compliance'] },
      { title: 'Reputation ops', items: ['Review velocity tracking vs job volume', 'GBP post cadence alignment', 'Negative review alert routing to owner', 'Monthly reputation summary on dashboard'] },
      { title: 'Integration', items: ['workflow-automation for trigger jobs', 'ticketing-invoicing status hooks', 'local-visibility-systems for GBP foundation', 'handyman and home-service launch patterns'] }
    ],
    connections: {
      kicker: 'Reputation loop',
      title: 'Closes the local visibility stack',
      text: 'Reviews amplify city pages and GBP work from local-visibility-systems.',
      bullets: ['local-visibility-systems for schema and GBP', 'home-service-business-growth-systems for residential trades', 'workflow-automation for send timing', 'Screen Team and Faith Works GBP alignment as references'],
      links: [['/local-visibility-systems', 'Local Visibility'], ['/home-service-business-growth-systems', 'Home Service Systems'], ['/workflow-automation', 'Workflow Automation']]
    },
    outcomes: [
      { title: 'Higher review velocity', text: 'Asks fire at job completion — not random calendar reminders.' },
      { title: 'Map-pack support', text: 'Review count grows alongside geography pages.' },
      { title: 'Owner awareness', text: 'Alerts on new reviews without daily GBP manual checks.' },
      { title: 'Compliance-safe', text: 'Throttle and opt-out rules prevent spam perception.' }
    ]
  },
  'service-area-page-strategy': {
    deliverablesIntro: 'Service-area architecture deliverables — hubs, city pages, and internal linking by crew radius.',
    outcomesIntro: 'Geography outcomes when city pages match real travel distance, not doorway spam.',
    proofsIntro: 'Service-area proof from land-clearing and enclosure footprints — page counts tied to this strategy page only.',
    proofGrid: [PROOF.faithWorks, PROOF.screenTeam],
    context: {
      title: 'Hub and city architecture that matches crew radius',
      paragraphs: [
        'Service-area page strategy documents how hub pages, city landing pages, and service silos link together — scaled to how far crews actually travel, not national template city spam.',
        'Faith Works deploys 82 land-clearing pages across Polk County and Central Florida. Screen Team covers Tampa Bay enclosure metros at 36 pages. Knight Group adds 30+ handyman city pages across Pinellas, Hillsborough, and Pasco when the trade is repair-first.',
        'Excavation and roofing trades adapt radius and content depth accordingly — the architecture is the product, not a recycled proof paragraph on every growth URL.'
      ]
    },
    deliverables: [
      { title: 'Architecture planning', items: ['Hub page vs city page hierarchy', 'Service silo internal linking map', 'Cannibalization review between overlapping geos', 'Sitemap and indexation strategy'] },
      { title: 'Content templates', items: ['City page copy framework with local proof', 'Service × city matrix scoping', 'FAQ blocks per metro where relevant', 'Schema BreadcrumbList and LocalBusiness per page'] },
      { title: 'Expansion playbook', items: ['Priority metro rollout order', 'GBP service area alignment', 'Review and gallery content per region', 'Monthly indexation and ranking check'] }
    ],
    connections: {
      kicker: 'SEO depth',
      title: 'Foundation for local-visibility-systems',
      text: 'Strategy doc precedes build — audit identifies geography gaps before page production.',
      bullets: ['local-visibility-systems for full discovery lane', 'Faith Works 82-page footprint for wide geography', 'Screen Team 36-page metro depth', 'Knight Group 97-page handyman reference'],
      links: [['/local-visibility-systems', 'Local Visibility'], ['/case-study-faith-works', 'Faith Works Case Study'], ['/case-study-screen-team', 'Screen Team Example']]
    },
    outcomes: [
      { title: 'Honest geography', text: 'Pages match crew mobilization — reducing wasted estimate trips.' },
      { title: 'Crawl efficiency', text: 'Internal linking distributes authority to city intents.' },
      { title: 'Scalable rollout', text: 'Template framework adds metros without reinventing IA.' },
      { title: 'Indexation clarity', text: '97-page benchmark shows what full trade coverage looks like at scale.' }
    ]
  },
  'case-study-knight-command': {
    context: {
      title: 'One shell for daily growth operations',
      kicker: 'Ops hub',
      media: images.caseStudyKnightCommand,
      paragraphs: [
        'Knight Command at /admin consolidates tabs for Command Center, Referrals, Outreach CRM, Email Agent, Social Ops, Social Poster, and Logs — each embedding live services on ports 5050, 5100, 8500, and 8501.',
        'Before the shell, operators juggled orphan localhost URLs for referral dashboard, OutreachEngine, Email-Agent, and Social Poster — context switching slowed outreach review and failure triage.',
        'Modular tab architecture lets individual services upgrade without rebuilding the entire admin — new lanes slot in instead of requiring bookmark updates across the team.',
        'If you want an owner dashboard that feels like one product instead of a bookmark folder of tools, this is the pattern: authenticated shell, tab embeds, shared logs, and a documented port map your team can actually onboard to.'
      ]
    },
    walkthrough: {
      title: 'Ops shell walkthrough &amp; proof',
      intro: 'One admin surface for the growth stack — Command shell plus the CRM, referral, and social UIs it embeds every morning.',
      primary: { ...images.caseStudyKnightCommand, title: 'Knight Command admin shell' },
      proofs: [
        { src: images.caseStudyCrm.src, alt: images.caseStudyCrm.alt, caption: 'Outreach CRM tab — queue preview and brand lanes without leaving /admin.', width: 1200, height: 675 },
        { src: images.caseStudyReferral.src, alt: images.caseStudyReferral.alt, caption: 'Referrals tab — partner attribution and payout visibility in the same shell.', width: 1200, height: 675 }
      ],
      audits: [
        { src: images.caseStudySocial.src, alt: images.caseStudySocial.alt, title: 'Social Poster embed', text: 'Streamlit 8501 queue and runner status inside Social Poster / Social Ops tabs.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Plan a similar ops shell',
      ctaSecondaryHref: '/business-dashboard-development',
      ctaSecondaryLabel: 'Dashboard development'
    },
    faq: [
      { q: 'Is Knight Command a product I can buy off the shelf?', a: 'No — it is Knight Logics internal ops infrastructure. The case study documents the embed-shell pattern we reuse when building owner dashboards and internal tools for clients.' },
      { q: 'What services live inside the tabs?', a: 'Referrals (5050 family), OutreachEngine CRM, Email-Agent (5100), Social Poster (8501), Social Ops (8500), plus Command Center and Logs for orientation and failure triage.' },
      { q: 'Can you build something like this for my company?', a: 'Yes. We scope authenticated admin shells that embed your CRM, job board, invoicing, or marketing tools so operators stop juggling bookmarks.' },
      { q: 'How does this relate to client-facing dashboards?', a: 'The same modular tab + embed approach powers business-dashboard-development and internal-business-tools engagements — with role gates and only the lanes each role needs.' }
    ],
    deliverables: [
      { title: 'Admin shell', items: ['Authenticated /admin entry with role gate', 'Tab navigation to seven primary ops views', 'Command Center orientation summary', 'Logs tab for cross-system failure review'] },
      { title: 'Service embeds', items: ['Referrals → referral infrastructure on 5050 family', 'Outreach CRM → OutreachEngine queue UI', 'Email Agent → port 5100 views', 'Social Poster → Streamlit 8501'] },
      { title: 'Operator outcomes', items: ['Single login for growth ops', 'Faster morning queue review', 'Foundation for client-facing admin patterns', 'Documented port map for onboarding'] }
    ],
    connections: {
      kicker: 'Ops hub',
      title: 'Embeds every major growth lane',
      text: 'Knight Command is internal infrastructure — not a client SKU — but documents embed patterns for business-dashboard-development and internal-business-tools.',
      bullets: ['business-growth-systems as strategic parent', 'case-study-crm-outreach-system in Outreach tab', 'case-study-referral-network-system in Referrals tab', 'case-study-social-poster in Social Poster tab'],
      links: [['/business-growth-systems', 'Growth Systems'], ['/business-dashboard-development', 'Dashboard Development'], ['/internal-business-tools', 'Internal Tools']]
    },
    outcomes: [
      { title: 'Less context switching', text: 'Operators review referrals, CRM, email, and social without leaving /admin.' },
      { title: 'Faster failure triage', text: 'Logs tab centralizes cross-runner errors.' },
      { title: 'Modular upgrades', text: 'Services deploy independently into tab slots.' },
      { title: 'Client pattern reference', text: 'Embed architecture reusable for owner dashboards on client builds.' }
    ],
    scopeNote: 'Knight Command is Knight Logics internal ops infrastructure — not a deployed client product. Case study documents architecture patterns for similar builds.',
    proofGrid: [PROOF.crmOutreach, PROOF.referral, PROOF.socialPoster]
  },
  'case-study-crm-outreach-system': {
    context: {
      title: 'OutreachEngine in production on real campaigns',
      kicker: 'Live CRM',
      media: images.caseStudyCrm,
      paragraphs: [
        'OutreachEngine — Flask app with SQLite storage — drives segmented lists, branded templates, scheduler jobs for first_touch and followup, bounce detection, and daily caps between 20 and 40 sends per brand.',
        'Screen Team st lane, Faith Works faithworks lane, and Knight Group kg lane each use OutreachEngine with separate caps and templates. KG generated substantial booked work from one well-targeted message; ST and FW run the same engine at enclosure and land-clearing scale.',
        'Replies route to Email-Agent crm_reply views on port 5100; Knight Command Outreach CRM tab embeds the queue UI for daily operator review.',
        'If you are tired of spreadsheet lists, mixed brand templates, and “did anyone follow up?” — this is the production pattern: queue preview, enforced caps, bounce suppression, and reply routing into one operator workflow.'
      ]
    },
    walkthrough: {
      title: 'CRM walkthrough &amp; live lane proof',
      intro: 'Watch the outreach dashboard, then see the client brands that actually run on it — not a demo dataset.',
      primary: { ...videos.crm, controls: true, title: 'CRM outreach dashboard walkthrough' },
      proofs: [
        { src: images.caseStudyCrm.src, alt: images.caseStudyCrm.alt, caption: 'Queue UI with segmented lists, brand switcher, and send-window visibility.', width: 1200, height: 675 },
        { src: images.kgHero.src, alt: images.kgHero.alt, caption: 'Knight Group kg lane — real booked work from targeted outreach.', width: 1200, height: 675 }
      ],
      audits: [
        { src: images.screenTeam.src, alt: images.screenTeam.alt, title: 'Screen Team st lane', text: 'Enclosure trade campaigns with separate caps and templates.' },
        { src: images.faithWorks.src, alt: images.faithWorks.alt, title: 'Faith Works faithworks lane', text: 'Land-clearing scale lists on the same OutreachEngine.' },
        { src: images.caseStudyKnightCommand.src, alt: 'Knight Command CRM embed', title: 'Knight Command embed', text: 'Daily queue review inside /admin Outreach CRM tab.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Adapt OutreachEngine for your trade',
      ctaSecondaryHref: '/crm-outreach-lead-generation',
      ctaSecondaryLabel: 'CRM outreach service'
    },
    faq: [
      { q: 'Is this a third-party CRM we resell?', a: 'No. OutreachEngine is Knight Logics production software configured per client brand. The case study describes the live workflow we operate and can adapt for your trade and territory.' },
      { q: 'How do you keep brands from mixing templates?', a: 'Each lane (kl, kg, st, faithworks, and others) has isolated templates, senders, and daily caps. Operators switch brands explicitly before preview or send.' },
      { q: 'What happens when someone replies?', a: 'Replies route into Email-Agent crm_reply views on port 5100 so follow-up is not trapped in a personal Gmail inbox.' },
      { q: 'Can you run this for my company without building a full admin shell?', a: 'Yes. We can deploy OutreachEngine for your lists and caps first, then embed it in Knight Command–style admin later if your team needs a unified ops hub.' }
    ],
    deliverables: [
      { title: 'CRM engine', items: ['Flask + SQLite OutreachEngine deployment', 'Brand switcher for kl, kg, st, and faithworks lanes', 'Queue preview and send window visibility', 'Bounce flags suppress bad addresses'] },
      { title: 'Scheduler & caps', items: ['first_touch and followup job configuration', '20–40 daily send limits per brand', 'Preview sends before production windows', 'Campaign logging for lead-source reporting'] },
      { title: 'Reply integration', items: ['Email-Agent crm_reply routing', 'Knight Command embed', 'Gmail/Zoho/Microsoft inbox mapping', 'Weekly operator review cadence'] }
    ],
    connections: {
      kicker: 'Live proof',
      title: 'Live client lane results — ST, FW, and KG',
      text: 'OutreachEngine production proof spans Screen Team, Faith Works, and Knight Group — not a demo dataset.',
      bullets: ['crm-outreach-lead-generation service page', 'email-agent-automation for reply path', 'Screen Team 36-page site as st lane proof destination', 'Faith Works 82-page site as faithworks lane reference'],
      links: [['/crm-outreach-lead-generation', 'CRM Outreach Service'], ['/case-study-screen-team', 'Screen Team Proof'], ['/case-study-faith-works', 'Faith Works Proof']]
    },
    outcomes: [
      { title: 'Real pipeline', text: 'Live client lanes produce measurable reply and conversion signals across trades.' },
      { title: 'Brand-safe ops', text: 'Templates and senders isolated per kl, kg, st, and faithworks lanes.' },
      { title: 'Enforced follow-up', text: 'Scheduler replaces manual inbox remembering.' },
      { title: 'Reputation protection', text: 'Caps and bounce rules visible before damage.' }
    ],
    scopeNote: 'OutreachEngine is Knight Logics production software configured per client brand — case study describes live internal workflow, not a third-party SaaS resale.',
    proofGrid: [PROOF.screenTeam, PROOF.faithWorks, PROOF.kg]
  },
  'case-study-vendoroo-ticket-invoice-system': {
    context: {
      title: 'Portal ticket to Stripe invoice in one workflow',
      kicker: 'Field ops',
      media: images.caseStudyVendoroo,
      paragraphs: [
        'Property maintenance vendors receive portal tickets, complete field work, then manually rebuild proof and invoices. The Vendoroo-style active build unifies intake queue, mobile updates, photo attachments, PDF packets, and Stripe triggers.',
        'Implementation is an internal reference build — code is not in the public repository. Patterns inform ticketing-invoicing-job-workflows, job-photo-pdf-reports, and stripe-invoice-automation client scoping.',
        'Office staff reviews photo proof before invoice send; field crews follow consistent closeout path with required capture steps.',
        'If your crews finish jobs on phones while the office retypes everything into Stripe, this is the showpiece: one job record from portal intake through paid status.'
      ]
    },
    walkthrough: {
      title: 'Ticket-to-invoice walkthrough',
      intro: 'UI mockups of the active Vendoroo-style build — intake, field proof, and billing in one path. Real screen recordings ship when the internal build is cleared for public demo.',
      primary: { ...images.caseStudyVendoroo, title: 'Vendor ticket and invoice workflow' },
      proofs: [
        { src: images.jns.src, alt: images.jns.alt, caption: 'Contractor web reference — JNS Construction as a related trade-site proof.', width: 1200, height: 675 },
        { src: images.screenTeam.src, alt: images.screenTeam.alt, caption: 'Field-service site pattern that pairs with job workflow systems.', width: 800, height: 450 }
      ],
      audits: [],
      ctaHref: '/book-consultation',
      ctaLabel: 'Scope a ticket-to-invoice system',
      ctaSecondaryHref: '/ticketing-invoicing-job-workflows',
      ctaSecondaryLabel: 'Job workflow service'
    },
    faq: [
      { q: 'Is Vendoroo a live public product?', a: 'It is an active internal workflow reference — not a publicly deployed client product or open-source repo. We use it to scope similar portal-driven vendor builds.' },
      { q: 'What does a typical client engagement include?', a: 'Ticket intake, mobile job status, photo proof, branded PDF packets, and Stripe invoice or payment-link triggers with paid status sync — scoped to your portal and crew process.' },
      { q: 'Do you integrate with existing vendor portals?', a: 'Yes. We design export and upload formats managers already require, then keep the job record as the source of truth through billing.' },
      { q: 'Can this connect to Email-Agent or an owner dashboard?', a: 'Optional status notifications via Email-Agent and owner views for open vs billed jobs are part of the same lane family.' }
    ],
    deliverables: [
      { title: 'Ticket workflow', items: ['Portal and manual intake into one queue', 'Assignment and status steps for crews', 'Mobile-friendly job screen', 'Owner view for open vs billed'] },
      { title: 'Proof & PDF', items: ['Photo attach per job ID', 'Branded PDF completion reports', 'Portal upload format compliance', 'Missing-proof alerts'] },
      { title: 'Billing sync', items: ['Stripe invoice on completion milestone', 'Payment link alternative', 'Webhook paid status on job record', 'Email-Agent optional status notify'] }
    ],
    connections: {
      kicker: 'Field ops reference',
      title: 'Represents ticketing flagship offer',
      text: 'Active build status — patterns available for similar vendor portal clients.',
      bullets: ['ticketing-invoicing-job-workflows flagship', 'job-photo-pdf-reports sub-lane', 'stripe-invoice-automation billing layer', 'JNS as contractor web reference'],
      links: [['/ticketing-invoicing-job-workflows', 'Job Workflow Service'], ['/job-photo-pdf-reports', 'Photo & PDF Reports'], ['/stripe-invoice-automation', 'Stripe Automation']]
    },
    outcomes: [
      { title: 'Reduced re-entry', text: 'Ticket details stay in one record through closeout.' },
      { title: 'Billing speed', text: 'Invoice triggers at completion — not days of manual lag.' },
      { title: 'Portal acceptance', text: 'PDF format structured for manager requirements.' },
      { title: 'Client scoping template', text: 'Internal reference accelerates similar vendor proposals.' }
    ],
    scopeNote: 'Vendoroo-style build is an active internal workflow reference — not a publicly deployed client product or open-source repo. Demonstrates capability for portal-driven vendors.',
    proofGrid: [PROOF.jns, PROOF.screenTeam, PROOF.vendoroo]
  },
  'case-study-hospitality-system-pattern': {
    context: {
      title: 'Hospitality capability without premature client marketing',
      kicker: 'Hospitality lane',
      media: { type: 'image', src: '/images/showcase/hospitality-events-hours-mockup.webp', alt: 'Hospitality events and hours admin pattern', width: 1200, height: 675 },
      paragraphs: [
        'Restaurant and bar builds add admin-editable menus and events, ordering-ready Stripe architecture, and local visibility alignment — replacing PDF menus and social-only event posts.',
        'Hand-coded mobile layout targets peak traffic performance without page builder bloat. Architecture leaves POS integration hooks for when kitchen volume justifies deeper checkout integration.',
        'Client names, live URLs, and branded photography stay off public marketing until ownership approves publication and site hosting transfer.',
        'If you want events, specials, and order-ahead on your own domain — without waiting on a bloated POS website — this is the stack we document and build.'
      ]
    },
    walkthrough: {
      title: 'Hospitality system walkthrough',
      intro: 'Capability mockups for events, hours, menus, and ordering — plus the Whistle Stop preview asset used on the case-studies grid until client branding is cleared.',
      primary: { type: 'image', src: '/images/showcase/hospitality-events-hours-mockup.webp', alt: 'Hospitality events and hours admin pattern', width: 1200, height: 750 },
      proofs: [
        { src: '/images/showcase/hospitality-events-hours-mockup.webp', alt: 'Events and hours admin pattern', caption: 'Events calendar and business hours on the owned domain — not only on social.', width: 1200, height: 750 },
        { src: '/images/showcase/hospitality-menus-ordering-mockup.webp', alt: 'Menus and ordering mockup', caption: 'Admin-editable menu specials with Stripe order-ahead architecture.', width: 1200, height: 750 }
      ],
      audits: [
        { src: images.caseStudyKnightLogics.src, alt: 'Platform patterns', title: 'Ordering-ready', text: 'Checkout scoped to kitchen ops before POS lock-in.' },
        { src: images.moms.src, alt: "Mom's Resin Tables storefront", title: 'Related commerce UX', text: 'Hand-coded storefront patterns from other consumer brands.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Plan a restaurant or bar system',
      ctaSecondaryHref: '/restaurant-bar-growth-systems',
      ctaSecondaryLabel: 'Restaurant systems'
    },
    faq: [
      { q: 'Why is there no named restaurant case study yet?', a: 'Hospitality client case studies publish only after ownership approves public marketing and site hosting transfer. This page documents the reusable system pattern in the meantime.' },
      { q: 'What is Whistle Stop on the case-studies grid?', a: 'A client preview card that routes here — the hospitality capability pattern — until branded photography and live URL marketing are cleared.' },
      { q: 'Do you replace Toast or another POS?', a: 'Not by default. We build owned-domain menus, events, and Stripe-ready order-ahead with hooks for deeper POS integration when kitchen volume justifies it.' },
      { q: 'Can staff edit menus without calling a developer?', a: 'Yes. Admin-editable menu and event patterns are a core deliverable so specials and hours stay accurate during busy weeks.' }
    ],
    deliverables: [
      { title: 'Site & content', items: ['Admin-editable menu patterns', 'Events calendar on owned domain', 'Mobile-first hospitality UX', 'Approved client branding when cleared'] },
      { title: 'Ordering prep', items: ['Stripe-ready checkout scoping', 'Pickup flow staging tests', 'Kitchen ops consultation', 'POS hook documentation'] },
      { title: 'Launch checklist', items: ['GBP alignment pre-marketing', 'LocalBusiness schema', 'Review strategy at opening', 'restaurant-bar-growth-systems template alignment'] }
    ],
    connections: {
      kicker: 'Hospitality lane',
      title: 'restaurant-bar-growth-systems reference',
      text: 'Capability pattern — represents ordering and events stack for bars and restaurants until client case studies publish.',
      bullets: ['online-ordering-systems for checkout depth', 'local-visibility-systems for discovery', 'review-request-systems at launch', 'social-media-automation for event posts'],
      links: [['/restaurant-bar-growth-systems', 'Restaurant Systems'], ['/online-ordering-systems', 'Ordering Systems'], ['/case-study-hospitality-system-pattern', 'Hospitality System Pattern']]
    },
    outcomes: [
      { title: 'Staff-friendly content', text: 'Menu and event updates without developer dependency.' },
      { title: 'Owned event discovery', text: 'Calendar lives on brand domain alongside social.' },
      { title: 'Order-ready foundation', text: 'Checkout architecture tested in staging.' },
      { title: 'Ethical launch discipline', text: 'No client branding on knightlogics.com until sign-off.' }
    ],
    scopeNote: 'Capability documentation — hospitality client case studies publish only after approval and site transfer. Fictional UI mockups illustrate the stack until then.',
    proofGrid: [PROOF.hospitalityPattern, PROOF.socialPoster]
  },
  'case-study-roof-monsters': {
    context: {
      title: 'A roofing brand site built for referrals and local search',
      kicker: 'Live client',
      media: videos.roofMonsters,
      paragraphs: [
        'Roof Monsters needed credible web presence and inspection lead paths before storm season push. Prior digital footprint lacked service areas, project proof, and insurance-adjacent FAQs homeowners expect.',
        'Build includes service pages, city geography, trust layout, estimate-first CTAs, and CRM-ready forms. Lead paths wire for future OutreachEngine intake with daily caps and reply routing.',
        'Client preview — detailed metrics and live URL marketing publish when launch is approved. Serves as roofing vertical reference for contractor-growth-systems.'
      ]
    },
    deliverables: [
      { title: 'Trust & IA', items: ['Project proof page structure', 'Insurance-friendly FAQ content', 'Service and city page architecture', 'Mobile inspection request CTAs'] },
      { title: 'Local SEO', items: ['Schema and internal linking', 'GBP messaging alignment', 'Storm-season metro prioritization', 'service-area-page-strategy for expansion'] },
      { title: 'Lead readiness', items: ['Form intake rules for CRM', 'Referral partner path planning', 'Review request timing post-job', 'Optional outreach list segmentation'] }
    ],
    connections: {
      kicker: 'Roofing vertical',
      title: 'roofing-business-growth-systems template',
      text: 'Preview case study until client approves launch — documents trade-specific patterns.',
      bullets: ['roofing-business-growth-systems sub-page', 'contractor-growth-systems parent', 'local-visibility-systems for map-pack', 'crm-outreach-lead-generation when outbound starts'],
      links: [['/roofing-business-growth-systems', 'Roofing Systems'], ['/contractor-growth-systems', 'Contractor Systems'], ['/local-visibility-systems', 'Local Visibility']]
    },
    outcomes: [
      { title: 'Pre-season credibility', text: 'Trust content ready before demand spike.' },
      { title: 'Geo-qualified leads', text: 'City pages filter inspection requests to served metros.' },
      { title: 'CRM-ready intake', text: 'Forms structured for outreach engine connection.' },
      { title: 'Vertical template', text: 'Roofing reference accelerates similar client scoping.' }
    ],
    scopeNote: 'Client preview — not publicly marketed as live until ownership approves launch. Case study describes build pattern and IA, not published performance metrics.',
    proofGrid: [PROOF.roofMonsters, PROOF.roofMonstersAudit, PROOF.roofMonstersProject]
  },
  'case-study-social-poster': {
    context: {
      title: 'Hybrid API and Playwright social runners',
      kicker: 'Social ops',
      media: images.caseStudySocial,
      paragraphs: [
        'Social Poster on Streamlit port 8501 manages per-brand queues, posting windows, X and Facebook API bridge, GBP API posts, and Playwright runners for Nextdoor and LinkedIn.',
        'Silent failures previously left brand accounts quiet for days. Failure counters and Logs cross-reference give operators same-day visibility when runners break.',
        'Embedded in Knight Command Social Poster and Social Ops tabs — complements local-visibility-systems GBP strategy with scheduled post cadence.',
        'If your “automation” still dies quietly overnight, this is the production answer: isolated brand queues, hybrid API + browser runners, and failures you can see before the week is gone.'
      ]
    },
    walkthrough: {
      title: 'Social Poster walkthrough &amp; proof',
      intro: 'Live queue UI on port 8501 — then the mockup and related ops surfaces that keep multi-brand posting honest.',
      primary: { ...videos.social, controls: true, title: 'Social media manager walkthrough' },
      proofs: [
        { src: images.caseStudySocial.src, alt: images.caseStudySocial.alt, caption: 'Multi-brand scheduling with posting windows and runner status.', width: 1200, height: 675 },
        { src: images.caseStudyKnightCommand.src, alt: images.caseStudyKnightCommand.alt, caption: 'Embedded in Knight Command Social Poster and Social Ops tabs.', width: 1200, height: 675 }
      ],
      audits: [
        { src: images.screenTeam.src, alt: images.screenTeam.alt, title: 'ST brand queue', text: 'Screen Team posts stay isolated from KL and KG credentials.' },
        { src: images.faithWorks.src, alt: images.faithWorks.alt, title: 'Client cadence', text: 'GBP and social posts align with website campaign timing.' },
        { src: images.caseStudyCrm.src, alt: 'Growth stack', title: 'Growth stack fit', text: 'Pairs with CRM and local visibility lanes for full demand gen.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Automate your brand posting',
      ctaSecondaryHref: '/social-media-automation-systems',
      ctaSecondaryLabel: 'Social automation'
    },
    faq: [
      { q: 'Why not just use a generic social scheduler?', a: 'Many platforms still need browser automation, GBP posts belong with the same queue, and silent failures are unacceptable for multi-brand ops. Social Poster is built for that hybrid reality.' },
      { q: 'Which platforms use API vs Playwright?', a: 'X and Facebook go through API clients where stable; Nextdoor and LinkedIn use Playwright runners when the network requires browser automation. GBP posts use the GBP API.' },
      { q: 'Can you run this for one company brand only?', a: 'Yes. Multi-brand isolation is how we operate today, but a single-brand queue with posting windows and failure alerts is a common first scope.' },
      { q: 'How do operators see failures?', a: 'Failure counters in the Streamlit UI plus Knight Command Logs / Social Ops tabs so broken runners are visible the same day.' }
    ],
    deliverables: [
      { title: 'Queue infrastructure', items: ['Streamlit UI on port 8501', 'Isolated KL, KG, ST brand queues', 'Posting window enforcement', 'Last success timestamp per platform'] },
      { title: 'Runner layer', items: ['X and Facebook API clients', 'Playwright workers for Nextdoor and LinkedIn', 'GBP API integration', 'Credential vault per brand'] },
      { title: 'Ops embed', items: ['Knight Command Social Poster tab', 'Logs integration for failures', 'Social Ops weekly review workflow', 'social-media-automation-systems service alignment'] }
    ],
    connections: {
      kicker: 'Social lane',
      title: 'social-media-automation-systems production proof',
      text: 'Internal system supporting multi-brand Tampa Bay client accounts.',
      bullets: ['case-study-knight-command for embed shell', 'local-visibility-systems for GBP posts', 'workflow-automation for scheduler', 'ai-business-automation parent'],
      links: [['/social-media-automation-systems', 'Social Automation'], ['/case-study-knight-command', 'Knight Command'], ['/local-visibility-systems', 'Local Visibility']]
    },
    outcomes: [
      { title: 'Reliable cadence', text: 'Fewer multi-day posting gaps across platforms.' },
      { title: 'Brand isolation', text: 'Wrong-account posts prevented by queue separation.' },
      { title: 'Failure visibility', text: 'Broken runners surface same day in UI.' },
      { title: 'GBP alignment', text: 'Scheduled posts match website campaign timing.' }
    ],
    scopeNote: 'Social Poster is Knight Logics internal production tooling on port 8501 — case study documents live workflow, not an off-the-shelf social SaaS product.',
    proofGrid: [PROOF.socialPoster, PROOF.knightCommand]
  },
  'case-study-referral-network-system': {
    context: {
      title: 'Partner attribution with payout visibility',
      kicker: 'Referral network',
      media: images.caseStudyReferral,
      paragraphs: [
        'Referral network infrastructure deploys /ref/:partner entry paths, QR brochure assets, Neon Postgres event logging, referral-dashboard partner views, and Stripe webhook payout settlement.',
        'Partners previously disputed credit when payout status lived in spreadsheets. Dashboard self-service reduced email disputes and accelerated Tampa Bay trade network onboarding.',
        'Knight Command Referrals tab embeds referral ops on port 5050 family alongside CRM and email — single operator shell for partner support.',
        'If you want partners to trust the program — and you want to know which QR codes actually produce consults — this is the live attribution and payout stack.'
      ]
    },
    walkthrough: {
      title: 'Referral network walkthrough &amp; proof',
      intro: 'Dashboard walkthrough plus the attribution UI and Command embed partners and operators actually use.',
      primary: { ...videos.referral, controls: true, title: 'Referral system dashboard walkthrough' },
      proofs: [
        { src: images.caseStudyReferral.src, alt: images.caseStudyReferral.alt, caption: 'Partner attribution dashboard with earned vs paid visibility.', width: 1200, height: 675 },
        { src: images.caseStudyKnightCommand.src, alt: images.caseStudyKnightCommand.alt, caption: 'Referrals tab inside Knight Command — no orphan dashboard URLs.', width: 1200, height: 675 }
      ],
      audits: [
        { src: images.faithWorks.src, alt: 'Trade network', title: 'Trade network fit', text: 'Built to scale local partner onboarding with clear credit.' },
        { src: images.caseStudyCrm.src, alt: 'Consult capture', title: 'Consult capture', text: 'Form submits keep referral context into Neon events.' },
        { src: images.caseStudyKnightCommand.src, alt: 'Operator support', title: 'Operator support', text: 'Partner questions answered from the same /admin shell.' }
      ],
      ctaHref: '/book-consultation',
      ctaLabel: 'Build referral tracking for your network',
      ctaSecondaryHref: '/referral-network-systems',
      ctaSecondaryLabel: 'Referral systems'
    },
    faq: [
      { q: 'Is this the same as the public Referral Program page?', a: 'The public Referral Program is the join path and terms. This case study documents the production infrastructure — codes, QR, Neon events, dashboard, and Stripe payout sync — behind that program.' },
      { q: 'Can partners see what they earned?', a: 'Yes. referral-dashboard gives partners earned vs paid visibility within program data boundaries so disputes do not live in email threads.' },
      { q: 'Do you support print QR brochures?', a: 'Yes. QR brochure assets and /ref/:partner routes are part of the attribution path so print and digital share the same event log.' },
      { q: 'Can this run for my company brand, not just Knight Logics?', a: 'Yes. We scope partner codes, attribution windows, and payout rules to your program — then wire Stripe webhooks and a partner-facing dashboard.' }
    ],
    deliverables: [
      { title: 'Attribution paths', items: ['/ref/:partner landing routes', 'QR brochure generation', 'Consult form referral context capture', 'Neon Postgres event store'] },
      { title: 'Partner dashboard', items: ['referral-dashboard earned vs paid view', 'Attribution window per program terms', 'Partner onboarding with unique codes', 'Data boundaries for partner privacy'] },
      { title: 'Settlement', items: ['Stripe webhook payout sync', 'api-integration-services receivers', 'Knight Command Referrals embed', 'referral-network-systems program alignment'] }
    ],
    connections: {
      kicker: 'Partner program',
      title: 'referral-network-systems flagship proof',
      text: 'Live workflow behind public Referral Program and partner onboarding.',
      bullets: ['referral-program public join path', 'case-study-knight-command Referrals tab', 'api-integration-services for webhooks', 'business-growth-systems full stack context'],
      links: [['/referral-network-systems', 'Referral Systems'], ['/referral-program', 'Join Referral Program'], ['/case-study-knight-command', 'Knight Command']]
    },
    outcomes: [
      { title: 'Dispute reduction', text: 'Partners verify earned vs paid without owner email chains.' },
      { title: 'Faster onboarding', text: 'Codes and QR assets deploy in days.' },
      { title: 'Network intelligence', text: 'Owners see which partners and QR campaigns produce consults.' },
      { title: 'Embedded support', text: 'Referral ops inside /admin — not orphan dashboard URLs.' }
    ],
    scopeNote: 'Referral infrastructure is production Knight Logics systems — partner program terms, fees, and payout rules are defined separately in program documentation.',
    proofGrid: [PROOF.referral, PROOF.knightCommand]
  }
};

function enrichPage(page) {
  const e = enrichments[page.slug];
  const applyClientMedia = (target) => {
    if (CLIENT_MEDIA_SLUGS.includes(page.slug) && !hasAnyClientMediaBlock(target.mediaBlocks)) {
      target.mediaBlocks = [...(target.mediaBlocks || []), clientMediaBlockForSlug(page.slug, 'right')];
    }
    if (!target.stats || !target.stats.length) {
      target.stats = clientStatsForSlug(page.slug);
    }
    if (!target.proofGrid || !target.proofGrid.length) {
      target.proofGrid = defaultProofGrid(page.slug);
    }
    const intros = defaultSectionIntros(target);
    if (!target.deliverablesIntro) target.deliverablesIntro = intros.deliverablesIntro;
    if (!target.outcomesIntro) target.outcomesIntro = intros.outcomesIntro;
    if (!target.proofsIntro) target.proofsIntro = intros.proofsIntro;
    return target;
  };

  if (!e) {
    return applyClientMedia(applyKgReplacementsDeep(JSON.parse(JSON.stringify(page))));
  }

  const merged = deepMerge(page, e);
  if (merged.stats && merged.stats === KG_STATS && primaryClientForSlug(page.slug) !== 'kg') {
    merged.stats = clientStatsForSlug(page.slug);
  }
  return applyClientMedia(merged);
}

module.exports = { enrichments, enrichPage, CLIENT_MEDIA_SLUGS, applyKgReplacementsDeep };
