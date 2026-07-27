'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');

test('pricing loads generated catalog and shared resolver before checkout UI', () => {
    const html = fs.readFileSync(path.join(ROOT, 'pricing.html'), 'utf8');
    const catalogIndex = html.indexOf('/pricing/package-catalog.generated.js');
    const resolverIndex = html.indexOf('/pricing/package-routing.js');
    const checkoutIndex = html.indexOf('/pricing/package-checkout.js');

    assert.ok(catalogIndex > 0);
    assert.ok(resolverIndex > catalogIndex);
    assert.ok(checkoutIndex > resolverIndex);
});

test('homepage commercial CTAs use the shared pricing checkout entry point', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const packageCtas = [...html.matchAll(/<(?:a|button)[^>]+data-package-key=["']([^"']+)["'][^>]*>/gi)];

    assert.ok(packageCtas.length > 0);
    for (const match of packageCtas) {
        const tag = match[0];
        assert.match(tag, /^<a\b/i, `Homepage package ${match[1]} must link to shared checkout.`);
        assert.match(tag, /href=["']\/pricing\?openPackage=/i, `Homepage package ${match[1]} needs /pricing checkout.`);
    }
});

test('browser checkout source consumes canonical generated package data', () => {
    const source = fs.readFileSync(path.join(ROOT, 'pricing', 'package-checkout.js'), 'utf8');
    assert.match(source, /window\.KL_PACKAGE_CATALOG/);
    assert.match(source, /window\.KLPackageRouting/);
});

test('package and case-study checkout links use the shared pricing entry point', () => {
    const files = fs.readdirSync(ROOT)
        .filter((name) => /^(?:package|case-study)-.*\.html$/i.test(name));
    let checkoutLinkCount = 0;

    for (const file of files) {
        const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
        const links = [...html.matchAll(/href=["']([^"']*openPackage=[^"']*)["']/gi)];
        checkoutLinkCount += links.length;

        for (const match of links) {
            assert.match(
                match[1],
                /^\/pricing\?openPackage=[^#&"']+/i,
                `${file} must route checkout links through /pricing?openPackage=.`
            );
        }
    }

    assert.ok(checkoutLinkCount > 0, 'Expected package or case-study checkout links to validate.');
});

