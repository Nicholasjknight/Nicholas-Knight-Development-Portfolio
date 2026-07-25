'use strict';

/**
 * Fails the build/deploy if public commercial copy drifts from data/package-catalog.json
 * or if obsolete ladder phrases reappear on customer-facing surfaces.
 *
 * Usage: node scripts/check-pricing-drift.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'package-catalog.json');

const PUBLIC_GLOBS = [
    'index.html',
    'pricing.html',
    'pricing/index.html',
    'service-websites.html',
    'automation.html',
    'ai.txt',
    'llms.txt',
    'llms-full.txt',
    'package-demo-preview.html',
    'package-preview-launch.html',
    'package-local-launch.html',
    'package-authority-site.html',
    'package-max-authority.html',
    'package-authority-network.html',
    'package-growth-system.html',
    'package-storefront.html'
];

const OBSOLETE_PATTERNS = [
    { id: 'essential-launch', re: /Essential Launch(?![^\n]{0,40}(obsolete|retired|do not cite|Do NOT cite))/i, allowIn: [] },
    { id: 'local-launch-site-name', re: /Local Launch Site/i, allowIn: [] },
    { id: 'local-launch-plus-name', re: /Local Launch Plus/i, allowIn: [] },
    { id: 'max-80-100-for-4500', re: /(?:Max Authority[^\n]{0,80})?80[–-]100\+[\s\S]{0,80}\$4,?500|\$4,?500[\s\S]{0,80}80[–-]100\+/i, allowIn: ['data/package-catalog.json'] },
    { id: 'preview-500', re: /Preview Launch[^\n]{0,40}\$500|(?<!from )\$500[^\n]{0,40}Preview Launch/i, allowIn: [] },
    { id: 'local-launch-1997', re: /(?:Local Launch[^\n]{0,40})?\$1,?997/i, allowIn: [] },
    { id: 'growth-system-3500-project', re: /Growth System[^\n]{0,60}\$3,?500(?![^\n]{0,40}\/mo)/i, allowIn: [] },
    { id: 'ecommerce-2497', re: /\$2,?497/, allowIn: [] }
];

function walkHtmlFiles(dir, acc = []) {
    if (!fs.existsSync(dir)) {
        return acc;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
            continue;
        }

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            walkHtmlFiles(full, acc);
        } else if (/\.(html|txt)$/i.test(entry.name)) {
            acc.push(full);
        }
    }

    return acc;
}

function rel(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function loadCatalog() {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
    return JSON.parse(raw);
}

function assertPublicPriceStrings(catalog, failures) {
    const publicPkgs = (catalog.packages || []).filter((pkg) => pkg.public !== false && pkg.deprecated !== true);

    for (const pkg of publicPkgs) {
        if (!pkg.priceDisplay) {
            failures.push(`Catalog package ${pkg.id} is missing priceDisplay`);
            continue;
        }

        // Skip ranged/scoped displays that are intentionally soft on some surfaces
        if (/from |–|-/i.test(pkg.priceDisplay) && pkg.billingType === 'SCOPED') {
            continue;
        }

        const needle = pkg.priceDisplay.replace(/\s+/g, '');
        let found = false;

        for (const relative of PUBLIC_GLOBS) {
            const filePath = path.join(ROOT, relative);

            if (!fs.existsSync(filePath)) {
                continue;
            }

            const text = fs.readFileSync(filePath, 'utf8');
            if (text.includes(pkg.priceDisplay) || text.replace(/\s+/g, '').includes(needle)) {
                found = true;
                break;
            }
        }

        // Only enforce presence for core website ladder + ecommerce launch
        const mustAppear = new Set([
            'website-demo-preview',
            'website-preview-launch',
            'website-local-seo-starter',
            'website-local-launch-plus',
            'website-local-launch-max',
            'website-authority-network',
            'ecommerce-launch',
            'ops-growth-system-starter'
        ]);

        if (mustAppear.has(pkg.id) && !found) {
            failures.push(`Public priceDisplay for ${pkg.id} (${pkg.priceDisplay}) not found on core pricing surfaces`);
        }
    }

    const max = publicPkgs.find((pkg) => pkg.id === 'website-local-launch-max');

    if (max && max.pageLimit !== 40) {
        failures.push('Max Authority pageLimit must be 40 (Option A)');
    }

    if (max && max.projectPrice !== 4500) {
        failures.push('Max Authority projectPrice must be 4500');
    }

    const network = publicPkgs.find((pkg) => pkg.id === 'website-authority-network');

    if (!network || network.projectPrice !== 6500 || network.billingType !== 'SCOPED') {
        failures.push('Authority Network must be SCOPED from $6500');
    }

    const ecommerce = publicPkgs.find((pkg) => pkg.id === 'ecommerce-launch');

    if (!ecommerce || ecommerce.projectPrice !== 2997) {
        failures.push('E-Commerce Launch must be $2997');
    }
}

function scanObsoletePatterns(failures) {
    const files = [
        ...PUBLIC_GLOBS.map((relative) => path.join(ROOT, relative)),
        ...walkHtmlFiles(ROOT).filter((filePath) => {
            const relative = rel(filePath);
            return (
                relative.startsWith('web-designer-')
                || relative.startsWith('case-study')
                || relative === 'case-studies.html'
                || relative === 'starting-a-new-business.html'
                || relative === 'free-website-audit.html'
            );
        })
    ];

    const unique = [...new Set(files.filter((filePath) => fs.existsSync(filePath)))];

    for (const filePath of unique) {
        const relative = rel(filePath);
        const text = fs.readFileSync(filePath, 'utf8');

        for (const pattern of OBSOLETE_PATTERNS) {
            if (pattern.allowIn.includes(relative)) {
                continue;
            }

            // Authority Network may legitimately mention 60–100+; only fail Max+$4500 pairing
            if (pattern.id === 'max-80-100-for-4500' && /Authority Network/i.test(text) && !/\$4,?500[\s\S]{0,120}80[–-]100\+|80[–-]100\+[\s\S]{0,120}\$4,?500/i.test(text)) {
                continue;
            }

            if (pattern.re.test(text)) {
                failures.push(`[${pattern.id}] obsolete commercial copy in ${relative}`);
            }
        }
    }
}

function assertCheckoutAligned(catalog, failures) {
    const checkoutPath = path.join(ROOT, 'api', 'create-checkout-session.js');
    const checkoutSrc = fs.readFileSync(checkoutPath, 'utf8');
    const frontendPath = path.join(ROOT, 'pricing', 'package-checkout.js');
    const frontendSrc = fs.readFileSync(frontendPath, 'utf8');

    const max = (catalog.packages || []).find((pkg) => pkg.id === 'website-local-launch-max');
    const ecommerce = (catalog.packages || []).find((pkg) => pkg.id === 'ecommerce-launch');

    if (max && !checkoutSrc.includes("name: 'Max Authority Site'") && !checkoutSrc.includes('name: "Max Authority Site"')) {
        failures.push('create-checkout-session.js missing Max Authority Site definition');
    }

    if (max && !/amount:\s*450000/.test(checkoutSrc)) {
        failures.push('create-checkout-session.js Max Authority amount must be 450000 cents');
    }

    if (ecommerce && !/amount:\s*299700/.test(checkoutSrc)) {
        failures.push('create-checkout-session.js E-Commerce Launch amount must be 299700 cents');
    }

    if (!checkoutSrc.includes('website-authority-network')) {
        failures.push('create-checkout-session.js missing website-authority-network');
    }

    if (!frontendSrc.includes('website-authority-network')) {
        failures.push('package-checkout.js missing website-authority-network');
    }

    if (!/price:\s*'\$2,997'/.test(frontendSrc) && !/price:\s*"\$2,997"/.test(frontendSrc)) {
        failures.push('package-checkout.js E-Commerce Launch price must be $2,997');
    }

    if (!checkoutSrc.includes('checkoutEnabled === false')) {
        failures.push('create-checkout-session.js missing checkoutEnabled guard');
    }
}

function main() {
    const failures = [];

    if (!fs.existsSync(CATALOG_PATH)) {
        console.error('Missing data/package-catalog.json');
        process.exit(1);
    }

    const catalog = loadCatalog();
    assertPublicPriceStrings(catalog, failures);
    scanObsoletePatterns(failures);
    assertCheckoutAligned(catalog, failures);

    if (failures.length) {
        console.error('Pricing drift check FAILED:\n');
        for (const failure of failures) {
            console.error(' - ' + failure);
        }
        process.exit(1);
    }

    console.log('Pricing drift check passed.');
    console.log(`Catalog version: ${catalog.version || 'unknown'}`);
    console.log(`Packages: ${(catalog.packages || []).length}`);
}

main();
