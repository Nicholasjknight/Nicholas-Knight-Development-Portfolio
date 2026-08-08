'use strict';

const Stripe = require('stripe');
const { neon } = require('@neondatabase/serverless');
const {
    commitReservation,
    countRecentCheckoutStarts,
    creditPaidSession,
    ensureTables,
    getStatus,
    getPlan,
    normEmail,
    normMachineId,
    normPlanId,
    recordEvent,
    releaseReservation,
    reserveCredits
} = require('./pixelforge-billing');

const MAX_JSON_BODY_BYTES = 16 * 1024;
const VALID_ACTIONS = new Set([
    'status',
    'reserve',
    'commit',
    'release',
    'create_checkout',
    'confirm_session',
    'event'
]);
const ALLOWED_ORIGINS = new Set([
    'https://knightlogics.com',
    'https://www.knightlogics.com'
]);
const LOCAL_DEV_ORIGIN_PATTERN = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/;

function isAllowedOrigin(origin) {
    return !origin || ALLOWED_ORIGINS.has(origin) || LOCAL_DEV_ORIGIN_PATTERN.test(origin);
}

function sendJson(res, statusCode, payload, origin = '') {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Vary', 'Origin');
    }
    res.end(JSON.stringify(payload));
}

async function readJson(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.rawBody)) {
        const raw = req.rawBody.toString('utf8');
        return raw ? JSON.parse(raw) : {};
    }
    if (typeof req.rawBody === 'string') return req.rawBody ? JSON.parse(req.rawBody) : {};

    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buffer.length;
        if (total > MAX_JSON_BODY_BYTES) {
            const error = new Error('Request body too large.');
            error.statusCode = 413;
            throw error;
        }
        chunks.push(buffer);
    }
    if (!chunks.length) return {};
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function getSql() {
    const databaseUrl = process.env.KL_DATABASE_URL || process.env.DATABASE_URL;
    return databaseUrl ? neon(databaseUrl) : null;
}

function getStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    return secretKey ? new Stripe(secretKey, { apiVersion: '2025-03-31.basil' }) : null;
}

function normalizeLoopbackRedirect(value, expectedPath) {
    if (typeof value !== 'string' || value.length > 500) return null;
    try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();
        const port = Number.parseInt(url.port, 10);
        if (url.protocol !== 'http:') return null;
        if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) return null;
        if (!Number.isFinite(port) || port < 1024 || port > 65535) return null;
        if (url.pathname !== expectedPath) return null;
        if (expectedPath === '/payment_success' && url.searchParams.get('session_id') !== '{CHECKOUT_SESSION_ID}') {
            return null;
        }
        // Preserve Stripe's literal placeholder; URL.toString() percent-encodes braces.
        return value.trim();
    } catch (_error) {
        return null;
    }
}

async function createCheckout(sql, stripe, req, machineId, body) {
    if (!stripe) return { ok: false, statusCode: 503, error: 'Stripe is not configured.' };

    const planId = normPlanId(body.plan_id);
    if (!planId) return { ok: false, statusCode: 400, error: 'Choose a valid PixelForge credit package.' };

    const successUrl = normalizeLoopbackRedirect(body.success_url, '/payment_success');
    const cancelUrl = normalizeLoopbackRedirect(body.cancel_url, '/payment_cancel');
    if (!successUrl || !cancelUrl) {
        return { ok: false, statusCode: 400, error: 'Checkout return URL is invalid.' };
    }

    const recentStarts = await countRecentCheckoutStarts(sql, machineId, 10);
    if (recentStarts >= 5) {
        return { ok: false, statusCode: 429, error: 'Too many checkout attempts. Wait a few minutes and try again.' };
    }

    const plan = getPlan(planId);
    const email = normEmail(body.email || '');
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_creation: 'always',
        customer_email: email || undefined,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: plan.amount,
                    product_data: {
                        name: `PixelForge AI - ${plan.label}`,
                        description: plan.entitlement === 'pro_lifetime'
                            ? 'One-time PixelForge AI Pro license for local AI enhancement.'
                            : `${plan.credits} credits for local AI video enhancement.`
                    }
                }
            }
        ],
        metadata: {
            app: 'pixelforge_ai',
            machine_id: machineId,
            plan_id: planId,
            credits: String(plan.credits),
            entitlement: plan.entitlement || 'credits',
            paymentType: 'desktop_app_credit_pack'
        },
        success_url: successUrl,
        cancel_url: cancelUrl
    });

    await recordEvent(
        sql,
        machineId,
        'checkout_started',
        String(body.event_id || ''),
        String(body.app_version || ''),
        { plan_id: planId }
    );

    return {
        ok: true,
        session_id: session.id,
        url: session.url,
        plan_id: planId,
        credits: plan.credits,
        amount_cents: plan.amount
    };
}

