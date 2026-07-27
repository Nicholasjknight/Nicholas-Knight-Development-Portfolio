'use strict';

const Stripe = require('stripe');
const { neon } = require('@neondatabase/serverless');
const {
    isStaticApprovedPayoutAttribution,
    normalizeOffer,
    normalizeSlug
} = require('./_lib/referral-roster');
const { creditPaidSession: creditPixelForgeSession } = require('./_lib/pixelforge-billing');

const HANDLED_EVENT_TYPES = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'customer.subscription.updated',
    'customer.subscription.deleted'
]);
const AUTOVID_FREE_LIMIT = 20;
const AUTOVID_PLANS = {
    credits_5: { credits: 5, mode: 'payment' },
    credits_12: { credits: 12, mode: 'payment' },
    monthly_unlimited: { credits: 0, mode: 'subscription' }
};

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

async function readRawBody(req) {
    if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
    if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
    if (req.rawBody instanceof Uint8Array) return Buffer.from(req.rawBody);

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

function normStr(value, maxLength) {
    if (typeof value !== 'string') return null;
    const normalized = value.replace(/[<>"']/g, '').trim().slice(0, maxLength);
    return normalized || null;
}

function normInt(value) {
    const num = parseInt(value, 10);
    return Number.isFinite(num) ? num : null;
}

function normMachineId(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function normAutovidQuantity(value) {
    const quantity = parseInt(value, 10);
    if (!Number.isFinite(quantity)) return 1;
    return Math.max(1, Math.min(20, quantity));
}

function normAutovidPlan(value) {
    return typeof value === 'string' && AUTOVID_PLANS[value] ? value : 'credits_5';
}

async function ensureAutovidTables(sql) {
    await sql`
        CREATE TABLE IF NOT EXISTS autovid_license_accounts (
            machine_id text PRIMARY KEY,
            free_used integer NOT NULL DEFAULT 0,
            credits integer NOT NULL DEFAULT 0,
            email text,
            stripe_customer_id text,
            stripe_subscription_id text,
            subscription_status text,
            subscription_current_period_end timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
    `;

    await sql`ALTER TABLE autovid_license_accounts ADD COLUMN IF NOT EXISTS stripe_customer_id text`;
    await sql`ALTER TABLE autovid_license_accounts ADD COLUMN IF NOT EXISTS stripe_subscription_id text`;
    await sql`ALTER TABLE autovid_license_accounts ADD COLUMN IF NOT EXISTS subscription_status text`;
    await sql`ALTER TABLE autovid_license_accounts ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz`;

    await sql`
        CREATE TABLE IF NOT EXISTS autovid_processed_sessions (
            session_id text PRIMARY KEY,
            machine_id text NOT NULL REFERENCES autovid_license_accounts(machine_id) ON DELETE CASCADE,
            credits integer NOT NULL,
            amount_total integer,
            currency text,
            plan_id text,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `;

    await sql`ALTER TABLE autovid_processed_sessions ADD COLUMN IF NOT EXISTS plan_id text`;
}

async function creditAutovidSession(sql, session) {
    const metadata = session.metadata || {};
    const machineId = normMachineId(metadata.machine_id);
    if (!machineId) {
        return { skipped: true, reason: 'Invalid Auto Vid machine id.' };
    }

    const planId = normAutovidPlan(metadata.plan_id || '');
    const plan = AUTOVID_PLANS[planId];
    const credits = plan.mode === 'subscription'
        ? 0
        : (plan.credits || normAutovidQuantity(metadata.credits || 1));
    const amountTotal = normInt(session.amount_total) || 0;
    const currency = typeof session.currency === 'string' ? session.currency : 'usd';
    const customerId = typeof session.customer === 'string' ? session.customer : '';
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : '';
    const email = normStr(
        (session.customer_details && session.customer_details.email) ||
        session.customer_email ||
        '',
        160
    );

    await ensureAutovidTables(sql);

    await sql`
        INSERT INTO autovid_license_accounts (machine_id, email)
        VALUES (${machineId}, ${email})
        ON CONFLICT (machine_id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, autovid_license_accounts.email),
            stripe_customer_id = COALESCE(${customerId || null}, autovid_license_accounts.stripe_customer_id),
            stripe_subscription_id = COALESCE(${subscriptionId || null}, autovid_license_accounts.stripe_subscription_id),
            updated_at = now()
    `;

    const inserted = await sql`
        INSERT INTO autovid_processed_sessions (session_id, machine_id, credits, amount_total, currency, plan_id)
        VALUES (${session.id}, ${machineId}, ${credits}, ${amountTotal}, ${currency}, ${planId})
        ON CONFLICT (session_id) DO NOTHING
        RETURNING session_id
    `;

    if (plan.mode === 'subscription') {
        let subscriptionStatus = 'active';
        let periodEnd = null;
        if (subscriptionId) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY, { apiVersion: '2025-03-31.basil' });
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                subscriptionStatus = subscription.status || subscriptionStatus;
                periodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : null;
            } catch (error) {
                console.error('[stripe-webhook] Auto Vid subscription retrieve failed:', error && error.message);
            }
        }
        await sql`
            UPDATE autovid_license_accounts
            SET subscription_status = ${subscriptionStatus},
                subscription_current_period_end = COALESCE(${periodEnd || null}::timestamptz, subscription_current_period_end),
                updated_at = now()
            WHERE machine_id = ${machineId}
        `;
    } else if (inserted.length) {
        await sql`
            UPDATE autovid_license_accounts
            SET credits = credits + ${credits}, updated_at = now()
            WHERE machine_id = ${machineId}
        `;
    }

    return { ok: true, credited: plan.mode === 'subscription' || inserted.length > 0, credits, plan_id: planId, free_limit: AUTOVID_FREE_LIMIT };
}

async function updateAutovidSubscription(sql, subscription) {
    const metadata = subscription.metadata || {};
    const machineId = normMachineId(metadata.machine_id);
    if (!machineId) {
        return { skipped: true, reason: 'No Auto Vid machine id on subscription.' };
    }
    const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
    await ensureAutovidTables(sql);
    await sql`
        INSERT INTO autovid_license_accounts
            (machine_id, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end)
        VALUES
            (${machineId}, ${typeof subscription.customer === 'string' ? subscription.customer : null},
             ${subscription.id}, ${subscription.status || ''}, ${periodEnd || null}::timestamptz)
        ON CONFLICT (machine_id) DO UPDATE SET
            stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, autovid_license_accounts.stripe_customer_id),
            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
            subscription_status = EXCLUDED.subscription_status,
            subscription_current_period_end = EXCLUDED.subscription_current_period_end,
            updated_at = now()
    `;
    return { ok: true, subscription_status: subscription.status || '', plan_id: normAutovidPlan(metadata.plan_id || '') };
}

function getBountyForAmount(grossAmountCents) {
    if (!grossAmountCents || grossAmountCents < 100) {
        return null;
    }

    // Special: for test/small sales under $500, pay 10% bounty
    if (grossAmountCents < 50000) {
        const pct = 0.10;
        const payout = Math.round(grossAmountCents * pct);
        return { payoutAmountCents: payout, tierLabel: '<$500 => 10%' };
    }

    if (grossAmountCents <= 99999) {
        return { payoutAmountCents: 5000, tierLabel: '$500-$999 => $50' };
    }

    if (grossAmountCents <= 199999) {
        return { payoutAmountCents: 15000, tierLabel: '$1,000-$1,999 => $150' };
    }

    if (grossAmountCents <= 499999) {
        return { payoutAmountCents: 25000, tierLabel: '$2,000-$4,999 => $250' };
    }

    return { payoutAmountCents: 50000, tierLabel: '$5,000+ => $500' };
}

async function queueAutonomousServiceOrder(sql, session) {
    const metadata = session.metadata || {};
    const sku = normStr(metadata.sku, 80);
    const fulfillment = normStr(metadata.fulfillment, 80);
    const buyerEmail = normStr(
        (session.customer_details && session.customer_details.email) || metadata.buyerEmail || session.customer_email || '',
        160
    );
    if (!sku || !fulfillment || !buyerEmail) {
        return { ok: false, error: 'Paid autonomous-service session is missing required metadata.' };
    }
    let inputs = {};
    try {
        inputs = metadata.inputsJson ? JSON.parse(metadata.inputsJson) : {};
    } catch (_) {
        return { ok: false, error: 'Paid autonomous-service session has invalid input metadata.' };
    }
    await sql`CREATE TABLE IF NOT EXISTS autonomous_service_orders (
        id text PRIMARY KEY, sku text NOT NULL, fulfillment text NOT NULL, buyer_email text NOT NULL,
        inputs jsonb NOT NULL DEFAULT '{}'::jsonb, payment_intent_id text, amount_total integer NOT NULL DEFAULT 0,
        currency text NOT NULL DEFAULT 'usd', status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
        lease_until timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(), last_error text,
        result jsonb, completed_at timestamptz, refunded_at timestamptz, stripe_refund_id text,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : null;
    const initialStatus = fulfillment === 'full_access_gsc_audit' ? 'awaiting_access' : 'pending';
    const inserted = await sql`INSERT INTO autonomous_service_orders
        (id,sku,fulfillment,buyer_email,inputs,payment_intent_id,amount_total,currency,status)
        VALUES (${session.id},${sku},${fulfillment},${buyerEmail},${JSON.stringify(inputs)}::jsonb,${paymentIntent},${normInt(session.amount_total) || 0},${session.currency || 'usd'},${initialStatus})
        ON CONFLICT (id) DO NOTHING RETURNING id`;
    return { ok: true, queued: inserted.length > 0, order_id: session.id, status: initialStatus };
}

async function ensurePartnerTermsTable(sql) {
    await sql`
        CREATE TABLE IF NOT EXISTS kl_referral_partner_terms (
            partner_slug        VARCHAR(80) PRIMARY KEY,
            partner_name        VARCHAR(120),
            commission_percent  NUMERIC(6,3) NOT NULL DEFAULT 0,
            is_active           BOOLEAN NOT NULL DEFAULT TRUE,
            notes               TEXT,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`ALTER TABLE kl_referral_partner_terms ADD COLUMN IF NOT EXISTS latest_offer VARCHAR(80)`;
}

async function isApprovedPayoutAttribution(sql, partnerSlug, offerCode) {
    if (!partnerSlug) return false;
    const normalizedSlug = normalizeSlug(partnerSlug);
    const normalizedOffer = normalizeOffer(offerCode);
    if (!normalizedSlug) return false;

    try {
        await ensurePartnerTermsTable(sql);
        const [partner] = await sql`
            SELECT latest_offer, is_active
            FROM kl_referral_partner_terms
            WHERE partner_slug = ${normalizedSlug}
            LIMIT 1
        `;
        if (partner) {
            if (partner.is_active === false) return false;
            const expectedOffer = normalizeOffer(partner.latest_offer || '');
            return !expectedOffer || !normalizedOffer || expectedOffer === normalizedOffer;
        }
    } catch (error) {
        console.error('[stripe-webhook] Partner approval lookup failed:', error && error.message);
    }

    return isStaticApprovedPayoutAttribution(partnerSlug, offerCode);
}

async function ensurePayout(sql, referralEventId, partnerSlug, offerCode, grossAmountCents, contactEmail) {
    if (!referralEventId || !partnerSlug || !grossAmountCents || grossAmountCents <= 0 || !contactEmail) {
        return;
    }

    if (!await isApprovedPayoutAttribution(sql, partnerSlug, offerCode)) {
        return;
    }

    const [alreadyQualified] = await sql`
        SELECT id
        FROM kl_referral_events
        WHERE event_type = 'payment_completed'
          AND referral_partner = ${partnerSlug}
          AND contact_email = ${contactEmail}
          AND id <> ${referralEventId}
        LIMIT 1
    `;

    if (alreadyQualified) {
        return;
    }

    const bounty = getBountyForAmount(grossAmountCents);
    if (!bounty) {
        return;
    }

    await sql`
        INSERT INTO kl_referral_payouts
            (referral_event_id, partner_slug, gross_amount_cents, commission_percent, commission_amount_cents, payout_status, payout_note)
        VALUES
            (${referralEventId}, ${partnerSlug}, ${grossAmountCents}, 0, ${bounty.payoutAmountCents}, 'pending_review', ${'Flat bounty tier: ' + bounty.tierLabel + ' - pending admin review'})
        ON CONFLICT (referral_event_id) DO NOTHING
    `;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const databaseUrl = process.env.KL_DATABASE_URL || process.env.DATABASE_URL;

    if (!stripeSecretKey || !webhookSecret || !databaseUrl) {
        return sendJson(res, 503, { error: 'Stripe webhook is not configured.' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return sendJson(res, 400, { error: 'Missing Stripe signature.' });
    }

    let event;
    try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-03-31.basil' });
        const rawBody = await readRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
        console.error('[stripe-webhook] Signature verification failed:', error && error.message);
        return sendJson(res, 400, { error: 'Invalid Stripe signature.' });
    }

    if (!HANDLED_EVENT_TYPES.has(event.type)) {
        return sendJson(res, 200, { received: true, ignored: true });
    }

    const session = event.data && event.data.object ? event.data.object : null;
    const metadata = session && session.metadata ? session.metadata : {};

    if (!session) {
        return sendJson(res, 200, { received: true, skipped: true, reason: 'No checkout session payload.' });
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        try {
            const sql = neon(databaseUrl);
            const result = await updateAutovidSubscription(sql, session);
            return sendJson(res, 200, { received: true, autovid: true, ...result });
        } catch (error) {
            console.error('[stripe-webhook] Auto Vid subscription update failed:', error && error.message);
            return sendJson(res, 500, { error: 'Failed to record Auto Vid subscription update.' });
        }
    }

    if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
        return sendJson(res, 200, {
            received: true,
            skipped: true,
            reason: 'Checkout completed before payment settled.'
        });
    }

    if (metadata.app === 'autonomous_service') {
        try {
            const sql = neon(databaseUrl);
            const result = await queueAutonomousServiceOrder(sql, session);
            if (!result.ok) return sendJson(res, 400, { error: result.error });
            return sendJson(res, 200, { received: true, autonomous_service: true, ...result });
        } catch (error) {
            console.error('[stripe-webhook] Autonomous service queue failed:', error && error.message);
            return sendJson(res, 500, { error: 'Failed to queue autonomous service order.' });
        }
    }

    if (metadata.app === 'autovid_compiler') {
        try {
            const sql = neon(databaseUrl);
            const result = await creditAutovidSession(sql, session);
            return sendJson(res, 200, { received: true, autovid: true, ...result });
        } catch (error) {
            console.error('[stripe-webhook] Auto Vid credit failed:', error && error.message);
            return sendJson(res, 500, { error: 'Failed to record Auto Vid credit.' });
        }
    }

    if (metadata.app === 'pixelforge_ai') {
        try {
            const sql = neon(databaseUrl);
            const result = await creditPixelForgeSession(sql, session);
            if (!result.ok) {
                console.error('[stripe-webhook] PixelForge session rejected:', result.error || 'unknown error');
                return sendJson(res, 400, { error: result.error || 'PixelForge session was rejected.' });
            }
            return sendJson(res, 200, { received: true, pixelforge: true, ...result });
        } catch (error) {
            console.error('[stripe-webhook] PixelForge credit failed:', error && error.message);
            return sendJson(res, 500, { error: 'Failed to record PixelForge credit.' });
        }
    }

    const referralPartner = normalizeSlug(normStr(metadata.referralPartner, 80) || '');
    const referralOffer = normalizeOffer(normStr(metadata.referralOffer, 80) || '');

    if (!referralPartner && !referralOffer) {
        return sendJson(res, 200, { received: true, skipped: true, reason: 'No attribution metadata.' });
    }

    const amountCents = normInt(session.amount_total) || 0;
    const paymentType = metadata.paymentType === 'invoice_payment' ? 'invoice_payment' : 'starter_package';
    const packageName = normStr(
        metadata.resolvedPackageKey || metadata.packageKey || metadata.packageName || (paymentType === 'invoice_payment'
            ? 'invoice:' + (metadata.invoiceNumber || 'payment')
            : 'starter_checkout'),
        120
    );
    const contactEmail = normStr(
        (session.customer_details && session.customer_details.email) ||
        metadata.intakeEmail ||
        metadata.clientEmail ||
        session.customer_email ||
        '',
        160
    );
    const contactName = normStr(
        (session.customer_details && session.customer_details.name) ||
        metadata.contactName ||
        metadata.clientName ||
        '',
        120
    );
    const utmMedium = normStr(metadata.utmMedium, 80);
    const utmCampaign = normStr(metadata.utmCampaign, 80);
    const firstUrl = normStr(metadata.utmFirstUrl, 300);
    const sessionId = normStr(metadata.referralSessionId, 64);
    const externalEventId = normStr(session.id, 160);
    const pagePath = paymentType === 'invoice_payment' ? '/pay-invoice' : '/pricing';

    try {
        const sql = neon(databaseUrl);

        const inserted = await sql`
            INSERT INTO kl_referral_events
                (event_type, referral_partner, referral_offer, utm_medium, utm_campaign,
                 first_url, page_path, contact_email, contact_name, package_name,
                 amount_cents, event_source, external_event_id, session_id)
            VALUES
                ('payment_completed', ${referralPartner}, ${referralOffer}, ${utmMedium}, ${utmCampaign},
                 ${firstUrl}, ${pagePath}, ${contactEmail}, ${contactName}, ${packageName},
                 ${amountCents}, ${paymentType}, ${externalEventId}, ${sessionId})
            ON CONFLICT (external_event_id) DO NOTHING
            RETURNING id
        `;

        let referralEventId = inserted.length ? inserted[0].id : null;
        if (!referralEventId && externalEventId) {
            const [existing] = await sql`
                SELECT id
                FROM kl_referral_events
                WHERE external_event_id = ${externalEventId}
                LIMIT 1
            `;
            referralEventId = existing ? existing.id : null;
        }

        await ensurePayout(sql, referralEventId, referralPartner, referralOffer, amountCents, contactEmail);

        return sendJson(res, 200, { received: true, ok: true });
    } catch (error) {
        console.error('[stripe-webhook] DB write failed:', error && error.message);
        return sendJson(res, 500, { error: 'Failed to record Stripe payment.' });
    }
};
