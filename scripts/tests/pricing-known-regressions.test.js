'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function catalog() {
    return JSON.parse(read('data/package-catalog.json'));
}

function packageById(id) {
    return catalog().packages.find((pkg) => pkg.id === id);
}

test('all visible checkout keys exist as active catalog packages', () => {
    const html = `${read('index.html')}\n${read('pricing.html')}`;
    const visibleKeys = new Set(
        [...html.matchAll(/data-package-key=["']([^"']+)["']/g)].map((match) => match[1])
    );
    const activeKeys = new Set(
        catalog().packages
            .filter((pkg) => pkg.public !== false && pkg.deprecated !== true)
            .map((pkg) => pkg.id)
    );

    assert.deepEqual(
        [...visibleKeys].filter((key) => !activeKeys.has(key)).sort(),
        [],
        'Every visible package CTA must resolve to an active catalog entry.'
    );
});

test('GBP setup and maintenance are canonical checkout packages', () => {
    const setup = packageById('gbp-setup');
    const maintenance = packageById('gbp-maintenance');

    assert.equal(setup && setup.checkoutMode, 'FULL');
    assert.equal(setup && setup.projectPrice, 497);
    assert.equal(maintenance && maintenance.checkoutMode, 'FULL');
    assert.equal(maintenance && maintenance.monthlyPrice, 147);
});

test('deprecated Search Foundation packages cannot be recommended', () => {
    const homepage = read('index.html');
    const activeRecommendationSource = homepage.slice(homepage.indexOf('function getPackageRoute'));

    assert.doesNotMatch(activeRecommendationSource, /recommendedPackageKey\s*=\s*['"]website-search-foundation/);
    assert.doesNotMatch(activeRecommendationSource, /fits (?:the )?Search Foundation package/i);
});

test('website ladder page caps increase with price', () => {
    const ids = [
        'website-demo-preview',
        'website-preview-launch',
        'website-local-seo-starter',
        'website-local-launch-plus',
        'website-local-launch-max'
    ];
    const packages = ids.map(packageById);

    for (const pkg of packages) {
        assert.ok(pkg, `Missing ${pkg && pkg.id}`);
        assert.equal(pkg.pricingMode, 'FLAT');
    }

    for (let index = 1; index < packages.length; index += 1) {
        assert.ok(
            packages[index].pageLimit > packages[index - 1].pageLimit,
            `${packages[index].name} must have a larger page cap than ${packages[index - 1].name}.`
        );
    }
});

test('scoped packages expose only their approved checkout mode', () => {
    const network = packageById('website-authority-network');
    const advancedStore = packageById('ecommerce-advanced-system');
    const growth = packageById('ops-growth-system-starter');

    assert.equal(network && network.checkoutMode, 'DEPOSIT_ONLY');
    assert.equal(advancedStore && advancedStore.checkoutMode, 'DEPOSIT_ONLY');
    assert.equal(growth && growth.checkoutMode, 'CONSULT_ONLY');
});

test('public pricing does not advertise stale package names or price syntax', () => {
    const files = fs.readdirSync(ROOT)
        .filter((name) => /^(?:package-.*|service-websites|automation|index|pricing)\.html$/i.test(name));
    const publicCopy = files.map(read).join('\n');

    assert.doesNotMatch(publicCopy, /Essential Launch|Local Launch Plus|Search Foundation Site/i);
    assert.doesNotMatch(publicCopy, /\$3,997\+/);
    assert.doesNotMatch(publicCopy, /Growth sites? (?:are|start at) 70\+ pages/i);
    assert.doesNotMatch(publicCopy, /Preview Launch[^\n]{0,80}up to ~?20 pages/i);
    assert.doesNotMatch(publicCopy, /Local Site[^\n]{0,80}up to 35 pages/i);
    assert.doesNotMatch(publicCopy, /Authority(?: Site)?[^\n]{0,80}35[–-]60 pages/i);
});

test('package pages preserve canonical website bands and Growth setup prices', () => {
    assert.match(read('package-demo-preview.html'), /1[–-]5 pages/i);
    assert.match(read('package-preview-launch.html'), /up to 10/i);
    assert.match(read('package-local-launch.html'), /up to 15 live pages/i);
    assert.match(read('package-authority-site.html'), /up to 30 (?:planned )?live pages/i);
    assert.match(read('package-max-authority.html'), /up to 40/i);
    assert.match(read('package-authority-network.html'), /60[–-]100\+/i);

    const growth = read('package-growth-system.html');
    for (const expected of [
        '$5,000 setup + $397/mo',
        '$7,500 setup + $697/mo',
        '$10,000 setup + $1,000/mo',
        '$2,500 setup + $397/mo',
        '$3,500 setup + $697/mo',
        '$8,000 setup + $1,000/mo'
    ]) {
        assert.ok(growth.includes(expected), `Growth package page is missing ${expected}.`);
    }
    assert.doesNotMatch(growth, /70\+\s+page/i);
});

test('catalog proof paths resolve and planned proof records are explicit', () => {
    for (const pkg of catalog().packages) {
        for (const asset of pkg.proofAssets || []) {
            if (asset.type === 'planned') {
                assert.ok(asset.label && asset.label.length > 20, `${pkg.id} needs a useful planned-proof label.`);
                continue;
            }

            assert.ok(asset.path, `${pkg.id} proof asset needs a path.`);
            const pathname = decodeURIComponent(String(asset.path).split(/[?#]/)[0]).replace(/^\/+/, '');
            const base = path.join(ROOT, pathname);
            const candidates = asset.path.endsWith('/')
                ? [path.join(base, 'index.html')]
                : [base, `${base}.html`, path.join(base, 'index.html')];
            assert.ok(
                candidates.some((candidate) => fs.existsSync(candidate)),
                `${pkg.id} proof asset does not resolve: ${asset.path}`
            );
        }
    }
});

test('preview demo documents contain valid robots meta tags', () => {
    const demoRoot = path.join(ROOT, 'demos', 'preview-launch');
    const files = [];

    function walk(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith('.html')) {
                files.push(fullPath);
            }
        }
    }

    walk(demoRoot);

    for (const filePath of files) {
        const html = fs.readFileSync(filePath, 'utf8');
        assert.match(html, /<title>[^<]+<\/title>/i, `${path.relative(ROOT, filePath)} needs one valid title.`);
        assert.match(
            html,
            /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']\s*\/?>/i,
            `${path.relative(ROOT, filePath)} needs a valid noindex robots tag.`
        );
    }
});

