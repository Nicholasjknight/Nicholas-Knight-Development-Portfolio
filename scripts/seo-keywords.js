/**
 * SEO + AI-discovery copy for all generated growth/case-study pages.
 * Applied at generate time via applySeoKeywords().
 */

function trimMeta(text, max = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function lines(...paras) {
  return paras.filter(Boolean);
}

/** @type {Record<string, { meta?: string, lead?: string, contextLines?: string[], terms?: string[] }>} */
const PAGE_SEO = {
  'business-growth-systems': {
    terms: ['small business growth systems', 'Tampa Bay local SEO', 'CRM outreach automation', 'referral tracking'],
    meta: 'Business growth systems for Tampa Bay — websites, local SEO, GBP, CRM outreach, automation, and referral tracking.',
  },
  'contractor-growth-systems': {
    terms: ['contractor website Tampa Bay', 'contractor local SEO Florida', 'field trade lead generation'],
    meta: 'Contractor growth systems for Tampa Bay trades — service-page SEO, Google Business alignment, CRM outreach, referral tracking, and job workflows for estimate-first crews.',
    contextLines: lines(
      'Contractor website searches in Tampa, Clearwater, and St. Petersburg split by trade and neighborhood — dedicated service pages with schema and city coverage outperform a single homepage for high-intent queries.',
      'The contractor lane recruits complementary trades into a referral network with tracked attribution while anchor builds (handyman, enclosure, excavation) prove depth at 36–97 indexable pages.'
    ),
  },
  'home-service-business-growth-systems': {
    terms: ['home service marketing Tampa', 'local SEO home services', 'Google map pack home services'],
    meta: 'Home service growth systems for Tampa Bay — fast sites, local SEO, GBP, CRM outreach, reviews, and referral paths.',
    contextLines: lines(
      'Home service leads are urgent — homeowners call three competitors in minutes. Map-pack visibility, call-first CTAs, and review timing separate booked jobs from missed voicemails.',
      'Electricians, painters, handymen, and enclosure trades in the network send attributed referral work when each partner has a credible owned presence and clear service pages.'
    ),
  },
  'local-visibility-systems': {
    terms: ['local SEO Tampa Bay', 'Google Business Profile optimization', 'map pack visibility'],
    meta: 'Local visibility systems — Tampa Bay local SEO, Google Business Profile optimization, service-area pages, schema, indexing, and review workflows for small businesses.',
    contextLines: lines(
      'Local visibility is not a one-time GBP cleanup — it is ongoing alignment between your website services, structured data, Search Console indexing, and the categories customers use in Google Maps.',
      'Service-area pages, FAQ schema, and internal linking help AI summaries and map-pack algorithms understand which neighborhoods and intents you actually serve across Tampa Bay.'
    ),
  },
  'website-growth-audit': {
    terms: ['free website audit Tampa', 'website growth audit', 'local SEO audit small business'],
    meta: 'Free website & growth audit — technical SEO, speed, schema, GBP alignment, and conversion fixes for Tampa Bay businesses.',
    contextLines: lines(
      'A useful audit covers crawlability, Core Web Vitals, schema validity, GBP parity with the website, and whether service-intent searches have a landing page to rank.',
      'Knight Logics audits are built for owners who want a prioritized fix list — not a generic PDF — before committing to a rebuild or local SEO sprint.'
    ),
  },
  'crm-outreach-lead-generation': {
    terms: ['CRM outreach', 'outbound lead generation', 'contractor email outreach', 'property manager outreach', 'send caps reply routing'],
    meta: 'CRM outreach & outbound lead gen — contractor email, property manager lists, send caps, and Email-Agent reply routing.',
    contextLines: lines(
      'Outbound lead generation works when lists are segmented, daily send caps protect reputation, and replies route into Email-Agent crm_reply — not personal Gmail.',
      'OutreachEngine brand lanes (kl, kg, st, faithworks) keep contractor email outreach and property manager campaigns isolated with bounce discipline before the next window.'
    ),
  },
  'referral-network-systems': {
    terms: ['referral tracking', 'partner attribution', 'QR referral', 'referral payout dashboard'],
    meta: 'Referral tracking & partner attribution — /ref paths, QR brochures, Neon events, and earned vs paid dashboards.',
    contextLines: lines(
      'Partner attribution fails when credit is verbal. Tracked /ref/:partner paths, QR referral scans, and Neon events document which partner earned the consult.',
      'Stripe webhook payouts and referral-dashboard earned vs paid views reduce disputes as the Tampa Bay trade roster grows.'
    ),
  },
  'ticketing-invoicing-job-workflows': {
    terms: ['contractor job tracking software', 'ticket invoice workflow', 'field service invoicing'],
    meta: 'Ticketing, invoicing & job workflows — field photos, PDF proof, Stripe invoices, and portal closeout paths for Tampa Bay contractors and vendors.',
    contextLines: lines(
      'Portal-heavy vendors lose margin when tickets, photos, and invoices live in separate apps. A single job record with proof attachments supports faster closeout and fewer chargebacks.',
      'Workflow automation ties website lead intake to job records when volume justifies ops depth beyond spreadsheets and text threads.'
    ),
  },
  'online-ordering-systems': {
    terms: ['online ordering restaurant Tampa', 'e-commerce ordering system', 'Stripe order ahead'],
    meta: 'Online ordering & e-commerce systems — menus, order-ahead checkout, Stripe flows, and owned-domain storefronts for Tampa Bay restaurants and retailers.',
    contextLines: lines(
      'Owned-domain ordering reduces platform fees and keeps customer data on your brand — especially when menus, hours, and specials change weekly.',
      'Admin-editable menus, events, and checkout paths align with Google Business actions and repeat customer flows.'
    ),
  },
  'performance-partner-program': {
    terms: ['performance marketing partner', 'revenue share web design', 'growth partner Tampa'],
    meta: 'Performance partner program — shared upside with written attribution, baselines, and 90-day measurement windows for Tampa Bay growth system clients.',
    contextLines: lines(
      'Performance partnerships require measurable infrastructure — analytics, CRM attribution, and agreed definitions of a qualified lead before fees tie to outcomes.',
      'Knight Logics scopes partner programs after core tracking exists or will be built in the first milestone.'
    ),
  },
  'ai-business-automation': {
    terms: ['AI automation small business', 'safe AI automation boundaries', 'ops AI vs rules engine'],
    meta: 'AI business automation for small business — assistive drafts and triage with safe boundaries; send caps and brand maps stay rule-backed for Tampa Bay operators.',
    contextLines: lines(
      'AI automation small business buyers need boundaries: AI can draft and sort, while OutreachEngine caps and Email-Agent brand maps remain deterministic.',
      'Useful automations connect to live queues and Logs tabs — not unsupervised chatbots with no audit trail.'
    ),
  },
  'workflow-automation': {
    terms: ['business process automation', 'form-to-CRM', 'review-request automation', 'stale lead follow-up'],
    meta: 'Business process automation — form-to-CRM, review requests, stale-lead follow-up, and failure-visible jobs.',
    contextLines: lines(
      'Workflow automation should eliminate weekly copy-paste: form submit to CRM, job complete to review ask, stale quote to follow-up — with monitoring when steps fail.',
      'Phased rollout keeps automations reliable before scaling volume across Tampa Bay ops.',
      'Concrete business process automation examples include form-to-CRM folder creation, review-request automation after closeout, and stale-lead nudges that skip anyone already booked.',
      'Operators should see failed jobs the same day in Logs — silent Zapier-style breakage is how quote follow-up dies during vacation weeks.'
    ),
  },
  'email-agent-automation': {
    terms: ['multi-inbox routing', 'CRM reply management', 'Formspree lead routing', 'business email ops'],
    meta: 'Email-Agent multi-inbox routing — CRM replies, Formspree leads, brand maps, and bounce loops to OutreachEngine.',
    contextLines: lines(
      'Business email ops break when outreach, Formspree leads, and manual threads share one inbox. crm_reply vs formspree_lead views keep triage fast.',
      'Brand maps for KL/KG/ST/FW and bounce feedback to OutreachEngine protect reputation across providers.',
      'Morning review should open Email-Agent first: unread crm_reply count, then formspree_lead intake, then manual owner threads — never one undifferentiated Gmail search.',
      'Provider wiring covers Gmail, Zoho, and Microsoft so multi-brand Tampa Bay operators keep CRM reply management separate from personal mail.'
    ),
  },
  'social-media-automation-systems': {
    terms: ['social scheduling multi-brand', 'GBP posting', 'LinkedIn Nextdoor automation', 'social queue failure reporting'],
    meta: 'Social scheduling multi-brand — API vs Playwright, GBP posts, LinkedIn/Nextdoor runners, and failure reporting.',
    contextLines: lines(
      'Multi-brand social scheduling needs isolated queues and hybrid runners — API where stable, Playwright for LinkedIn and Nextdoor.',
      'GBP posting should match owned website campaigns so map-pack messaging stays coherent with local SEO pages.',
      'LinkedIn/Nextdoor automation fails quietly on pure API tools — Playwright runners plus last-success timestamps keep Social Ops honest.',
      'Brand isolation means KG project photos never post from ST credentials, and KL company news stays on the KL queue.'
    ),
  },
  'internal-business-tools': {
    terms: ['custom internal business software', 'internal tools developer Tampa', 'business ops dashboard'],
    meta: 'Internal business tools — custom dashboards, data views, and operator interfaces when off-the-shelf SaaS does not match your workflow.',
    contextLines: lines(
      'Internal tools earn their keep when they replace weekly spreadsheet rituals with one view owners actually open.',
      'Knight Logics ships tools against live workflows — outreach, referrals, ticketing — not generic admin templates.'
    ),
  },
  'api-integration-services': {
    terms: ['API integration services', 'webhook integration small business', 'Stripe API integration'],
    meta: 'API integration services — Stripe, CRM, email, and webhook pipelines that connect your website and ops stack reliably.',
    contextLines: lines(
      'Broken integrations silently lose leads. Idempotent webhooks, logging, and retry discipline keep payment and CRM events trustworthy.',
      'Integrations are scoped to business-critical paths first — consult attribution, invoice paid, outreach reply.'
    ),
  },
  'business-dashboard-development': {
    terms: ['business dashboard development', 'owner KPI dashboard', 'growth metrics dashboard'],
    meta: 'Business dashboard development — owner views for leads, outreach, referrals, and job pipeline across Tampa Bay growth stacks.',
    contextLines: lines(
      'Dashboards should answer operator questions in under ten seconds — new leads, referral source, outreach replies waiting, jobs awaiting invoice.',
      'Knight Command-style shells unify tabs when teams outgrow five browser bookmarks.'
    ),
  },
  'handyman-business-growth-systems': {
    terms: ['handyman website Tampa Bay', 'handyman local SEO', 'handyman booking website'],
    meta: 'Handyman growth systems for Tampa Bay — estimate-first sites, city pages, CRM outreach, and referral network slots.',
    contextLines: lines(
      'Handyman searches combine service intent and city — "drywall repair Clearwater" and "handyman near me" need separate silos, not one generic Services page.',
      'Knight Group proves 97-page depth with booking, kg outreach, and Lighthouse scores — the network anchor for this trade lane, not a template for your brand.'
    ),
  },
  'electrician-business-growth-systems': {
    terms: ['electrician website Tampa', 'electrical contractor SEO', 'electrician local SEO Florida'],
    meta: 'Electrician growth systems for Tampa Bay — starter and search-ready websites, local SEO, Google Business alignment, and referral network onboarding for electrical contractors.',
    contextLines: lines(
      'Electrical contractors need residential, commercial, and emergency offers documented before complementary trades will send attributed referral work.',
      'Farrell Electric shows the starter launch pattern — your build becomes the next case study and referral slot in the open electrician lane.'
    ),
  },
  'painter-business-growth-systems': {
    terms: ['painter website Tampa Bay', 'painting contractor SEO', 'house painter local SEO'],
    meta: 'Painter growth systems for Tampa Bay — search-ready websites, portfolio SEO, Google Business alignment, and referral network onboarding for painting contractors.',
    contextLines: lines(
      'Interior, exterior, cabinet, and commercial paint intents rank differently — silo pages with gallery proof capture how homeowners and remodelers actually search.',
      "Sal's Painting demonstrates search-ready analytics, schema, and brand foundation as the reference for new painting partners."
    ),
  },
  'roofing-business-growth-systems': {
    terms: ['roofing website Tampa', 'roofing contractor SEO', 'storm season roofing leads'],
    meta: 'Roofing growth systems for Tampa Bay — trust pages, inspection lead capture, city SEO, CRM intake, and referral attribution for roofing contractors.',
    contextLines: lines(
      'Storm-season roofing searches spike when trust content, insurance-adjacent FAQs, and city pages are already indexed — not after the first tropical wave.',
      'Inspection requests need CRM intake rules so map-pack clicks do not die in unmanaged voicemail.'
    ),
  },
  'screen-enclosure-business-growth-systems': {
    terms: ['screen enclosure website Tampa', 'pool cage SEO Tampa Bay', 'screen room local SEO'],
    meta: 'Screen enclosure growth systems for Tampa Bay — quote-first websites, city and pool-type SEO, Google Business alignment, and CRM follow-up for enclosure trades.',
    contextLines: lines(
      'Pool cage and screen room buyers compare three Tampa Bay quotes — city pages and pool-type silos win the form fill over generic contractor copy.',
      'Screen Team anchors this lane at 36 pages with st outreach — your enclosure brand gets its own lane, caps, and referral codes.'
    ),
  },
  'excavation-business-growth-systems': {
    terms: ['excavation website Florida', 'land clearing SEO', 'site work contractor marketing'],
    meta: 'Excavation & site-work growth systems — geography SEO, project proof, lead routing, and referral paths for land clearing.',
    contextLines: lines(
      'Land clearing and site-work companies sell on capability, radius, and proof — wide geography pages must include unique local utility, not copy-paste city swaps.',
      'Faith Works demonstrates 82-page Central Florida depth with faithworks outreach — the excavation network anchor.'
    ),
  },
  'restaurant-bar-growth-systems': {
    terms: ['restaurant website Tampa', 'bar events calendar website', 'restaurant online ordering'],
    meta: 'Restaurant & bar growth systems — events, menus, hours, ordering flows, and local discovery for Tampa Bay hospitality venues.',
    contextLines: lines(
      'Hospitality venues outgrow Instagram-only promotion when events, menus, and hours need daily updates on an owned domain with GBP alignment.',
      'Events calendars, admin-editable specials, and Stripe-ready ordering reduce platform dependency.'
    ),
  },
  'starting-a-new-business': {
    terms: [
      'starting a new business website',
      'new business website',
      'how to get my business on Google',
      'small business website cost',
      'website for new LLC',
      'new business Google Business Profile'
    ],
    meta: 'Starting a new business? Sequenced launch: foundation, package, Website Audit gate, GBP and website publish — plus separate growth systems for maximum growth.',
    contextLines: lines(
      'Registration, business email, business phone, and cards come before GBP and the website — then audits for indexability, SEO, GEO, and AEO, with optional signs and growth systems after.'
    ),
  },
  'stripe-invoice-automation': {
    terms: ['Stripe invoice automation', 'online payment workflow', 'contractor Stripe billing'],
    meta: 'Stripe invoice automation — payment links, webhook routing, and owner notifications tied to job closeout for service businesses.',
    contextLines: lines(
      'Manual invoicing delays cash flow. Automated Stripe paths with webhook confirmation give owners same-day visibility when jobs complete.',
      'Invoice automation pairs with ticketing lanes when portal vendors need proof attachments before payment.',
      'Contractor Stripe billing should pull line items from the job record — retyping portal tickets into Stripe is where billing lag and typos start.',
      'Paid and overdue states belong on the same screen as photos and notes so office staff stop checking a separate Stripe tab every afternoon.',
      'Webhook retries and operator-visible failures keep online payment workflows trustworthy when a customer pays after hours.',
      'Typical closeout posture: proof attached, invoice or payment link sent same day, paid status synced before the next portal ticket lands.'
    ),
  },
  'job-photo-pdf-reports': {
    terms: ['job photo PDF reports', 'field photo documentation', 'contractor proof PDF'],
    meta: 'Job photo PDF reports — field images, notes, and branded proof documents attached to job records for contractors and vendors.',
    contextLines: lines(
      'Before/after photo PDFs support premium positioning and reduce payment disputes on visual trades.',
      'Photo workflows attach to job tickets when crews already capture images on phones.',
      'Field photo documentation fails when proof lives in camera rolls — required capture on the job page before closeout fixes that habit.',
      'Contractor proof PDF layouts should match property-manager upload formats so portal rejections stop eating office time.',
      'Office review of branded packets before Stripe invoice send is the cleanest dispute prevention for portal-heavy vendors.',
      'Mobile browser capture keeps crews off yet another app store install while timestamps and captions stay tied to the job ID permanently.',
      'When managers require before/after sections, templates encode that once — crews stop rebuilding Word docs after every ticket.'
    ),
  },
  'review-request-systems': {
    terms: ['Google review request automation', 'reputation management small business', 'review generation Tampa'],
    meta: 'Review request systems — timed asks at job completion, GBP review growth, and reputation workflows for Tampa Bay service businesses.',
    contextLines: lines(
      'Reviews compound map-pack visibility when requests fire at the right moment — job complete, customer satisfied, link one tap away.',
      'Reputation lanes integrate with CRM or job workflow when volume justifies automation.',
      'Google review request automation for Tampa Bay trades should throttle duplicates and use the correct GBP review URL per location.',
      'Reputation management for small business is timing and logging — not buying reviews or blasting every contact in a CRM export.',
      'Staff-triggered asks still beat forgotten sticky notes when crews finish screens, roofs, or handyman jobs on site.',
      'Monthly velocity vs job volume tells owners whether reputation is keeping pace with completed work.'
    ),
  },
  'service-area-page-strategy': {
    terms: ['service area pages SEO', 'city landing pages contractor', 'local SEO geography strategy'],
    meta: 'Service-area page strategy — city and county pages with internal linking, schema, and crawl depth for wide-radius Tampa Bay trades.',
    contextLines: lines(
      'Service-area pages succeed when each URL answers a real local query with unique proof — not doorway swaps with swapped city names.',
      'Hub-and-spoke internal linking between services and metros helps crawlers and AI summaries understand your true mobilization radius.',
      'City landing pages for contractors should include coverage honesty, project proof, FAQs, and estimate CTAs — not a paragraph of spun filler.',
      'Local SEO geography strategy ties website metros to GBP service areas so Pinellas and Hillsborough claims do not contradict the profile.',
      'Search Console indexing checks after launch catch soft 404s and orphan city pages before you scale the next county.',
      'Expand metros only when crews actually travel there — responsible scale beats a hundred thin city URLs.'
    ),
  },
  'case-study-knight-command': {
    terms: ['business ops dashboard', 'Knight Command admin', 'unified CRM dashboard'],
    meta: 'Knight Command case study — unified /admin ops shell for CRM, email, social, referrals, and logs across Knight Logics production ports.',
    contextLines: lines(
      'Operators should not need six localhost ports bookmarked to run a growth stack — Knight Command consolidates tabs with shared auth and logging.',
    ),
  },
  'case-study-crm-outreach-system': {
    terms: ['CRM outreach case study', 'OutreachEngine production', 'outbound CRM automation'],
    meta: 'CRM outreach system case study — OutreachEngine with brand lanes, daily caps, and Email-Agent reply routing on live Tampa Bay campaigns.',
    contextLines: lines(
      'Live outreach proof matters more than feature lists — segmented lists, cap enforcement, and reply discipline appear in production client lanes.',
    ),
  },
  'case-study-vendoroo-ticket-invoice-system': {
    terms: ['vendor ticket invoice system', 'property management vendor workflow', 'ticket to invoice automation'],
    meta: 'Vendoroo ticket & invoice case study — portal ticket intake, field photos, and invoice closeout for property management vendors.',
    contextLines: lines(
      'Portal vendors need ticket-to-invoice discipline — photos, status, and PDF proof before billing — not email threads property managers cannot audit.',
    ),
  },
  'case-study-hospitality-system-pattern': {
    terms: ['restaurant website system', 'hospitality events website', 'menu ordering pattern'],
    meta: 'Hospitality system pattern case study — events, menus, hours, and ordering UX for restaurant and bar owned domains.',
    contextLines: lines(
      'Hospitality patterns separate weekly-changing content (menus, events) from stable brand pages so staff edits do not require developer tickets.',
    ),
  },
  'case-study-roof-monsters': {
    terms: ['roofing website preview', 'roofing lead capture', 'roofing local SEO pattern'],
    meta: 'Roof Monsters preview case study — roofing trust pages, inspection CTAs, and local SEO structure for Tampa Bay storm-season trades.',
    contextLines: lines(
      'Roofing preview builds document IA and conversion paths before public launch approval — trust, geography, and inspection intake first.',
    ),
  },
  'case-study-social-poster': {
    terms: ['social media manager automation', 'multi-brand social queue', 'social posting dashboard'],
    meta: 'Social Poster case study — multi-brand social queue, approvals, and showcase posting for service business growth stacks.',
    contextLines: lines(
      'Queued social posting keeps project proof visible between jobs — especially for trades where galleries drive quote quality.',
    ),
  },
  'case-study-referral-network-system': {
    terms: ['referral network case study', 'partner attribution system', 'referral payout tracking'],
    meta: 'Referral network case study — partner attribution, QR paths, consult tracking, and payout visibility across Tampa Bay trade partners.',
    contextLines: lines(
      'Referral networks scale when attribution is automatic — partners see leads and payouts without spreadsheet arguments.',
    ),
  },
};

function applySeoKeywords(page) {
  const seo = PAGE_SEO[page.slug];
  if (!seo) return page;

  if (seo.meta) page.meta = seo.meta;
  if (seo.lead) page.lead = seo.lead;
  if (seo.terms?.length) page.seoTerms = seo.terms;

  const additions = seo.contextLines || (seo.contextLine ? [seo.contextLine] : []);
  if (additions.length) {
    page.context = page.context || { paragraphs: [] };
    page.context.paragraphs = page.context.paragraphs || [];
    additions.forEach((line) => {
      if (!page.context.paragraphs.some((p) => p.includes(line.slice(0, 48)))) {
        page.context.paragraphs.push(line);
      }
    });
  }

  return page;
}

module.exports = { PAGE_SEO, applySeoKeywords, trimMeta };
