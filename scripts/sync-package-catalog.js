'use strict';

/**
 * Validates package-catalog.json and prints the canonical public packages by
 * lane. Checkout, generated browser data, JSON-LD, and Stripe sync must use the
 * same catalogVersion, package keys, lane names, and commercial semantics.
 *
 * Usage: node scripts/sync-package-catalog.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'package-catalog.json');
const VALID_LANES = new Set([
    'WEBSITE',
    'COMMERCE',
    'VISIBILITY',
    'OPERATIONS',
    'GROWTH_WEBSITE_SYSTEMS',
    'GROWTH_SYSTEMS_ONLY',
    'CARE',
    'ADD_ON'
]);
const VALID_BILLING_TYPES = new Set(['PROJECT', 'SETUP_MONTHLY', 'MONTHLY', 'SCOPED']);
const VALID_PRICING_MODES = new Set(['FLAT', 'BASE', 'RANGE', 'SCOPED']);
const VALID_CHECKOUT_MODES = new Set(['FULL', 'FULL_OR_DEPOSIT', 'DEPOSIT_ONLY', 'CONSULT_ONLY', 'DISABLED']);

function fail(message) {
    throw new Error(`Catalog validation failed: ${message}`);
}

function validateCatalog(catalog) {
    if (!catalog || typeof catalog !== 'object') {
        fail('root must be an object');
    }

    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(String(catalog.catalogVersion || ''))) {
        fail('catalogVersion must use YYYY.MM.DD');
    }

    if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) {
        fail('packages must be a non-empty array');
    }

    const seen = new Set();

    for (const pkg of catalog.packages) {
        if (!pkg.id || seen.has(pkg.id)) {
            fail(`package id is missing or duplicated: ${pkg.id || '(empty)'}`);
        }
        seen.add(pkg.id);

        if (!VALID_LANES.has(pkg.lane)) {
            fail(`${pkg.id} has invalid or missing lane: ${pkg.lane || '(empty)'}`);
        }
        if (!VALID_BILLING_TYPES.has(pkg.billingType)) {
            fail(`${pkg.id} has invalid billingType: ${pkg.billingType || '(empty)'}`);
        }
        if (!VALID_PRICING_MODES.has(pkg.pricingMode)) {
            fail(`${pkg.id} has invalid pricingMode: ${pkg.pricingMode || '(empty)'}`);
        }
        if (!VALID_CHECKOUT_MODES.has(pkg.checkoutMode)) {
            fail(`${pkg.id} has invalid checkoutMode: ${pkg.checkoutMode || '(empty)'}`);
        }
        if (!pkg.name || !pkg.priceDisplay) {
            fail(`${pkg.id} needs name and priceDisplay`);
        }

        for (const field of ['public', 'indexable', 'recommendable', 'checkoutEnabled']) {
            if (typeof pkg[field] !== 'boolean') {
                fail(`${pkg.id} needs explicit boolean ${field}`);
            }
        }

        if (pkg.checkoutMode === 'DISABLED') {
            if (pkg.public || pkg.indexable || pkg.recommendable || pkg.checkoutEnabled) {
                fail(`${pkg.id} is disabled but still visible, recommendable, or checkout-enabled`);
            }
        }

        if (pkg.checkoutMode === 'CONSULT_ONLY' && pkg.checkoutEnabled) {
            fail(`${pkg.id} is consult-only but checkoutEnabled is true`);
        }
    }
}

function main() {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    validateCatalog(catalog);

    const packages = catalog.packages || [];
    const publicPackages = packages.filter(
        (pkg) => pkg.public === true && pkg.deprecated !== true && pkg.checkoutMode !== 'DISABLED'
    );
    const ghosts = packages.filter(
        (pkg) => pkg.deprecated === true || pkg.public === false || pkg.checkoutMode === 'DISABLED'
    );
    const lanes = [...VALID_LANES].filter((lane) => publicPackages.some((pkg) => pkg.lane === lane));

    console.log(`Catalog ${catalog.catalogVersion}`);
    console.log(`Public packages: ${publicPackages.length}`);
    console.log(`Hidden/deprecated: ${ghosts.length}`);

    for (const lane of lanes) {
        console.log('');
        console.log(`${lane}:`);

        for (const pkg of publicPackages.filter((item) => item.lane === lane)) {
            const scope = pkg.scopeLimits && (pkg.scopeLimits.pages || pkg.scopeLimits.products);
            console.log(
                ` - ${pkg.id}: ${pkg.name} · ${pkg.billingType}/${pkg.pricingMode}`
                + ` · ${pkg.checkoutMode} · ${pkg.priceDisplay}`
                + (scope ? ` · ${scope}` : '')
                + (pkg.indexable ? ' · indexable' : ' · nonindexable')
                + (pkg.checkoutEnabled ? ' · checkout' : ' · consult')
            );
        }
    }

    console.log('');
    console.log('Next: node scripts/check-pricing-drift.js');
}

main();
