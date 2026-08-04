'use strict';

const SERVICES = Object.freeze({
    ai_site_health_5: Object.freeze({
        sku: 'ai_site_health_5',
        name: 'AI Search + Website Health Audit',
        description: 'Outside-in review of up to five public pages with SEO, AI-search, accessibility, performance, schema, and security evidence.',
        amount: 3900,
        inputKeys: ['clientName', 'websiteUrl'],
        fulfillment: 'paid_external_audit',
        offerVersion: '2026-07-v1'
    }),
    agency_white_label_health_5: Object.freeze({
        sku: 'agency_white_label_health_5',
        name: 'White-Label AI Search + Website Health Audit',
        description: 'Same $39 outside-in health engine with your agency name on the PDF cover — not a deeper audit.',
        amount: 4900,
        inputKeys: ['clientName', 'websiteUrl', 'agencyName'],
        fulfillment: 'paid_external_audit',
        offerVersion: '2026-08-v1'
    }),
    local_opportunity_50: Object.freeze({
        sku: 'local_opportunity_50',
        name: '50-Prospect Local Opportunity Intelligence Pack',
        description: 'Niche + location prospect pack with contact enrichment, email MX verification, phone format validation, and credibility ranking. CSV + HTML.',
        amount: 4900,
        inputKeys: ['targetNiche', 'location', 'radiusMiles'],
        fulfillment: 'prospect_opportunity_pack',
        offerVersion: '2026-08-v2'
    }),
    ai_search_readiness: Object.freeze({
        sku: 'ai_search_readiness',
        name: 'AI Search Readiness Pack',
        description: 'Outside-in GEO/AEO signals: llms.txt, FAQPage, AI crawler policy, robots, and schema readiness evidence. PDF + HTML + JSON.',
        amount: 7900,
        inputKeys: ['websiteUrl'],
        fulfillment: 'paid_module_evidence_pack',
        offerVersion: 'ai-search-ready-v1'
    }),
    conversion_leak_audit: Object.freeze({
        sku: 'conversion_leak_audit',
        name: 'Conversion Leak Audit',
        description: 'Playwright scan for broken forms, weak CTAs, phones, and missing trust cues. PDF + HTML + JSON findings.',
        amount: 9900,
        inputKeys: ['websiteUrl'],
        fulfillment: 'paid_module_evidence_pack',
        offerVersion: 'conversion-leak-v1'
    }),
    full_access_gsc_audit: Object.freeze({
        sku: 'full_access_gsc_audit',
        name: 'Full-Access Search Console Pack',
        description: 'After Full GSC access for audits@knightlogics.com: 90-day Search Analytics, sitemaps, URL Inspection sample, analysis findings, plus bundled outside-in Playwright/axe/Lighthouse health PDF. Auto-refund if access is not granted within 14 days.',
        amount: 29900,
        inputKeys: ['clientName', 'websiteUrl', 'gscProperty'],
        fulfillment: 'full_access_gsc_audit',
        offerVersion: '2026-07-v2'
    })
});

module.exports = { SERVICES };
