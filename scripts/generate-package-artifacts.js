#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'data', 'package-catalog.json');
const BROWSER_TARGET = path.join(ROOT, 'pricing', 'package-catalog.generated.js');

function main() {
    const catalog = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
    const source = [
        '/* Generated from data/package-catalog.json. Do not edit directly. */',
        `(function (root) { root.KL_PACKAGE_CATALOG = ${JSON.stringify(catalog)}; }(typeof globalThis !== 'undefined' ? globalThis : this));`,
        ''
    ].join('\n');

    fs.writeFileSync(BROWSER_TARGET, source, 'utf8');
    process.stdout.write(`Generated ${path.relative(ROOT, BROWSER_TARGET)} from catalog ${catalog.catalogVersion}.\n`);
}

main();

