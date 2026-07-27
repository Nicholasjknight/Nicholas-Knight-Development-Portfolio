#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

if (!process.argv.includes('--stripe-test-mode')) {
    console.error('Refusing to contact Stripe without the explicit --stripe-test-mode flag. Use npm run test:checkout:mock for local contracts.');
    process.exit(2);
}

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const eq = trimmed.indexOf('=');
        if (eq === -1) {
            return;
        }

        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env.production'));

const handler = require('../api/create-checkout-session.js');
const invoiceHandler = require('../api/pay-invoice.js');
const Stripe = require('stripe');
const { PACKAGE_DEFINITIONS } = handler;

const packagesToTest = [
    'website-demo-preview',
    'website-local-seo-starter',
    'website-authority-network',
    'ecommerce-launch',
    'ecommerce-advanced-system',
    'gbp-setup',
    'gbp-maintenance',
    'ops-simple-lead-tracker',
    'monthly-local-seo-starter'
];

function createMockResponse() {
    return {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
            this.headers[name.toLowerCase()] = value;
        },
        end(body) {
            this.body = body;
        }
    };
}

function getCheckoutSessionId(url) {
    const match = String(url || '').match(/\/pay\/([^#?]+)/);
    return match ? match[1] : '';
}

async function inspectStripeSession(stripe, url) {
    const sessionId = getCheckoutSessionId(url);

    if (!sessionId) {
        return {
            error: 'Unable to parse Stripe Checkout session id.'
        };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 10,
        expand: ['data.price']
    });

    return {
        id: session.id,
        mode: session.mode,
        amountSubtotal: session.amount_subtotal,
        amountTotal: session.amount_total,
        lineItems: (lineItems.data || []).map((item) => ({
            description: item.description,
            amountSubtotal: item.amount_subtotal,
            amountTotal: item.amount_total,
            recurring: Boolean(item.price && item.price.recurring)
        }))
    };
}

async function testPackage(packageKey) {
    const definition = PACKAGE_DEFINITIONS[packageKey];

    if (!definition) {
        throw new Error(`Missing PACKAGE_DEFINITIONS entry for ${packageKey}`);
    }

    const req = {
        method: 'POST',
        headers: {
            origin: 'http://localhost:4178',
            'content-type': 'application/json',
            host: 'localhost:4178'
        },
        socket: { remoteAddress: '127.0.0.1' },
        async *[Symbol.asyncIterator]() {
            yield Buffer.from(JSON.stringify({
                packageKey,
                businessName: 'Checkout QA Test Co',
                contactName: 'QA Tester',
                email: 'qa.checkout.test@knightlogics.com',
                preferredContact: 'email',
                projectDetails: `Automated checkout smoke test for ${packageKey}.`,
                managedPropertyUrl: 'https://example.com/checkout-test',
                returnPath: '/pricing',
                intakeUploadCompleted: true
            }));
        }
    };

    const res = createMockResponse();
    await handler(req, res);

    let payload = {};
    try {
        payload = JSON.parse(res.body || '{}');
    } catch (error) {
        payload = { parseError: error.message, raw: res.body };
    }

    return {
        packageKey,
        name: definition.name,
        amount: definition.amount,
        setupAmount: definition.setupAmount || 0,
        expectedMode: definition.mode,
        statusCode: res.statusCode,
        ok: res.statusCode === 200 && Boolean(payload.url),
        url: payload.url || null,
        error: payload.error || null
    };
}

async function testInvoicePayment() {
    const req = {
        method: 'POST',
        headers: {
            origin: 'http://localhost:4178',
            'content-type': 'application/json',
            host: 'localhost:4178'
        },
        socket: { remoteAddress: '127.0.0.1' },
        async *[Symbol.asyncIterator]() {
            yield Buffer.from(JSON.stringify({
                invoiceNumber: 'KL-QA-FINANCE-001',
                clientName: 'QA Tester',
                clientEmail: 'qa.invoice.test@knightlogics.com',
                clientPhone: '813-555-0100',
                description: 'Automated invoice checkout and financing disclosure smoke test.',
                amountCents: 120000
            }));
        }
    };

    const res = createMockResponse();
    await invoiceHandler(req, res);

    let payload = {};
    try {
        payload = JSON.parse(res.body || '{}');
    } catch (error) {
        payload = { parseError: error.message, raw: res.body };
    }

    return {
        packageKey: 'invoice-payment',
        name: 'Pay Invoice',
        amount: 120000,
        expectedMode: 'payment',
        statusCode: res.statusCode,
        ok: res.statusCode === 200 && Boolean(payload.url),
        url: payload.url || null,
        error: payload.error || null
    };
}

(async () => {
    if (!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_API_KEY) {
        console.error('STRIPE_SECRET_KEY not found in .env.local/.env.production — cannot run Stripe test-mode checkout smoke.');
        process.exit(1);
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
    if (!String(stripeKey).startsWith('sk_test_')) {
        console.error('Refusing checkout smoke because the configured Stripe key is not a test-mode key.');
        process.exit(2);
    }

    const stripe = new Stripe(stripeKey, {
        apiVersion: '2025-03-31.basil'
    });
    const results = [];

    for (const packageKey of packagesToTest) {
        try {
            const result = await testPackage(packageKey);
            if (result.ok) {
                result.session = await inspectStripeSession(stripe, result.url);
                result.modeOk = result.session.mode === result.expectedMode;

                if (result.setupAmount) {
                    const hasSetup = result.session.lineItems.some((item) => !item.recurring && item.amountTotal === result.setupAmount);
                    const hasRecurring = result.session.lineItems.some((item) => item.recurring && item.amountTotal === result.amount);
                    result.setupLineOk = hasSetup;
                    result.recurringLineOk = hasRecurring;
                    result.ok = result.ok && result.modeOk && hasSetup && hasRecurring;
                } else {
                    result.ok = result.ok && result.modeOk;
                }
            }
            results.push(result);
        } catch (error) {
            results.push({
                packageKey,
                ok: false,
                statusCode: 500,
                error: error.message
            });
        }
    }

    try {
        const invoiceResult = await testInvoicePayment();
        if (invoiceResult.ok) {
            invoiceResult.session = await inspectStripeSession(stripe, invoiceResult.url);
            invoiceResult.modeOk = invoiceResult.session.mode === invoiceResult.expectedMode;
            invoiceResult.amountOk = invoiceResult.session.amountTotal === invoiceResult.amount;
            invoiceResult.ok = invoiceResult.ok && invoiceResult.modeOk && invoiceResult.amountOk;
        }
        results.push(invoiceResult);
    } catch (error) {
        results.push({
            packageKey: 'invoice-payment',
            ok: false,
            statusCode: 500,
            error: error.message
        });
    }

    console.log(JSON.stringify(results, null, 2));

    const allOk = results.every((result) => result.ok);
    process.exit(allOk ? 0 : 1);
})();
