'use strict';

const Stripe = require('stripe');
const { SERVICES } = require('./service-catalog');

const ALLOWED_ORIGINS = new Set(['https://knightlogics.com', 'https://www.knightlogics.com']);
const LOCAL_ORIGIN = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/;
const SUPPORTED_NICHES = new Set(['accounting', 'automotive', 'cleaning', 'dental', 'electrical', 'hvac', 'insurance', 'landscaping', 'marketing', 'plumbing', 'property_management', 'real_estate', 'restaurant', 'roofing']);

function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

async function readJson(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    if (Buffer.byteLength(raw) > 32 * 1024) throw new Error('Request is too large.');
    return raw ? JSON.parse(raw) : {};
}

function clean(value, max = 180) {
    return typeof value === 'string' ? value.replace(/[<>"']/g, '').trim().slice(0, max) : '';
}

function originOf(req) {
    try { return new URL(typeof req.headers.origin === 'string' ? req.headers.origin : '').origin; } catch (_) { return ''; }
}

function allowedOrigin(origin) {
    return ALLOWED_ORIGINS.has(origin) || (process.env.NODE_ENV !== 'production' && LOCAL_ORIGIN.test(origin));
}

const SUCCESS_PATHS = Object.freeze({
    ai_site_health_5: '/website-health-audit',
    agency_white_label_health_5: '/white-label-website-audit',
    local_opportunity_50: '/local-opportunity-pack',
    ai_search_readiness: '/ai-search-readiness',
    conversion_leak_audit: '/conversion-leak-audit',
    full_access_gsc_audit: '/full-access-website-audit'
});

function normalizeWebsiteUrl(value) {
    let parsed;
    try { parsed = new URL(value); } catch (_) { throw new Error('Enter a valid public website URL.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw new Error('Enter a public HTTP or HTTPS website URL.');
    }
    return parsed;
}

function normalizeInputs(service, body) {
    const input = {};
    for (const key of service.inputKeys) input[key] = clean(body[key], key === 'websiteUrl' ? 300 : 160);
    if (service.fulfillment === 'paid_external_audit' || service.fulfillment === 'full_access_gsc_audit') {
        normalizeWebsiteUrl(input.websiteUrl);
        if (input.clientName.length < 2) throw new Error('Enter the client or business name.');
        if (service.sku.startsWith('agency_') && input.agencyName.length < 2) throw new Error('Enter the agency name for the report.');
    }
    if (service.fulfillment === 'paid_module_evidence_pack') {
        normalizeWebsiteUrl(input.websiteUrl);
    }
    if (service.fulfillment === 'full_access_gsc_audit') {
        if (input.gscProperty.length < 3) throw new Error('Enter the Search Console domain or URL-prefix property.');
    }
    if (service.fulfillment === 'prospect_opportunity_pack') {
        input.targetNiche = input.targetNiche.toLowerCase();
        if (!SUPPORTED_NICHES.has(input.targetNiche)) throw new Error('Select a supported niche.');
        if (input.location.length < 3) throw new Error('Enter a US city and state.');
        const radius = Number.parseInt(input.radiusMiles, 10);
        if (![10, 15, 25, 50].includes(radius)) throw new Error('Select a valid radius.');
        input.radiusMiles = String(radius);
    }
    return input;
}

module.exports = async function handler(req, res) {
    const origin = originOf(req);
    if (origin && allowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
        if (!allowedOrigin(origin)) return sendJson(res, 403, { error: 'Origin is not allowed.' });
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return sendJson(res, 204, {});
    }
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
    if (origin && !allowedOrigin(origin)) return sendJson(res, 403, { error: 'Origin is not allowed.' });
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!key) return sendJson(res, 503, { error: 'Checkout is temporarily unavailable.' });

    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message || 'Invalid request.' }); }
    const service = SERVICES[clean(body.sku, 80)];
    const buyerEmail = clean(body.buyerEmail, 160).toLowerCase();
    if (!service) return sendJson(res, 400, { error: 'Unknown service package.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return sendJson(res, 400, { error: 'Enter a valid delivery email.' });
    if (body.acceptedTerms !== true) return sendJson(res, 400, { error: 'Accept the service terms before checkout.' });

    let inputs;
    try { inputs = normalizeInputs(service, body); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    const metadata = {
        app: 'autonomous_service',
        sku: service.sku,
        fulfillment: service.fulfillment,
        buyerEmail,
        offerVersion: service.offerVersion,
        inputsJson: JSON.stringify(inputs)
    };
    if (metadata.inputsJson.length > 480) return sendJson(res, 400, { error: 'Order details are too long.' });

    const host = origin && allowedOrigin(origin) ? origin : 'https://knightlogics.com';
    try {
        const stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: buyerEmail,
            customer_creation: 'always',
            line_items: [{ price_data: { currency: 'usd', unit_amount: service.amount, product_data: { name: service.name, description: service.description } }, quantity: 1 }],
            metadata,
            payment_intent_data: { metadata: { app: metadata.app, sku: metadata.sku, offerVersion: metadata.offerVersion } },
            success_url: `${host}${SUCCESS_PATHS[service.sku] || '/service-packages'}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${host}${SUCCESS_PATHS[service.sku] || '/service-packages'}?canceled=1`
        });
        return sendJson(res, 200, { url: session.url });
    } catch (error) {
        console.error('[service-checkout] Stripe session failed:', error && error.message);
        return sendJson(res, 502, { error: 'Stripe checkout could not be started.' });
    }
};
