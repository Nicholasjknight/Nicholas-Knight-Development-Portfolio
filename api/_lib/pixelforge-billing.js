'use strict';

const crypto = require('crypto');

const FREE_TRIAL_CREDITS = 20;
const MAX_RENDER_CREDITS = 5000;
const RESERVATION_TTL_MINUTES = 24 * 60;
const PRO_LIFETIME_PLAN_ID = 'pro_lifetime';

const PIXELFORGE_PLANS = Object.freeze({
    starter_32: Object.freeze({
        id: 'starter_32',
        label: '32 Credits',
        credits: 32,
        amount: 500,
        badge: 'Starter'
    }),
    creator_68: Object.freeze({
        id: 'creator_68',
        label: '68 Credits',
        credits: 68,
        amount: 1000,
        badge: 'Most Popular'
    }),
    pro_144: Object.freeze({
        id: 'pro_144',
        label: '144 Credits',
        credits: 144,
        amount: 2000,
        badge: 'Best Value'
    })
});

const TELEMETRY_EVENTS = new Set([
    'first_launch',
    'app_open',
    'render_reserved',
    'render_completed',
    'render_failed',
    'render_cancelled',
    'checkout_started',
    'checkout_confirmed',
    'checkout_cancelled'
]);

function normMachineId(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function normEmail(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.replace(/[<>"']/g, '').trim().toLowerCase().slice(0, 160);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function normPlanId(value) {
    return typeof value === 'string' && getPlan(value) ? value : null;
}

function getLifetimeProPlan() {
    const amount = Number.parseInt(process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS || '', 10);
    if (!Number.isFinite(amount) || amount < 1000 || amount > 500000) return null;
    return Object.freeze({
        id: PRO_LIFETIME_PLAN_ID,
        label: 'PixelForge AI Pro',
        credits: 0,
        amount,
        badge: 'One-time license',
        entitlement: PRO_LIFETIME_PLAN_ID
    });
}

function getPlan(planId) {
    if (typeof planId !== 'string') return null;
    return PIXELFORGE_PLANS[planId] || (planId === PRO_LIFETIME_PLAN_ID ? getLifetimeProPlan() : null);
}

function normCredits(value) {
    const credits = Number.parseInt(value, 10);
    if (!Number.isFinite(credits) || credits < 1 || credits > MAX_RENDER_CREDITS) return null;
    return credits;
}

function normReservationId(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return /^pfr_[a-f0-9]{32}$/.test(normalized) ? normalized : null;
}

function normEventId(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return /^[a-f0-9-]{16,64}$/.test(normalized) ? normalized : null;
}

function normTelemetryEvent(value) {
    return typeof value === 'string' && TELEMETRY_EVENTS.has(value) ? value : null;
}

function cleanTelemetryMetadata(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const allowed = new Set([
        'profile', 'content_type', 'model', 'scale', 'duration_bucket',
        'source_size', 'target_fps', 'interpolation', 'outcome', 'error_code',
        'reservation_id', 'plan_id'
    ]);
    const cleaned = {};
    for (const [key, raw] of Object.entries(value)) {
        if (!allowed.has(key)) continue;
        if (typeof raw === 'boolean' || (typeof raw === 'number' && Number.isFinite(raw))) {
            cleaned[key] = raw;
            continue;
        }
        if (typeof raw === 'string') cleaned[key] = raw.replace(/[<>]/g, '').trim().slice(0, 120);
    }
    return cleaned;
}

function publicPlans() {
    const plans = Object.values(PIXELFORGE_PLANS);
    const lifetime = getLifetimeProPlan();
    if (lifetime) plans.push(lifetime);
    return plans.map((plan) => ({
        id: plan.id,
        label: plan.label,
        credits: plan.credits,
        amount_cents: plan.amount,
        badge: plan.badge,
        entitlement: plan.entitlement || 'credits'
    }));
}

async function ensureTables(sql) {
    await sql`
        CREATE TABLE IF NOT EXISTS pixelforge_accounts (
            machine_id text PRIMARY KEY,
            free_trial_total integer NOT NULL DEFAULT 20,
            free_trial_remaining integer NOT NULL DEFAULT 20,
            paid_credits integer NOT NULL DEFAULT 0,
            pro_lifetime boolean NOT NULL DEFAULT false,
            email text,
            stripe_customer_id text,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            last_seen_at timestamptz NOT NULL DEFAULT now()
        )
    `;
    await sql`ALTER TABLE pixelforge_accounts ADD COLUMN IF NOT EXISTS pro_lifetime boolean NOT NULL DEFAULT false`;

    await sql`
        CREATE TABLE IF NOT EXISTS pixelforge_credit_reservations (
            reservation_id text PRIMARY KEY,
            machine_id text NOT NULL REFERENCES pixelforge_accounts(machine_id) ON DELETE CASCADE,
            credits integer NOT NULL,
            free_credits integer NOT NULL DEFAULT 0,
            paid_credits integer NOT NULL DEFAULT 0,
            status text NOT NULL DEFAULT 'reserved',
            render_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            expires_at timestamptz NOT NULL,
            committed_at timestamptz,
            released_at timestamptz
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS pixelforge_reservations_machine_status_idx ON pixelforge_credit_reservations (machine_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS pixelforge_reservations_expiry_idx ON pixelforge_credit_reservations (expires_at) WHERE status = 'reserved'`;

    await sql`
        CREATE TABLE IF NOT EXISTS pixelforge_processed_sessions (
            session_id text PRIMARY KEY,
            machine_id text NOT NULL REFERENCES pixelforge_accounts(machine_id) ON DELETE CASCADE,
            credits integer NOT NULL,
            amount_total integer NOT NULL,
            currency text NOT NULL,
            plan_id text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS pixelforge_events (
            event_id text PRIMARY KEY,
            machine_id text NOT NULL REFERENCES pixelforge_accounts(machine_id) ON DELETE CASCADE,
            event_name text NOT NULL,
            app_version text,
            event_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS pixelforge_events_machine_created_idx ON pixelforge_events (machine_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS pixelforge_events_name_created_idx ON pixelforge_events (event_name, created_at DESC)`;
}

async function getAccount(sql, machineId, email = null) {
    const [account] = await sql`
        INSERT INTO pixelforge_accounts (machine_id, email)
        VALUES (${machineId}, ${email})
        ON CONFLICT (machine_id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, pixelforge_accounts.email),
            updated_at = now(),
            last_seen_at = now()
        RETURNING machine_id, free_trial_total, free_trial_remaining, paid_credits, pro_lifetime,
            email, stripe_customer_id, created_at, updated_at, last_seen_at
    `;
    return account;
}

function statusPayload(account, extras = {}) {
    const freeRemaining = Number(account.free_trial_remaining || 0);
    const paidCredits = Number(account.paid_credits || 0);
    const proActive = account.pro_lifetime === true;
    return {
        ok: true,
        machine_id: account.machine_id,
        credits: freeRemaining + paidCredits,
        paid_credits: paidCredits,
        pro_active: proActive,
        unlimited: proActive,
        free_trial_total: Number(account.free_trial_total || FREE_TRIAL_CREDITS),
        free_trial_remaining: freeRemaining,
        email_linked: Boolean(account.email),
        linked_email: account.email || '',
        plans: publicPlans(),
        ...extras
    };
}

async function releaseExpiredReservations(sql, machineId) {
    await sql`
        WITH expired AS (
            UPDATE pixelforge_credit_reservations
            SET status = 'expired', released_at = now()
            WHERE machine_id = ${machineId}
              AND status = 'reserved'
              AND expires_at <= now()
            RETURNING machine_id, free_credits, paid_credits
        ), totals AS (
            SELECT machine_id, SUM(free_credits)::integer AS free_credits,
                SUM(paid_credits)::integer AS paid_credits
            FROM expired
            GROUP BY machine_id
        )
        UPDATE pixelforge_accounts AS account
        SET free_trial_remaining = account.free_trial_remaining + totals.free_credits,
            paid_credits = account.paid_credits + totals.paid_credits,
            updated_at = now()
        FROM totals
        WHERE account.machine_id = totals.machine_id
    `;
}

async function getStatus(sql, machineId) {
    await releaseExpiredReservations(sql, machineId);
    const account = await getAccount(sql, machineId);
    return statusPayload(account);
}

async function reserveCredits(sql, machineId, creditsValue, metadata = {}) {
    const credits = normCredits(creditsValue);
    if (!credits) return { ok: false, error: 'Invalid render credit amount.' };

    await releaseExpiredReservations(sql, machineId);
    const currentAccount = await getAccount(sql, machineId);

    if (currentAccount.pro_lifetime === true) {
        const reservationId = `pfr_${crypto.randomBytes(16).toString('hex')}`;
        const cleanedMetadata = cleanTelemetryMetadata(metadata);
        const [reservation] = await sql`
            INSERT INTO pixelforge_credit_reservations
                (reservation_id, machine_id, credits, free_credits, paid_credits, render_metadata, expires_at)
            VALUES (${reservationId}, ${machineId}, ${credits}, 0, 0,
                ${JSON.stringify(cleanedMetadata)}::jsonb,
                now() + (${RESERVATION_TTL_MINUTES} * interval '1 minute'))
            RETURNING reservation_id, credits, expires_at
        `;
        return statusPayload(currentAccount, {
            reservation_id: reservation.reservation_id,
            reserved_credits: Number(reservation.credits || credits),
            expires_at: reservation.expires_at,
            entitlement: PRO_LIFETIME_PLAN_ID
        });
    }

    const reservationId = `pfr_${crypto.randomBytes(16).toString('hex')}`;
    const cleanedMetadata = cleanTelemetryMetadata(metadata);
    const rows = await sql`
        WITH balance AS MATERIALIZED (
            SELECT machine_id,
                LEAST(free_trial_remaining, ${credits})::integer AS free_take,
                (${credits} - LEAST(free_trial_remaining, ${credits}))::integer AS paid_take
            FROM pixelforge_accounts
            WHERE machine_id = ${machineId}
              AND (free_trial_remaining + paid_credits) >= ${credits}
            FOR UPDATE
        ), charged AS (
            UPDATE pixelforge_accounts AS account
            SET free_trial_remaining = account.free_trial_remaining - balance.free_take,
                paid_credits = account.paid_credits - balance.paid_take,
                updated_at = now(),
                last_seen_at = now()
            FROM balance
            WHERE account.machine_id = balance.machine_id
            RETURNING account.machine_id, account.free_trial_total,
                account.free_trial_remaining, account.paid_credits, account.pro_lifetime, account.email
        ), created AS (
            INSERT INTO pixelforge_credit_reservations
                (reservation_id, machine_id, credits, free_credits, paid_credits, render_metadata, expires_at)
            SELECT ${reservationId}, machine_id, ${credits}, free_take, paid_take,
                ${JSON.stringify(cleanedMetadata)}::jsonb,
                now() + (${RESERVATION_TTL_MINUTES} * interval '1 minute')
            FROM balance
            RETURNING reservation_id, credits, free_credits, paid_credits, expires_at
        )
        SELECT charged.machine_id, charged.free_trial_total, charged.free_trial_remaining,
            charged.paid_credits, charged.pro_lifetime, charged.email, created.reservation_id,
            created.credits AS reserved_credits, created.free_credits AS reserved_free_credits,
            created.paid_credits AS reserved_paid_credits, created.expires_at
        FROM charged CROSS JOIN created
    `;

    if (!rows.length) {
        const account = await getAccount(sql, machineId);
        return statusPayload(account, {
            ok: false,
            payment_required: true,
            error: 'Not enough credits for this render.'
        });
    }

    const row = rows[0];
    return statusPayload(row, {
        reservation_id: row.reservation_id,
        reserved_credits: Number(row.reserved_credits || credits),
        expires_at: row.expires_at
    });
}

async function commitReservation(sql, machineId, reservationValue) {
    const reservationId = normReservationId(reservationValue);
    if (!reservationId) return { ok: false, error: 'Invalid render reservation.' };

    const [reservation] = await sql`
        UPDATE pixelforge_credit_reservations
        SET status = 'committed', committed_at = COALESCE(committed_at, now())
        WHERE reservation_id = ${reservationId}
          AND machine_id = ${machineId}
          AND status = 'reserved'
          AND expires_at > now()
        RETURNING reservation_id, credits, status
    `;

    if (reservation) {
        const account = await getAccount(sql, machineId);
        return statusPayload(account, {
            reservation_id: reservationId,
            committed: true,
            committed_credits: Number(reservation.credits || 0)
        });
    }

    const [existing] = await sql`
        SELECT reservation_id, credits, status
        FROM pixelforge_credit_reservations
        WHERE reservation_id = ${reservationId} AND machine_id = ${machineId}
        LIMIT 1
    `;
    if (existing && existing.status === 'committed') {
        const account = await getAccount(sql, machineId);
        return statusPayload(account, {
            reservation_id: reservationId,
            committed: true,
            already_processed: true,
            committed_credits: Number(existing.credits || 0)
        });
    }
    return { ok: false, error: 'Render reservation is missing, released, or expired.' };
}

async function releaseReservation(sql, machineId, reservationValue) {
    const reservationId = normReservationId(reservationValue);
    if (!reservationId) return { ok: false, error: 'Invalid render reservation.' };

    const rows = await sql`
        WITH released AS (
            UPDATE pixelforge_credit_reservations
            SET status = 'released', released_at = COALESCE(released_at, now())
            WHERE reservation_id = ${reservationId}
              AND machine_id = ${machineId}
              AND status = 'reserved'
            RETURNING machine_id, credits, free_credits, paid_credits
        ), restored AS (
            UPDATE pixelforge_accounts AS account
            SET free_trial_remaining = account.free_trial_remaining + released.free_credits,
                paid_credits = account.paid_credits + released.paid_credits,
                updated_at = now()
            FROM released
            WHERE account.machine_id = released.machine_id
            RETURNING account.machine_id, account.free_trial_total,
                account.free_trial_remaining, account.paid_credits, account.pro_lifetime, account.email
        )
        SELECT restored.*, released.credits AS released_credits
        FROM restored CROSS JOIN released
    `;

    if (rows.length) {
        return statusPayload(rows[0], {
            reservation_id: reservationId,
            released: true,
            released_credits: Number(rows[0].released_credits || 0)
        });
    }

    const [existing] = await sql`
        SELECT status, credits
        FROM pixelforge_credit_reservations
        WHERE reservation_id = ${reservationId} AND machine_id = ${machineId}
        LIMIT 1
    `;
    if (existing && ['released', 'expired'].includes(existing.status)) {
        const account = await getAccount(sql, machineId);
        return statusPayload(account, {
            reservation_id: reservationId,
            released: true,
            already_processed: true,
            released_credits: Number(existing.credits || 0)
        });
    }
    return { ok: false, error: 'Render reservation was not found or was already committed.' };
}

async function recordEvent(sql, machineId, eventNameValue, eventIdValue, appVersion, metadata) {
    const eventName = normTelemetryEvent(eventNameValue);
    if (!eventName) return { ok: false, error: 'Invalid telemetry event.' };
    const eventId = normEventId(eventIdValue) || crypto.randomUUID();
    const version = typeof appVersion === 'string' ? appVersion.replace(/[^0-9A-Za-z._-]/g, '').slice(0, 32) : '';
    const cleanedMetadata = cleanTelemetryMetadata(metadata);

    await getAccount(sql, machineId);
    const inserted = await sql`
        INSERT INTO pixelforge_events (event_id, machine_id, event_name, app_version, event_metadata)
        VALUES (${eventId}, ${machineId}, ${eventName}, ${version || null}, ${JSON.stringify(cleanedMetadata)}::jsonb)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
    `;
    return { ok: true, recorded: inserted.length > 0, event_id: eventId };
}

async function countRecentCheckoutStarts(sql, machineId, minutes = 10) {
    const safeMinutes = Math.max(1, Math.min(60, Number.parseInt(minutes, 10) || 10));
    const [row] = await sql`
        SELECT COUNT(*)::integer AS count
        FROM pixelforge_events
        WHERE machine_id = ${machineId}
          AND event_name = 'checkout_started'
          AND created_at >= now() - (${safeMinutes} * interval '1 minute')
    `;
    return Number(row && row.count || 0);
}

async function creditPaidSession(sql, session, expectedMachineId = null) {
    const metadata = session && session.metadata ? session.metadata : {};
    const machineId = normMachineId(metadata.machine_id);
    const planId = normPlanId(metadata.plan_id);
    if (!machineId || (expectedMachineId && machineId !== expectedMachineId)) {
        return { ok: false, error: 'Checkout session does not match this device.' };
    }
    if (!planId || metadata.app !== 'pixelforge_ai') {
        return { ok: false, error: 'Checkout session is not a PixelForge purchase.' };
    }

    const plan = getPlan(planId);
    const amountTotal = Number(session.amount_total || 0);
    const currency = typeof session.currency === 'string' ? session.currency.toLowerCase() : 'usd';
    if (session.payment_status !== 'paid') {
        return { ok: false, payment_required: true, error: 'Payment has not completed yet.' };
    }
    if (currency !== 'usd' || amountTotal < plan.amount) {
        return { ok: false, error: 'Checkout amount does not match the selected PixelForge package.' };
    }

    const email = normEmail(
        (session.customer_details && session.customer_details.email) || session.customer_email || ''
    );
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    await getAccount(sql, machineId, email);
    await sql`
        UPDATE pixelforge_accounts
        SET stripe_customer_id = COALESCE(${customerId}, stripe_customer_id),
            email = COALESCE(${email}, email),
            updated_at = now()
        WHERE machine_id = ${machineId}
    `;

    const inserted = await sql`
        INSERT INTO pixelforge_processed_sessions
            (session_id, machine_id, credits, amount_total, currency, plan_id)
        VALUES (${session.id}, ${machineId}, ${plan.credits}, ${amountTotal}, ${currency}, ${planId})
        ON CONFLICT (session_id) DO NOTHING
        RETURNING session_id
    `;

    if (inserted.length) {
        if (plan.entitlement === PRO_LIFETIME_PLAN_ID) {
            await sql`
                UPDATE pixelforge_accounts
                SET pro_lifetime = true, updated_at = now()
                WHERE machine_id = ${machineId}
            `;
        } else {
            await sql`
                UPDATE pixelforge_accounts
                SET paid_credits = paid_credits + ${plan.credits}, updated_at = now()
                WHERE machine_id = ${machineId}
            `;
        }
    }

    const account = await getAccount(sql, machineId, email);
    return statusPayload(account, {
        paid: true,
        credited: inserted.length > 0,
        credited_credits: inserted.length ? plan.credits : 0,
        purchased_credits: plan.credits,
        entitlement: plan.entitlement || 'credits',
        already_processed: inserted.length === 0,
        plan_id: planId,
        session_id: session.id
    });
}

module.exports = {
    FREE_TRIAL_CREDITS,
    MAX_RENDER_CREDITS,
    PRO_LIFETIME_PLAN_ID,
    PIXELFORGE_PLANS,
    countRecentCheckoutStarts,
    creditPaidSession,
    ensureTables,
    getAccount,
    getLifetimeProPlan,
    getPlan,
    getStatus,
    normCredits,
    normEmail,
    normEventId,
    normMachineId,
    normPlanId,
    normReservationId,
    publicPlans,
    recordEvent,
    releaseReservation,
    reserveCredits,
    commitReservation,
    statusPayload
};
