'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

process.env.STRIPE_SECRET_KEY = 'sk_test_mock_only';

const checkoutHandler = require('../../api/create-checkout-session');
const invoiceHandler = require('../../api/pay-invoice');

function createResponse() {
    return {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
            this.headers[String(name).toLowerCase()] = value;
        },
        end(body) {
            this.body = body || '';
        }
    };
}

function createRequest(body, ip) {
    return {
        method: 'POST',
        url: '/api/create-checkout-session',
        headers: {
            origin: 'http://localhost:4180',
            host: 'localhost:4180',
            'content-type': 'application/json',
            'x-forwarded-for': ip || `127.0.0.${Math.floor(Math.random() * 200) + 1}`
        },
        socket: { remoteAddress: ip || '127.0.0.1' },
        rawBody: Buffer.from(JSON.stringify(body))
    };
}

function createFakeStripe(options) {
    const config = options || {};
    const calls = {
        products: [],
        prices: [],
        sessions: []
    };
    const stripe = {
        products: {
            async list() {
                return { data: [] };
            },
            async create(payload) {
                calls.products.push(payload);
                return { id: `prod_mock_${calls.products.length}`, ...payload };
            }
        },
        prices: {
            async list() {
                return { data: [] };
            },
            async create(payload) {
                calls.prices.push(payload);
                return { id: `price_mock_${calls.prices.length}`, ...payload };
            }
        },
        checkout: {
            sessions: {
                async create(payload) {
                    calls.sessions.push(payload);
                    if (config.sessionError) {
                        throw config.sessionError;
                    }
                    return {
                        id: `cs_test_mock_${calls.sessions.length}`,
                        url: `https://checkout.stripe.test/c/pay/cs_test_mock_${calls.sessions.length}`
                    };
                }
            }
        }
    };

    return { stripe, calls };
}

function requiredIntake(packageKey, overrides) {
    return {
        packageKey,
        businessName: 'Regression Test LLC',
        contactName: 'Test Buyer',
        email: 'buyer@example.com',
        projectDetails: 'Validate the package checkout contract without creating a live Stripe object.',
        managedPropertyUrl: 'https://example.com',
        intakeUploadCompleted: true,
        returnPath: '/pricing',
        ...overrides
    };
}

async function invokePackageCheckout(packageKey, overrides, fakeOptions) {
    const fake = createFakeStripe(fakeOptions);
    checkoutHandler.setStripeFactoryForTests(() => fake.stripe);
    const response = createResponse();
    await checkoutHandler(createRequest(requiredIntake(packageKey, overrides)), response);
    return {
        response,
        body: response.body ? JSON.parse(response.body) : {},
        calls: fake.calls
    };
}

test.afterEach(() => {
    checkoutHandler.resetStripeFactoryForTests();
    invoiceHandler.resetStripeFactoryForTests();
});

test('fixed project checkout charges the canonical full amount', async () => {
    const result = await invokePackageCheckout('website-demo-preview');

    assert.equal(result.response.statusCode, 200);
    assert.equal(result.calls.prices[0].unit_amount, 20000);
    assert.equal(result.calls.sessions[0].mode, 'payment');
    assert.match(result.calls.sessions[0].success_url, /purchase=success/);
    assert.match(result.calls.sessions[0].cancel_url, /purchase=cancelled/);
    assert.equal(result.calls.sessions[0].metadata.catalogVersion, '2026.07.25');
});

test('full-or-deposit project honors the requested deposit only', async () => {
    const result = await invokePackageCheckout('website-local-seo-starter', {
        paymentOption: 'deposit'
    });

    assert.equal(result.response.statusCode, 200);
    assert.equal(result.calls.prices[0].unit_amount, 60000);
    assert.equal(result.calls.sessions[0].metadata.selectedPaymentOption, 'deposit');
});

test('deposit-only packages cannot be full charged', async () => {
    const result = await invokePackageCheckout('website-authority-network', {
        paymentOption: 'full'
    });

    assert.equal(result.response.statusCode, 200);
    assert.equal(result.calls.prices[0].unit_amount, 250000);
    assert.equal(result.calls.sessions[0].metadata.selectedPaymentOption, 'deposit');
});

