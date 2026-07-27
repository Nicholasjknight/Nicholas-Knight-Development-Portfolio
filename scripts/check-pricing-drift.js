'use strict';

/**
 * Fails the build/deploy when catalog artifacts, checkout definitions, public
 * structured data, or commercial copy drift from data/package-catalog.json.
 *
 * Usage: node scripts/check-pricing-drift.js
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'package-catalog.json');
const GENERATED_CATALOG_PATH = path.join(ROOT, 'pricing', 'package-catalog.generated.js');

const OBSOLETE_PATTERNS = [
    { id: 'essential-launch', re: /Essential Launch/gi },
    { id: 'local-launch-site-name', re: /Local Launch Site/gi },
    { id: 'local-launch-plus-name', re: /Local Launch Plus/gi },
    { id: 'search-foundation-name', re: /Search Foundation(?: Plus| Site)?/g },
    { id: 'ecommerce-launch-plus-name', re: /E-Commerce Launch Plus/gi },
    { id: 'max-80-100-for-4500', re: /(?:Max Authority[^\n]{0,100})?80[–-]100\+[\s\S]{0,100}\$4,?500|\$4,?500[\s\S]{0,100}80[–-]100\+/gi },
    { id: 'preview-500', re: /Preview Launch[^\n]{0,50}\$500|(?<!from )\$500[^\n]{0,50}Preview Launch/gi },
    { id: 'local-launch-1997', re: /(?:Local (?:Launch|Site)[^\n]{0,50})?\$1,?997/gi },
    { id: 'ecommerce-2497', re: /\$2,?497/gi },
    { id: 'preview-20-page-scope', re: /Preview Launch[^\n]{0,100}up to ~?20 pages|up to ~?20 pages[^\n]{0,100}Preview Launch/gi },
    { id: 'local-35-page-scope', re: /Local Site[^\n]{0,100}up to 35 pages|up to 35 pages[^\n]{0,100}Local Site/gi },
    { id: 'authority-35-60-scope', re: /Authority(?: Site)?[^\n]{0,100}35[–-]60 pages|35[–-]60 pages[^\n]{0,100}Authority(?: Site)?/gi },
    { id: 'growth-70-page-promise', re: /Growth (?:System )?sites? (?:are|start at|include)[^\n]{0,30}70\+ pages|70\+ page Growth (?:System )?site/gi }
];

const HISTORICAL_CONTEXT = /\b(?:case stud(?:y|ies)|historical|formerly|former|legacy|retired|deprecated|obsolete|at the time|original(?:ly)?|delivered|built|live client|proof|do not cite|do not advertise)\b/i;
const PARITY_FIELDS = [
    'id',
    'lane',
    'name',
    'billingType',
    'pricingMode',
    'checkoutMode',
    'projectPrice',
    'setupPrice',
    'monthlyPrice',
    'depositPrice',
    'maximumPrice',
    'maximumMonthlyPrice',
    'priceDisplay',
    'public',
    'indexable',
    'recommendable',
    'checkoutEnabled',
    'deprecated'
];

const STRUCTURED_DATA_EXPECTATIONS = {
    'service-websites.html': [
        'website-demo-preview',
        'website-preview-launch',
        'website-local-seo-starter',
        'website-local-launch-plus',
        'website-local-launch-max',
        'website-authority-network'
    ],
    'service-ecommerce.html': [
        'ecommerce-preview-catalog',
        'ecommerce-payment-links',
        'ecommerce-launch',
        'ecommerce-growth-store',
        'ecommerce-advanced-system'
    ],
    'service-google-business-profile.html': [
        'gbp-setup',
        'gbp-maintenance',
        'gbp-optimization',
        'gbp-recovery'
    ],
    'service-ai-automation.html': [
        'ops-automation-build'
    ],
    'automation.html': [
        'ops-automation-build',
        'ops-growth-system-starter',
        'ops-full-growth-system',
        'ops-custom-automation-system',
        'ops-growth-systems-only-starter',
        'ops-growth-systems-only-full',
        'ops-growth-systems-only-field'
    ]
};

const REQUIRED_COPY = {
    'service-websites.html': [
        '$200', '1–5 preview pages',
        '$750', 'Up to 10 preview pages',
        '$1,200', 'Up to 15 live pages',
        '$2,000', 'Up to 30',
        '$4,500', 'Up to 40',
        'From $6,500', '60–100+'
    ],
    'service-ecommerce.html': [
        '$750', '$1,200', '$2,997', '$3,997', 'From $7,500'
    ],
    'service-google-business-profile.html': [
        '$497', '$147/mo', '$500–$900', '$750–$1,500+'
    ],
    'service-ai-automation.html': [
        '$500–$10,000+'
    ],
    'automation.html': [
        '$500–$10,000+',
        '$5,000 setup + $397/mo',
        '$7,500 setup + $697/mo',
        '$10,000 setup + $1,000/mo',
        '$2,500 setup + $397/mo',
        '$3,500 setup + $697/mo',
        '$8,000 setup + $1,000/mo'
    ],
    'package-demo-preview.html': ['$200', '1–5 pages'],
    'package-preview-launch.html': ['$750', 'up to 10'],
    'package-local-launch.html': ['$1,200', 'up to 15'],
    'package-authority-site.html': ['$2,000', 'up to 30'],
    'package-max-authority.html': ['$4,500', 'up to 40'],
    'package-authority-network.html': ['From $6,500', '60–100+', '$2,500'],
    'package-storefront.html': ['$750', '$1,200', '$2,997', '$3,997', 'from $7,500', '$2,500'],
    'package-growth-system.html': [
        '$5,000 setup + $397/mo',
        '$7,500 setup + $697/mo',
        '$10,000 setup + $1,000/mo',
        '$2,500 setup + $397/mo',
        '$3,500 setup + $697/mo',
        '$8,000 setup + $1,000/mo'
    ],
    'ai.txt': [
        '$200', '$750', '$1,200', '$2,000', '$4,500', '$6,500',
        '$2,997', '$3,997', '$7,500', '$497', '$147',
        '$5,000', '$7,500', '$10,000', '$2,500', '$3,500', '$8,000'
    ],
    'llms.txt': [
        '$200', '$750', '$1,200', '$2,000', '$4,500', '$6,500',
        '$5,000', '$7,500', '$10,000', '$2,500', '$3,500', '$8,000'
    ],
    'llms-full.txt': [
        '$200', '$750', '$1,200', '$2,000', '$4,500', '$6,500',
        '$5,000', '$7,500', '$10,000', '$2,500', '$3,500', '$8,000'
    ]
};

function walkPublicFiles(dir, acc = []) {
    if (!fs.existsSync(dir)) {
        return acc;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (
            entry.name === 'node_modules'
            || entry.name === '.git'
            || entry.name === 'dist'
            || entry.name === '_rollback'
            || entry.name === 'demos'
        ) {
            continue;
        }

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            walkPublicFiles(full, acc);
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

function activePackages(catalog) {
    return (catalog.packages || []).filter(
        (pkg) => pkg.public === true && pkg.deprecated !== true && pkg.checkoutMode !== 'DISABLED'
    );
}

function cents(value) {
    return Math.round(Number(value || 0) * 100);
}

function assertCatalogSemantics(catalog, failures) {
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(String(catalog.catalogVersion || ''))) {
        failures.push('Catalog catalogVersion must use YYYY.MM.DD');
    }

    const ids = (catalog.packages || []).map((pkg) => pkg.id);
    if (new Set(ids).size !== ids.length) {
        failures.push('Catalog package ids must be unique');
    }

    for (const pkg of catalog.packages || []) {
        for (const field of ['id', 'lane', 'name', 'billingType', 'pricingMode', 'checkoutMode', 'priceDisplay']) {
            if (!pkg[field]) {
                failures.push(`Catalog package ${pkg.id || '(missing id)'} is missing ${field}`);
            }
        }

        for (const field of ['public', 'indexable', 'recommendable', 'checkoutEnabled']) {
            if (typeof pkg[field] !== 'boolean') {
                failures.push(`Catalog package ${pkg.id} needs explicit boolean ${field}`);
            }
        }

        if (pkg.checkoutMode === 'DISABLED') {
            if (pkg.public || pkg.indexable || pkg.recommendable || pkg.checkoutEnabled || pkg.deprecated !== true) {
                failures.push(`${pkg.id} disabled record must be deprecated, hidden, nonindexable, nonrecommendable, and checkout-disabled`);
            }
        }

        if (pkg.checkoutMode === 'CONSULT_ONLY' && pkg.checkoutEnabled) {
            failures.push(`${pkg.id} consult-only record cannot enable checkout`);
        }
    }
}

function loadGeneratedCatalog() {
    const source = fs.readFileSync(GENERATED_CATALOG_PATH, 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: GENERATED_CATALOG_PATH });
    return JSON.parse(JSON.stringify(sandbox.KL_PACKAGE_CATALOG));
}

function assertCatalogArtifactParity(catalog, artifact, label, failures) {
    if (!artifact || typeof artifact !== 'object') {
        failures.push(`${label} is missing its catalog object`);
        return;
    }

    for (const field of ['catalogVersion', 'currency']) {
        if (artifact[field] !== catalog[field]) {
            failures.push(`${label} ${field} (${artifact[field]}) != catalog (${catalog[field]})`);
        }
    }

    const sourceMap = new Map((catalog.packages || []).map((pkg) => [pkg.id, pkg]));
    const artifactMap = new Map((artifact.packages || []).map((pkg) => [pkg.id, pkg]));
    const sourceKeys = [...sourceMap.keys()].sort();
    const artifactKeys = [...artifactMap.keys()].sort();

    if (JSON.stringify(sourceKeys) !== JSON.stringify(artifactKeys)) {
        const missing = sourceKeys.filter((key) => !artifactMap.has(key));
        const extra = artifactKeys.filter((key) => !sourceMap.has(key));
        failures.push(
            `${label} package keys differ`
            + (missing.length ? `; missing: ${missing.join(', ')}` : '')
            + (extra.length ? `; extra: ${extra.join(', ')}` : '')
        );
    }

    for (const [id, pkg] of sourceMap) {
        const artifactPkg = artifactMap.get(id);
        if (!artifactPkg) {
            continue;
        }

        for (const field of PARITY_FIELDS) {
            if (artifactPkg[field] !== pkg[field]) {
                failures.push(
                    `${label} ${id}.${field} (${artifactPkg[field]}) != catalog (${pkg[field]})`
                );
            }
        }
    }
}

function assertMachineParity(catalog, failures) {
    if (!fs.existsSync(GENERATED_CATALOG_PATH)) {
        failures.push('Missing pricing/package-catalog.generated.js');
        return;
    }

    assertCatalogArtifactParity(catalog, loadGeneratedCatalog(), 'Browser catalog', failures);

    const apiCatalogModulePath = path.join(ROOT, 'api', '_lib', 'package-catalog.js');
    if (!fs.existsSync(apiCatalogModulePath)) {
        failures.push('Missing api/_lib/package-catalog.js');
        return;
    }

    delete require.cache[require.resolve(apiCatalogModulePath)];
    const apiCatalogModule = require(apiCatalogModulePath);

    try {
        assert.deepEqual(apiCatalogModule.catalog, catalog);
    } catch (error) {
        failures.push(`Checkout API catalog is not an exact catalog copy: ${error.message.split('\n')[0]}`);
    }

    const definitions = apiCatalogModule.buildPackageDefinitions();
    const paymentOptions = apiCatalogModule.buildPaymentOptions();
    const catalogKeys = (catalog.packages || []).map((pkg) => pkg.id).sort();
    const definitionKeys = Object.keys(definitions).sort();

    if (JSON.stringify(catalogKeys) !== JSON.stringify(definitionKeys)) {
        failures.push('Checkout definition keys must exactly match all catalog keys, including disabled records');
    }

    for (const pkg of catalog.packages || []) {
        const definition = definitions[pkg.id];
        if (!definition) {
            continue;
        }

        for (const field of ['name', 'priceDisplay', 'billingType', 'pricingMode', 'checkoutMode', 'checkoutEnabled']) {
            if (definition[field] !== pkg[field]) {
                failures.push(`${pkg.id} API ${field} (${definition[field]}) != catalog (${pkg[field]})`);
            }
        }

        if (definition.deprecated !== (pkg.deprecated === true)) {
            failures.push(`${pkg.id} API deprecated flag does not match catalog`);
        }
        if (definition.currency !== String(catalog.currency).toLowerCase()) {
            failures.push(`${pkg.id} API currency does not match catalog currency ${catalog.currency}`);
        }
        if (definition.metadata.catalogVersion !== catalog.catalogVersion) {
            failures.push(`${pkg.id} API catalogVersion does not match ${catalog.catalogVersion}`);
        }
        if (definition.metadata.pricingMode !== pkg.pricingMode) {
            failures.push(`${pkg.id} API metadata pricingMode does not match catalog`);
        }
        if (definition.metadata.checkoutMode !== pkg.checkoutMode) {
            failures.push(`${pkg.id} API metadata checkoutMode does not match catalog`);
        }

        const recurring = ['MONTHLY', 'SETUP_MONTHLY'].includes(pkg.billingType);
        if (pkg.checkoutEnabled) {
            const expectedAmount = cents(recurring ? pkg.monthlyPrice : pkg.projectPrice);
            if (definition.amount !== expectedAmount) {
                failures.push(`${pkg.id} API amount ${definition.amount} != catalog amount ${expectedAmount}`);
            }
            if (definition.mode !== (recurring ? 'subscription' : 'payment')) {
                failures.push(`${pkg.id} API mode does not match billingType ${pkg.billingType}`);
            }
            if (definition.setupAmount !== (pkg.setupPrice ? cents(pkg.setupPrice) : undefined)) {
                failures.push(`${pkg.id} API setup amount does not match catalog setupPrice`);
            }
        }

        const expectsDeposit = Boolean(
            pkg.depositPrice && ['FULL_OR_DEPOSIT', 'DEPOSIT_ONLY'].includes(pkg.checkoutMode)
        );
        if (Boolean(paymentOptions[pkg.id]) !== expectsDeposit) {
            failures.push(`${pkg.id} deposit checkout options do not match catalog checkoutMode`);
        } else if (expectsDeposit && paymentOptions[pkg.id].deposit.amount !== cents(pkg.depositPrice)) {
            failures.push(`${pkg.id} deposit amount does not match catalog depositPrice`);
        }
    }
}

function hasHistoricalContext(text, matchIndex, relative) {
    const context = text.slice(Math.max(0, matchIndex - 180), matchIndex + 220);
    return relative.startsWith('case-study') || HISTORICAL_CONTEXT.test(context);
}

function scanObsoletePatterns(catalog, failures) {
    const disabledNames = new Set(
        (catalog.packages || [])
            .filter((pkg) => pkg.checkoutMode === 'DISABLED')
            .map((pkg) => pkg.name)
    );
    const files = walkPublicFiles(ROOT).filter((filePath) => {
        const relative = rel(filePath);
        return !relative.startsWith('Tic-Tac-Toe/')
            && !relative.startsWith('Chess-Game-main/')
            && !relative.startsWith('CRM-Management-System/')
            && !relative.startsWith('Ecommerce-Management-System/')
            && !relative.startsWith('Employee-Management-System/')
            && !relative.startsWith('Invoice-Management-System/')
            && !relative.startsWith('Project-Management-System/');
    });

    for (const filePath of files) {
        const relative = rel(filePath);
        const text = fs.readFileSync(filePath, 'utf8');

        for (const pattern of OBSOLETE_PATTERNS) {
            pattern.re.lastIndex = 0;
            let match;

            while ((match = pattern.re.exec(text)) !== null) {
                if (!hasHistoricalContext(text, match.index, relative)) {
                    failures.push(`[${pattern.id}] obsolete commercial copy in ${relative}`);
                    break;
                }
            }
        }

        for (const disabledName of disabledNames) {
            let matchIndex = text.indexOf(disabledName);

            while (matchIndex !== -1) {
                if (!hasHistoricalContext(text, matchIndex, relative)) {
                    failures.push(`[disabled-package] ${disabledName} is exposed in ${relative}`);
                    break;
                }

                matchIndex = text.indexOf(disabledName, matchIndex + disabledName.length);
            }
        }
    }
}

function assertRequiredCopy(failures) {
    for (const [relative, needles] of Object.entries(REQUIRED_COPY)) {
        const filePath = path.join(ROOT, relative);
        if (!fs.existsSync(filePath)) {
            failures.push(`Missing public pricing surface ${relative}`);
            continue;
        }

        const text = fs.readFileSync(filePath, 'utf8');
        const compactText = text.replace(/\s+/g, ' ').toLowerCase();

        for (const needle of needles) {
            if (!compactText.includes(needle.replace(/\s+/g, ' ').toLowerCase())) {
                failures.push(`${relative} is missing canonical copy: ${needle}`);
            }
        }
    }
}

function assertRuntimeCopy(failures) {
    const runtimePath = path.join(ROOT, 'pricing', 'package-checkout.js');
    const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
    const prohibited = [
        ['Growth 70+ page promise', /70\+\s+page Growth (?:System )?site/i],
        ['Authority 35–60 page scope', /35[–-]60\s+page (?:Authority )?build/i],
        ['public Growth checkout before scope', /Checkout starts from \$5,000 setup \+ \$397\/mo/i]
    ];

    for (const [label, pattern] of prohibited) {
        if (pattern.test(runtimeSource)) {
            failures.push(`pricing/package-checkout.js retains prohibited runtime copy: ${label}`);
        }
    }

    for (const required of [
        'named Local/Authority-equivalent website scope',
        'Continue to Scope Consultation'
    ]) {
        if (!runtimeSource.includes(required)) {
            failures.push(`pricing/package-checkout.js is missing canonical runtime copy: ${required}`);
        }
    }
}

function extractJsonLd(relative, failures) {
    const filePath = path.join(ROOT, relative);
    const html = fs.readFileSync(filePath, 'utf8');
    const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const documents = [];

    for (const [index, block] of blocks.entries()) {
        try {
            documents.push(JSON.parse(block[1]));
        } catch (error) {
            failures.push(`${relative} has invalid JSON-LD block ${index + 1}: ${error.message}`);
        }
    }

    return documents;
}

function walkObjects(value, visit) {
    if (!value || typeof value !== 'object') {
        return;
    }

    visit(value);
    for (const nested of Object.values(value)) {
        if (Array.isArray(nested)) {
            nested.forEach((item) => walkObjects(item, visit));
        } else {
            walkObjects(nested, visit);
        }
    }
}

function offerBasePrice(pkg) {
    if (pkg.billingType === 'MONTHLY') {
        return pkg.monthlyPrice;
    }
    if (pkg.billingType === 'SETUP_MONTHLY') {
        return pkg.setupPrice;
    }
    return pkg.projectPrice;
}

function assertStructuredData(catalog, failures) {
    const packageMap = new Map((catalog.packages || []).map((pkg) => [pkg.id, pkg]));
    const disabledNames = (catalog.packages || [])
        .filter((pkg) => pkg.checkoutMode === 'DISABLED')
        .map((pkg) => pkg.name);

    for (const [relative, expectedIds] of Object.entries(STRUCTURED_DATA_EXPECTATIONS)) {
        const documents = extractJsonLd(relative, failures);
        const linkedIds = new Set();

        walkObjects(documents, (node) => {
            const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
            if (!types.includes('Offer') && !types.includes('AggregateOffer')) {
                return;
            }

            const packageId = typeof node.identifier === 'string'
                ? node.identifier
                : node.identifier && node.identifier.value;

            if (!packageId) {
                return;
            }

            const pkg = packageMap.get(packageId);
            if (!pkg) {
                failures.push(`${relative} JSON-LD offer uses unknown package key ${packageId}`);
                return;
            }
            if (pkg.public !== true || pkg.deprecated === true || pkg.checkoutMode === 'DISABLED') {
                failures.push(`${relative} JSON-LD exposes disabled/nonpublic package ${packageId}`);
                return;
            }

            linkedIds.add(packageId);

            if (node.name !== pkg.name) {
                failures.push(`${relative} JSON-LD ${packageId} name does not match catalog`);
            }

            const serialized = JSON.stringify(node);
            if (!serialized.includes(pkg.billingType) || !serialized.includes(pkg.checkoutMode)) {
                failures.push(`${relative} JSON-LD ${packageId} is missing billingType/checkoutMode semantics`);
            }

            const price = Number(node.price !== undefined ? node.price : node.lowPrice);
            if (price !== Number(offerBasePrice(pkg))) {
                failures.push(`${relative} JSON-LD ${packageId} price ${price} != catalog ${offerBasePrice(pkg)}`);
            }
        });

        const expected = [...expectedIds].sort();
        const actual = [...linkedIds].sort();
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            failures.push(`${relative} JSON-LD package keys differ: expected ${expected.join(', ')}, found ${actual.join(', ') || '(none)'}`);
        }

        const raw = JSON.stringify(documents);
        for (const disabledName of disabledNames) {
            if (raw.includes(disabledName)) {
                failures.push(`${relative} JSON-LD exposes disabled package name ${disabledName}`);
            }
        }
    }
}

function main() {
    const failures = [];

    if (!fs.existsSync(CATALOG_PATH)) {
        console.error('Missing data/package-catalog.json');
        process.exit(1);
    }

    const catalog = loadCatalog();
    assertCatalogSemantics(catalog, failures);
    assertMachineParity(catalog, failures);
    assertRequiredCopy(failures);
    assertRuntimeCopy(failures);
    assertStructuredData(catalog, failures);
    scanObsoletePatterns(catalog, failures);

    if (failures.length) {
        console.error('Pricing drift check FAILED:\n');
        for (const failure of failures) {
            console.error(' - ' + failure);
        }
        process.exit(1);
    }

    console.log('Pricing drift check passed.');
    console.log(`Catalog version: ${catalog.catalogVersion || 'unknown'}`);
    console.log(`Packages: ${(catalog.packages || []).length}`);
    console.log(`Public sellable packages: ${activePackages(catalog).length}`);
}

main();
