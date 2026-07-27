#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');

const baseUrl = String(process.env.KL_QA_BASE_URL || 'http://127.0.0.1:4183').replace(/\/$/, '');
const checkoutCases = [
    { key: 'website-demo-preview', name: 'Demo Preview', price: '$200', options: ['full'], select: 'full' },
    { key: 'website-local-seo-starter', name: 'Local Site', price: '$1,200', options: ['full', 'deposit'], select: 'deposit', selectedPrice: '$600' },
    { key: 'website-local-launch-plus', name: 'Authority Site', price: '$2,000', options: ['full', 'deposit'], select: 'full' },
    { key: 'website-local-launch-max', name: 'Max Authority Site', price: '$4,500', options: ['full', 'deposit'], select: 'full' },
    { key: 'website-authority-network', name: 'Authority Network', price: 'From $6,500', options: ['deposit'], select: 'deposit', selectedPrice: '$2,500' },
    { key: 'ecommerce-launch', name: 'E-Commerce Launch', price: '$2,997', options: ['full', 'deposit'], select: 'full' },
    { key: 'ecommerce-advanced-system', name: 'Advanced E-Commerce System', price: 'From $7,500', options: ['deposit'], select: 'deposit', selectedPrice: '$2,500' },
    { key: 'gbp-setup', name: 'Google Business Profile Setup', price: '$497', options: ['full'], select: 'full' },
    { key: 'gbp-maintenance', name: 'Google Business Profile Maintenance', price: '$147/mo', options: ['full'], select: 'full' },
    { key: 'monthly-local-seo-starter', name: 'Visibility Lite', price: '$197/mo', options: ['full'], select: 'full' },
    { key: 'monthly-visibility-standard', name: 'Visibility Standard', price: '$397/mo', options: ['full'], select: 'full' },
    { key: 'monthly-visibility-pro', name: 'Visibility Pro', price: '$697/mo', options: ['full'], select: 'full' }
];

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];

    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(`console: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}`);
    });

    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded' });
    await page.locator('main').waitFor();

    for (const heading of ['Build a Site', 'Sell Online', 'Stay Visible', 'Run Operations']) {
        const count = await page.getByText(heading, { exact: false }).count();
        if (!count) {
            throw new Error(`Pricing lane heading missing: ${heading}`);
        }
    }

    for (const checkoutCase of checkoutCases) {
        await page.goto(
            `${baseUrl}/pricing?openPackage=${encodeURIComponent(checkoutCase.key)}`,
            { waitUntil: 'domcontentloaded' }
        );
        const overlay = page.locator('#starterPackageIntake');
        await overlay.waitFor({ state: 'visible' });
        const label = await page.locator('#starterPackageIntakePackage').textContent();
        if (!String(label || '').includes(checkoutCase.name) || !String(label || '').includes(checkoutCase.price)) {
            throw new Error(`${checkoutCase.key} opened unexpected checkout label: ${label}`);
        }

        const paymentOptions = await page.locator('input[name="paymentOption"]').evaluateAll(
            (inputs) => inputs.map((input) => input.value)
        );
        if (JSON.stringify(paymentOptions) !== JSON.stringify(checkoutCase.options)) {
            throw new Error(`${checkoutCase.key} exposed payment options ${paymentOptions.join(', ')}; expected ${checkoutCase.options.join(', ')}`);
        }

        await page.locator(`input[name="paymentOption"][value="${checkoutCase.select}"]`).check();
        const selectedPayment = await page.locator('input[name="paymentOption"]:checked').getAttribute('value');
        if (selectedPayment !== checkoutCase.select) {
            throw new Error(`${checkoutCase.key} did not preserve ${checkoutCase.select} payment selection.`);
        }
        if (checkoutCase.selectedPrice) {
            const summaryPrice = await page.locator('#starterPackageConfiguratorPrice').textContent();
            if (!String(summaryPrice || '').includes(checkoutCase.selectedPrice)) {
                throw new Error(`${checkoutCase.key} selected payment summary ${summaryPrice} does not include ${checkoutCase.selectedPrice}.`);
            }
        }
        await page.keyboard.press('Escape');
        await overlay.waitFor({ state: 'hidden' });
    }

    for (const packageKey of [
        'ops-growth-system-starter',
        'ops-growth-systems-only-starter',
        'monthly-growth-management'
    ]) {
        await page.goto(
            `${baseUrl}/pricing?openPackage=${encodeURIComponent(packageKey)}`,
            { waitUntil: 'domcontentloaded' }
        );
        await page.waitForURL(new RegExp(`/contact\\?reason=scope&package=${packageKey}`));
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (overflow) {
        throw new Error('Pricing page has horizontal overflow at 390px.');
    }

    await page.goto(`${baseUrl}/pay-invoice`, { waitUntil: 'domcontentloaded' });
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    if (!/noindex/i.test(robots || '')) {
        throw new Error('/pay-invoice must remain noindex.');
    }
    await page.locator('#invoicePaymentForm').waitFor({ state: 'visible' });
    const invoiceLimits = await page.locator('#invoiceAmount').evaluate((input) => ({
        min: input.getAttribute('min'),
        max: input.getAttribute('max'),
        step: input.getAttribute('step')
    }));
    if (JSON.stringify(invoiceLimits) !== JSON.stringify({ min: '1', max: '50000', step: '0.01' })) {
        throw new Error(`/pay-invoice amount limits changed unexpectedly: ${JSON.stringify(invoiceLimits)}`);
    }

    await browser.close();

    if (errors.length) {
        throw new Error(errors.join('\n'));
    }

    process.stdout.write(`Commercial browser QA passed against ${baseUrl}.\n`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});