test('GBP setup and maintenance create project and subscription sessions', async () => {
    const setup = await invokePackageCheckout('gbp-setup');
    const maintenance = await invokePackageCheckout('gbp-maintenance');

    assert.equal(setup.response.statusCode, 200);
    assert.equal(setup.calls.prices[0].unit_amount, 49700);
    assert.equal(setup.calls.sessions[0].mode, 'payment');

    assert.equal(maintenance.response.statusCode, 200);
    assert.equal(maintenance.calls.prices[0].unit_amount, 14700);
    assert.equal(maintenance.calls.prices[0].recurring.interval, 'month');
    assert.equal(maintenance.calls.sessions[0].mode, 'subscription');
});

test('setup-plus-monthly checkout has one setup and one recurring line item', async () => {
    const result = await invokePackageCheckout('ops-simple-lead-tracker');

    assert.equal(result.response.statusCode, 200);
    assert.equal(result.calls.prices[0].unit_amount, 4900);
    assert.equal(result.calls.sessions[0].mode, 'subscription');
    assert.equal(result.calls.sessions[0].line_items.length, 2);
    assert.equal(result.calls.sessions[0].line_items[0].price_data.unit_amount, 50000);
});

test('consult-only and deprecated packages never reach Stripe', async () => {
    const consult = await invokePackageCheckout('ops-growth-system-starter');
    const deprecated = await invokePackageCheckout('website-search-foundation');

    assert.equal(consult.response.statusCode, 400);
    assert.equal(consult.calls.sessions.length, 0);
    assert.equal(deprecated.response.statusCode, 400);
    assert.equal(deprecated.calls.sessions.length, 0);
});

test('server rejects client-selected package when the verified scope resolves elsewhere', async () => {
    const result = await invokePackageCheckout('website-local-seo-starter', {
        pageCountExpectation: 'network',
        seoExpansionNeed: 'both',
        sellingOnlineNeed: 'no'
    });

    assert.equal(result.response.statusCode, 409);
    assert.equal(result.body.recommendedPackageKey, 'website-authority-network');
    assert.equal(result.body.resolution.checkoutMode, 'DEPOSIT_ONLY');
    assert.equal(result.calls.sessions.length, 0);
});

test('Stripe failures are contained and reported without a checkout URL', async () => {
    const result = await invokePackageCheckout(
        'website-demo-preview',
        {},
        { sessionError: new Error('mock Stripe outage') }
    );

    assert.equal(result.response.statusCode, 502);
    assert.equal(result.body.intakeAccepted, true);
    assert.equal(result.body.url, undefined);
});

test('Pay Invoice validates limits and creates an isolated one-time session', async () => {
    const fake = createFakeStripe();
    invoiceHandler.setStripeFactoryForTests(() => fake.stripe);

    const tooSmallResponse = createResponse();
    await invoiceHandler(createRequest({
        clientName: 'Invoice Client',
        clientEmail: 'client@example.com',
        invoiceNumber: 'KL-100',
        amountCents: 99
    }, '127.0.1.1'), tooSmallResponse);
    assert.equal(tooSmallResponse.statusCode, 400);

    const response = createResponse();
    await invoiceHandler(createRequest({
        clientName: 'Invoice Client',
        clientEmail: 'client@example.com',
        invoiceNumber: 'KL-101',
        description: 'Approved project balance',
        amountCents: 125000
    }, '127.0.1.2'), response);

    assert.equal(response.statusCode, 200);
    assert.equal(fake.calls.sessions.length, 1);
    assert.equal(fake.calls.sessions[0].mode, 'payment');
    assert.equal(fake.calls.sessions[0].line_items[0].price_data.unit_amount, 125000);
    assert.equal(fake.calls.sessions[0].metadata.paymentType, 'invoice_payment');
    assert.match(fake.calls.sessions[0].success_url, /pay-invoice\?payment=success/);
    assert.match(fake.calls.sessions[0].cancel_url, /pay-invoice\?payment=cancelled/);
});

test('webhook replay handling uses durable uniqueness before referral payout', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', 'api', 'stripe-webhook.js'), 'utf8');
    assert.match(source, /ON CONFLICT \(external_event_id\) DO NOTHING/);
    assert.match(source, /ON CONFLICT \(session_id\) DO NOTHING/);
    assert.match(source, /ensurePayout/);
});