async function confirmCheckout(sql, stripe, machineId, body) {
    if (!stripe) return { ok: false, statusCode: 503, error: 'Stripe is not configured.' };
    const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : '';
    if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
        return { ok: false, statusCode: 400, error: 'Invalid checkout session.' };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await creditPaidSession(sql, session, machineId);
    if (result.ok) {
        await recordEvent(
            sql,
            machineId,
            'checkout_confirmed',
            String(body.event_id || ''),
            String(body.app_version || ''),
            { plan_id: result.plan_id || '' }
        );
    }
    return { ...result, statusCode: result.ok ? 200 : (result.payment_required ? 402 : 400) };
}

module.exports = async function handler(req, res) {
    const origin = req.headers.origin || '';
    if (!isAllowedOrigin(origin)) {
        return sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    }
    if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true }, origin);
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendJson(res, 405, { ok: false, error: 'Method not allowed.' }, origin);
    }

    let body;
    try {
        body = await readJson(req);
    } catch (error) {
        return sendJson(res, error.statusCode || 400, { ok: false, error: 'Invalid JSON body.' }, origin);
    }

    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const machineId = normMachineId(body.machine_id);
    if (!VALID_ACTIONS.has(action)) return sendJson(res, 400, { ok: false, error: 'Invalid action.' }, origin);
    if (!machineId) return sendJson(res, 400, { ok: false, error: 'Invalid machine id.' }, origin);

    const sql = getSql();
    if (!sql) return sendJson(res, 503, { ok: false, error: 'PixelForge billing database is not configured.' }, origin);

    try {
        await ensureTables(sql);

        if (action === 'status') {
            return sendJson(res, 200, await getStatus(sql, machineId), origin);
        }

        if (action === 'reserve') {
            const result = await reserveCredits(sql, machineId, body.credits, body.metadata);
            return sendJson(res, result.ok ? 200 : (result.payment_required ? 402 : 400), result, origin);
        }

        if (action === 'commit') {
            const result = await commitReservation(sql, machineId, body.reservation_id);
            return sendJson(res, result.ok ? 200 : 409, result, origin);
        }

        if (action === 'release') {
            const result = await releaseReservation(sql, machineId, body.reservation_id);
            return sendJson(res, result.ok ? 200 : 409, result, origin);
        }

        if (action === 'event') {
            const result = await recordEvent(
                sql,
                machineId,
                body.event_name,
                body.event_id,
                body.app_version,
                body.metadata
            );
            return sendJson(res, result.ok ? 200 : 400, result, origin);
        }

        if (action === 'create_checkout') {
            const result = await createCheckout(sql, getStripe(), req, machineId, body);
            const statusCode = result.statusCode || (result.ok ? 200 : 503);
            delete result.statusCode;
            return sendJson(res, statusCode, result, origin);
        }

        if (action === 'confirm_session') {
            const result = await confirmCheckout(sql, getStripe(), machineId, body);
            const statusCode = result.statusCode || (result.ok ? 200 : 402);
            delete result.statusCode;
            return sendJson(res, statusCode, result, origin);
        }

        return sendJson(res, 400, { ok: false, error: 'Unhandled action.' }, origin);
    } catch (error) {
        console.error('[pixelforge-license]', error && error.message);
        return sendJson(res, 500, { ok: false, error: 'PixelForge billing service failed.' }, origin);
    }
};

module.exports._test = {
    isAllowedOrigin,
    normalizeLoopbackRedirect
};
