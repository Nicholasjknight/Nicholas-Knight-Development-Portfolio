import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const checkoutUrl = process.env.PIXELFORGE_CHECKOUT_SMOKE_URL || '';
if (!checkoutUrl) throw new Error('PIXELFORGE_CHECKOUT_SMOKE_URL is required.');

const parsedUrl = new URL(checkoutUrl);
if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'checkout.stripe.com') {
  throw new Error('Checkout smoke only accepts an HTTPS checkout.stripe.com URL.');
}

const outputDir = path.resolve('website-audit', '2026-08-08');
await fs.mkdir(outputDir, { recursive: true });
const screenshot = path.join(outputDir, 'pixelforge-checkout-starter32.png');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2_000);
  const visibleText = await page.locator('body').innerText();
  const title = await page.title();
  await page.screenshot({ path: screenshot, fullPage: false });

  const checks = {
    status: response?.status() || 0,
    finalHost: new URL(page.url()).hostname,
    title,
    hasProduct: /PixelForge AI\s*-\s*32 Credits/i.test(visibleText),
    hasAmount: /\$5\.00\b/.test(visibleText),
    hasPaymentForm: /card information|pay with|email/i.test(visibleText),
    pageErrors,
    screenshot,
  };
  const passed = Boolean(
    response?.ok()
      && checks.finalHost === 'checkout.stripe.com'
      && checks.hasProduct
      && checks.hasAmount
      && checks.hasPaymentForm
      && checks.pageErrors.length === 0
  );
  console.log(JSON.stringify({ passed, checks }, null, 2));
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
