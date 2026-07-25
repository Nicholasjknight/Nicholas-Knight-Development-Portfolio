'use strict';

/**
 * Lightweight sync helper: validates package-catalog.json and prints a summary
 * that checkout / Stripe sync should match. Does not rewrite HTML by default.
 *
 * Usage: node scripts/sync-package-catalog.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'package-catalog.json');

function main() {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const packages = catalog.packages || [];
    const publicPackages = packages.filter((pkg) => pkg.public !== false && !pkg.deprecated);
    const ghosts = packages.filter((pkg) => pkg.deprecated || pkg.public === false);

    console.log(`Catalog ${catalog.version || '(no version)'}`);
    console.log(`Public packages: ${publicPackages.length}`);
    console.log(`Hidden/deprecated: ${ghosts.length}`);
    console.log('');
    console.log('Public ladder:');

    for (const pkg of publicPackages.filter((item) => item.family === 'website')) {
        console.log(
            ` - ${pkg.id}: ${pkg.name} · ${pkg.billingType} · ${pkg.priceDisplay}`
            + (pkg.pageLimitLabel ? ` · ${pkg.pageLimitLabel}` : '')
            + (pkg.checkoutEnabled === false ? ' · no open checkout' : '')
        );
    }

    console.log('');
    console.log(catalog.ladderSummary || '');
    console.log('');
    console.log('Next: node scripts/check-pricing-drift.js');
}

main();
