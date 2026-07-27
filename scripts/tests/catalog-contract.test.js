'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'package-catalog.json'), 'utf8'));
const VALID_BILLING_TYPES = new Set(['PROJECT', 'SETUP_MONTHLY', 'MONTHLY', 'SCOPED']);
const VALID_PRICING_MODES = new Set(['FLAT', 'BASE', 'RANGE', 'SCOPED']);
const VALID_CHECKOUT_MODES = new Set(['FULL', 'FULL_OR_DEPOSIT', 'DEPOSIT_ONLY', 'CONSULT_ONLY', 'DISABLED']);

test('catalog has a version and unique package ids', () => {
    assert.match(catalog.catalogVersion, /^\d{4}\.\d{2}\.\d{2}$/);
    const ids = catalog.packages.map((pkg) => pkg.id);
    assert.equal(new Set(ids).size, ids.length, 'Catalog package ids must be unique.');
});

test('every package has explicit commercial semantics', () => {
    for (const pkg of catalog.packages) {
        assert.ok(pkg.name, `${pkg.id} needs a name.`);
        assert.ok(VALID_BILLING_TYPES.has(pkg.billingType), `${pkg.id} has an invalid billingType.`);
        assert.ok(VALID_PRICING_MODES.has(pkg.pricingMode), `${pkg.id} has an invalid pricingMode.`);
        assert.ok(VALID_CHECKOUT_MODES.has(pkg.checkoutMode), `${pkg.id} has an invalid checkoutMode.`);
        assert.ok(pkg.priceDisplay, `${pkg.id} needs an exact priceDisplay.`);
        assert.equal(typeof pkg.public, 'boolean', `${pkg.id} needs an explicit public flag.`);
        assert.equal(typeof pkg.indexable, 'boolean', `${pkg.id} needs an explicit indexable flag.`);
        assert.equal(typeof pkg.recommendable, 'boolean', `${pkg.id} needs an explicit recommendable flag.`);
        assert.equal(typeof pkg.checkoutEnabled, 'boolean', `${pkg.id} needs an explicit checkoutEnabled flag.`);
    }
});

test('checkout modes and prices cannot contradict each other', () => {
    for (const pkg of catalog.packages) {
        if (pkg.checkoutMode === 'DISABLED') {
            assert.equal(pkg.public, false, `${pkg.id} disabled package must be nonpublic.`);
            assert.equal(pkg.recommendable, false, `${pkg.id} disabled package must not be recommendable.`);
            assert.equal(pkg.checkoutEnabled, false, `${pkg.id} disabled package must not enable checkout.`);
        }

        if (pkg.checkoutMode === 'CONSULT_ONLY') {
            assert.equal(pkg.checkoutEnabled, false, `${pkg.id} consult-only package must not open checkout.`);
        }

        if (pkg.checkoutMode === 'DEPOSIT_ONLY') {
            assert.ok(pkg.depositPrice > 0, `${pkg.id} deposit-only package needs a numeric deposit.`);
            assert.equal(pkg.checkoutEnabled, true);
        }

        if (pkg.checkoutMode === 'FULL_OR_DEPOSIT') {
            assert.ok(pkg.projectPrice > 0, `${pkg.id} needs a project price.`);
            assert.ok(pkg.depositPrice > 0, `${pkg.id} needs a deposit price.`);
            assert.ok(pkg.depositPrice < pkg.projectPrice, `${pkg.id} deposit must be less than the project total.`);
        }

        if (pkg.billingType === 'MONTHLY' && pkg.checkoutMode === 'FULL') {
            assert.ok(pkg.monthlyPrice > 0, `${pkg.id} needs a monthly price.`);
        }
    }
});

test('visible CTA keys map one-to-one to nondeprecated catalog packages', () => {
    const html = [
        fs.readFileSync(path.join(ROOT, 'pricing.html'), 'utf8'),
        fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    ].join('\n');
    const ctaKeys = new Set(
        [...html.matchAll(/data-package-key=["']([^"']+)["']/g)].map((match) => match[1])
    );
    const packageMap = new Map(catalog.packages.map((pkg) => [pkg.id, pkg]));

    for (const key of ctaKeys) {
        const pkg = packageMap.get(key);
        assert.ok(pkg, `Visible CTA ${key} is missing from package-catalog.json.`);
        assert.notEqual(pkg.deprecated, true, `Visible CTA ${key} points to a deprecated package.`);
    }
});

test('Stripe map matches each public checkout mode and amount', () => {
    const testMapPath = path.join(ROOT, 'stripe', 'knightlogics-catalog-map.test.json');
    const mapPath = fs.existsSync(testMapPath)
        ? testMapPath
        : path.join(ROOT, 'stripe', 'knightlogics-catalog-map.json');
    const stripeMap = JSON.parse(
        fs.readFileSync(mapPath, 'utf8')
    );
    assert.ok(['test', 'live'].includes(stripeMap.mode || 'test'));
    const rowsByKey = new Map();

    for (const row of stripeMap.rows || []) {
        if (!rowsByKey.has(row.packageKey)) {
            rowsByKey.set(row.packageKey, []);
        }
        rowsByKey.get(row.packageKey).push(row);
        assert.notEqual(row.priceIdNeedsResync, true, `${row.packageKey} Stripe price needs resync.`);
        assert.equal(row.catalogVersion, catalog.catalogVersion, `${row.packageKey} Stripe map catalog version drift.`);
    }

    for (const pkg of catalog.packages.filter((item) => item.public && item.checkoutEnabled)) {
        const rows = rowsByKey.get(pkg.id) || [];
        assert.ok(rows.length > 0, `${pkg.id} is checkout-enabled but absent from the Stripe map.`);

        if (pkg.checkoutMode === 'DEPOSIT_ONLY') {
            assert.deepEqual(rows.map((row) => row.paymentOption), ['deposit']);
            assert.equal(Number(rows[0].amountUsd), Number(pkg.depositPrice));
            continue;
        }

        const full = rows.find((row) => row.paymentOption === 'full');
        assert.ok(full, `${pkg.id} needs a full Stripe price.`);
        const expected = pkg.billingType === 'MONTHLY' || pkg.billingType === 'SETUP_MONTHLY'
            ? pkg.monthlyPrice
            : pkg.projectPrice;
        assert.equal(Number(full.amountUsd), Number(expected), `${pkg.id} Stripe amount drift.`);

        if (pkg.checkoutMode === 'FULL_OR_DEPOSIT') {
            const deposit = rows.find((row) => row.paymentOption === 'deposit');
            assert.ok(deposit, `${pkg.id} needs a Stripe deposit price.`);
            assert.equal(Number(deposit.amountUsd), Number(pkg.depositPrice));
        }
    }
});

