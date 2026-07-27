'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const catalog = require('../../data/package-catalog.json');
const routing = require('../../pricing/package-routing');
const checkoutHandler = require('../../api/create-checkout-session');

const websiteMatrix = [
    ['demo', 'website-demo-preview'],
    ['small', 'website-preview-launch'],
    ['preview', 'website-preview-launch'],
    ['medium', 'website-local-seo-starter'],
    ['local', 'website-local-seo-starter'],
    ['large', 'website-local-launch-plus'],
    ['authority', 'website-local-launch-plus'],
    ['enterprise', 'website-local-launch-max'],
    ['max', 'website-local-launch-max'],
    ['network', 'website-authority-network'],
    ['growth', 'website-authority-network']
];

test('website page-band matrix resolves linearly', () => {
    for (const [pageBand, expectedKey] of websiteMatrix) {
        const result = routing.resolvePackage(
            'website-local-seo-starter',
            { pageCountExpectation: pageBand },
            catalog
        );

        assert.equal(result.ok, true, pageBand);
        assert.equal(result.resolvedKey, expectedKey, pageBand);
    }
});

test('API and shared resolver return identical recommendations', () => {
    for (const [pageBand, expectedKey] of websiteMatrix) {
        const shared = routing.resolvePackage(
            'website-local-seo-starter',
            { pageCountExpectation: pageBand },
            catalog
        );
        const api = checkoutHandler.getPackageRoute(
            'website-local-seo-starter',
            { pageCountExpectation: pageBand }
        );
        const apiKey = api.routeType === 'allowed'
            ? 'website-local-seo-starter'
            : api.recommendedPackageKey;

        assert.equal(shared.resolvedKey, expectedKey);
        assert.equal(apiKey, expectedKey);
    }
});

test('systems-only scope never gains a website implicitly', () => {
    const cases = [
        ['ops-growth-systems-only-starter', 'starter', 'ops-growth-systems-only-starter'],
        ['ops-growth-systems-only-starter', 'full', 'ops-growth-systems-only-full'],
        ['ops-growth-systems-only-full', 'field', 'ops-growth-systems-only-field']
    ];

    for (const [requestedKey, complexity, expectedKey] of cases) {
        const result = routing.resolvePackage(
            requestedKey,
            { complexity, systemsChoice: 'systems-only', currentSiteSuitable: true },
            catalog
        );

        assert.equal(result.ok, true);
        assert.equal(result.resolvedKey, expectedKey);
        assert.match(result.reason, /existing-site|existing website/i);
    }
});

test('a website is added to growth only after an explicit lane change', () => {
    const result = routing.resolvePackage(
        'ops-growth-systems-only-starter',
        { complexity: 'full', systemsChoice: 'website-systems' },
        catalog
    );

    assert.equal(result.resolvedKey, 'ops-full-growth-system');
});

test('commerce requirements resolve to retained tiers only', () => {
    const cases = [
        [{ sellingOnlineNeed: 'no', pageCountExpectation: 'small' }, 'ecommerce-preview-catalog'],
        [{ sellingOnlineNeed: 'stripe-links' }, 'ecommerce-payment-links'],
        [{ sellingOnlineNeed: 'cart-store', pageCountExpectation: 'local' }, 'ecommerce-launch'],
        [{ sellingOnlineNeed: 'cart-store', pageCountExpectation: 'authority' }, 'ecommerce-growth-store'],
        [{ sellingOnlineNeed: 'subscription', specialFeatures: 'subscription inventory integration' }, 'ecommerce-advanced-system']
    ];

    for (const [intake, expectedKey] of cases) {
        const result = routing.resolvePackage('ecommerce-launch', intake, catalog);
        assert.equal(result.resolvedKey, expectedKey);
        assert.notEqual(result.resolvedKey, 'ecommerce-launch-plus');
    }
});

test('deprecated packages are rejected before recommendation', () => {
    const result = routing.resolvePackage('website-search-foundation', {}, catalog);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'INVALID_PACKAGE');
});

