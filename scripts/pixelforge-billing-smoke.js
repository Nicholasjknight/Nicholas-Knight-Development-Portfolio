'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const billing = require('../api/_lib/pixelforge-billing');
const handler = require('../api/_lib/pixelforge-license');

assert.strictEqual(billing.FREE_TRIAL_CREDITS, 20);
assert.deepStrictEqual(
    Object.fromEntries(Object.entries(billing.PIXELFORGE_PLANS).map(([id, plan]) => [id, [plan.credits, plan.amount]])),
    {
        starter_32: [32, 500],
        creator_68: [68, 1000],
        pro_144: [144, 2000]
    }
);
assert.strictEqual(billing.normPlanId('starter_32'), 'starter_32');
assert.strictEqual(billing.normPlanId('forged_9999'), null);
assert.strictEqual(billing.normCredits(1), 1);
assert.strictEqual(billing.normCredits(5001), null);
assert.strictEqual(billing.normMachineId('a'.repeat(64)), 'a'.repeat(64));
assert.strictEqual(billing.normMachineId('not-a-machine-id'), null);
assert.strictEqual(billing.normEmail(' Buyer@Example.com '), 'buyer@example.com');
assert.strictEqual(billing.normEmail('not-an-email'), null);
const previousProPrice = process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS;
try {
    delete process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS;
    assert.strictEqual(billing.getLifetimeProPlan(), null);
    assert.strictEqual(billing.normPlanId('pro_lifetime'), null);
    process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS = '9900';
    assert.deepStrictEqual(
        billing.getLifetimeProPlan(),
        {
            id: 'pro_lifetime',
            label: 'PixelForge AI Pro',
            credits: 0,
            amount: 9900,
            badge: 'One-time license',
            entitlement: 'pro_lifetime'
        }
    );
    assert.strictEqual(billing.normPlanId('pro_lifetime'), 'pro_lifetime');
    assert.ok(billing.publicPlans().some((plan) => plan.id === 'pro_lifetime' && plan.amount_cents === 9900));
} finally {
    if (previousProPrice === undefined) delete process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS;
    else process.env.PIXELFORGE_PRO_LIFETIME_PRICE_CENTS = previousProPrice;
}

const { normalizeLoopbackRedirect } = handler._test;
assert.strictEqual(
    normalizeLoopbackRedirect('http://127.0.0.1:49152/payment_success?session_id={CHECKOUT_SESSION_ID}', '/payment_success'),
    'http://127.0.0.1:49152/payment_success?session_id={CHECKOUT_SESSION_ID}'
);
assert.strictEqual(normalizeLoopbackRedirect('http://127.0.0.1:49152/payment_success', '/payment_success'), null);
assert.ok(normalizeLoopbackRedirect('http://localhost:49152/payment_cancel', '/payment_cancel'));
assert.strictEqual(normalizeLoopbackRedirect('https://attacker.example/payment_success', '/payment_success'), null);
assert.strictEqual(normalizeLoopbackRedirect('http://127.0.0.1:80/payment_success', '/payment_success'), null);
assert.strictEqual(normalizeLoopbackRedirect('http://127.0.0.1:49152/wrong', '/payment_success'), null);

const webhookSource = fs.readFileSync(path.join(__dirname, '..', 'api', 'stripe-webhook.js'), 'utf8');
assert.match(webhookSource, /metadata\.app === 'pixelforge_ai'/);
assert.match(webhookSource, /creditPixelForgeSession/);

console.log('PixelForge billing smoke checks passed.');
