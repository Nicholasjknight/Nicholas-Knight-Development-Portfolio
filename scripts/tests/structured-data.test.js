'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');
const catalog = require('../../data/package-catalog.json');
const FILES = [
    'index.html',
    'pricing.html',
    'service-websites.html',
    'automation.html',
    'package-demo-preview.html',
    'package-preview-launch.html',
    'package-local-launch.html',
    'package-authority-site.html',
    'package-max-authority.html',
    'package-authority-network.html',
    'package-storefront.html',
    'package-growth-system.html'
];

function jsonLdDocuments(relativePath) {
    const html = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
        .map((match, index) => {
            try {
                return JSON.parse(match[1]);
            } catch (error) {
                assert.fail(`${relativePath} JSON-LD block ${index + 1} is invalid: ${error.message}`);
            }
        });
}

function walk(value, visitor) {
    if (!value || typeof value !== 'object') {
        return;
    }
    visitor(value);
    if (Array.isArray(value)) {
        value.forEach((item) => walk(item, visitor));
        return;
    }
    Object.values(value).forEach((item) => walk(item, visitor));
}

test('commercial JSON-LD parses and excludes retired offers', () => {
    const retiredNames = new Set(
        catalog.packages
            .filter((pkg) => pkg.deprecated === true || pkg.public === false)
            .map((pkg) => pkg.name.toLowerCase())
    );

    for (const file of FILES) {
        for (const document of jsonLdDocuments(file)) {
            walk(document, (node) => {
                if (!node.name) {
                    return;
                }
                assert.equal(
                    retiredNames.has(String(node.name).toLowerCase()),
                    false,
                    `${file} exposes retired schema offer ${node.name}.`
                );
            });
        }
    }
});

test('flat catalog offers use exact numeric price values when named in schema', () => {
    const flatByName = new Map(
        catalog.packages
            .filter((pkg) => pkg.public && pkg.pricingMode === 'FLAT')
            .map((pkg) => [pkg.name.toLowerCase(), pkg])
    );

    for (const file of FILES) {
        for (const document of jsonLdDocuments(file)) {
            walk(document, (node) => {
                const pkg = node.name && flatByName.get(String(node.name).toLowerCase());
                if (!pkg || node.price === undefined) {
                    return;
                }
                const expected = pkg.projectPrice || pkg.setupPrice || pkg.monthlyPrice;
                assert.equal(Number(node.price), Number(expected), `${file}: ${pkg.name} schema price drift.`);
            });
        }
    }
});

