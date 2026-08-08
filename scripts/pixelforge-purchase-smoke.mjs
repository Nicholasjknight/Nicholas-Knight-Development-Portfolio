import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import Stripe from 'stripe';

const require = createRequire(import.meta.url);
const billing = require('../api/_lib/pixelforge-billing');

function parseEnvFile(filePath) {
  const values = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const separator = line.indexOf('=');
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value.replace(/\\n/g, '\n');
  }
  return values;
}

async function fillFirst(page, selectors, value) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const context of page.frames()) {
      for (const selector of selectors) {
        const field = context.locator(selector).first();
        if (await field.count() && await field.isVisible().catch(() => false)) {
          await field.fill(value);
          return selector;
        }
      }
    }
    await page.waitForTimeout(500);
  }
  const available = [];
  for (const frame of page.frames()) {
    const fields = await frame.locator('input').evaluateAll((inputs) => inputs.map((input) => ({
      name: input.getAttribute('name'),
      autocomplete: input.getAttribute('autocomplete'),
      type: input.getAttribute('type'),
      ariaLabel: input.getAttribute('aria-label'),
      testId: input.getAttribute('data-testid'),
    }))).catch(() => []);
    available.push(...fields);
  }
  throw new Error(`Stripe Checkout field not found: ${selectors.join(', ')}; available=${JSON.stringify(available)}`);
}

function createFulfillmentSql() {
  const state = { account: null, sessions: new Set() };
  const sql = async (strings, ...values) => {
    const query = strings.join('?').replace(/\s+/g, ' ').trim();
    if (query.includes('INSERT INTO pixelforge_accounts')) {
      const [machineId, email] = values;
      if (!state.account) {
        state.account = {
          machine_id: machineId,
          free_trial_total: 20,
          free_trial_remaining: 20,
          paid_credits: 0,
          email: email || null,
          stripe_customer_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_seen_at: new Date(),
        };
      } else if (email) {
        state.account.email = email;
      }
      return [{ ...state.account }];
    }
    if (query.startsWith('UPDATE pixelforge_accounts SET stripe_customer_id')) {
      const [customerId, email] = values;
      state.account.stripe_customer_id = customerId || state.account.stripe_customer_id;
      state.account.email = email || state.account.email;
      return [];
    }
    if (query.includes('INSERT INTO pixelforge_processed_sessions')) {
      const [sessionId] = values;
      if (state.sessions.has(sessionId)) return [];
      state.sessions.add(sessionId);
      return [{ session_id: sessionId }];
    }
    if (query.startsWith('UPDATE pixelforge_accounts SET paid_credits')) {
      const [credits] = values;
      state.account.paid_credits += Number(credits);
      return [];
    }
    throw new Error(`Unhandled fulfillment SQL in smoke: ${query}`);
  };
  return { sql, state };
}

async function main() {
  if (process.env.PIXELFORGE_ALLOW_PURCHASE_SMOKE !== '1') {
    throw new Error('Set PIXELFORGE_ALLOW_PURCHASE_SMOKE=1 to run this test-mode purchase smoke.');
  }
  const stripeEnvPath = process.env.PIXELFORGE_STRIPE_ENV_FILE;
  assert.ok(stripeEnvPath && fs.existsSync(stripeEnvPath), 'Development Stripe environment file is required.');

  const stripeEnv = parseEnvFile(stripeEnvPath);
  const stripeKey = stripeEnv.STRIPE_SECRET_KEY || stripeEnv.STRIPE_API_KEY || '';
  assert.match(stripeKey, /^sk_test_/, 'Purchase smoke refuses any non-test Stripe key.');
  process.env.STRIPE_SECRET_KEY = stripeKey;

  const webhookSecret = `whsec_pixelforge_smoke_${crypto.randomBytes(16).toString('hex')}`;
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-03-31.basil' });
  const runId = crypto.randomUUID();
  const machineId = crypto.createHash('sha256').update(`pixelforge-purchase-smoke:${runId}`).digest('hex');
  const email = `pixelforge-smoke+${runId}@example.com`;
  let sessionId = '';
  let customerId = '';
  let browser;
  let server;

  try {
    let redirectUrl = '';
    server = http.createServer((req, res) => {
      redirectUrl = `http://127.0.0.1:${server.address().port}${req.url}`;
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('PixelForge test checkout returned successfully.');
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    const origin = `http://127.0.0.1:${port}`;
    const plan = billing.PIXELFORGE_PLANS.starter_32;
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: plan.amount,
          product_data: {
            name: `PixelForge AI - ${plan.label}`,
            description: `${plan.credits} credits for local AI video enhancement.`,
          },
        },
      }],
      metadata: {
        app: 'pixelforge_ai',
        machine_id: machineId,
        plan_id: 'starter_32',
        credits: String(plan.credits),
        paymentType: 'desktop_app_credit_pack',
      },
      success_url: `${origin}/payment_success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment_cancel`,
    });
    assert.equal(checkout.amount_total, 500);
    assert.match(checkout.id, /^cs_test_/);
    sessionId = checkout.id;

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(checkout.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(1_500);
    const cardRadio = page.locator('input[name="payment-method-accordion-item-title"]').first();
    if (await cardRadio.count() && !await cardRadio.isChecked().catch(() => false)) {
      await cardRadio.check({ force: true });
      await page.waitForTimeout(750);
    }
    const cardChoice = page.getByRole('button', { name: /pay with card/i }).first();
    if (await cardChoice.count()) {
      const cardClass = await cardChoice.getAttribute('class') || '';
      const expanded = await cardChoice.getAttribute('aria-expanded');
      if (expanded === 'false' || (!cardClass.includes('AccordionButton-open') && expanded !== 'true')) {
        await cardChoice.click();
      }
    }
    const saveInfo = page.locator('input[type="checkbox"]').first();
    if (await saveInfo.count() && await saveInfo.isChecked().catch(() => false)) await saveInfo.uncheck();
    await fillFirst(page, [
      'input[name="cardNumber"]', 'input[name="cardnumber"]',
      'input[autocomplete="cc-number"]', 'input[data-elements-stable-field-name="cardNumber"]',
    ], '4242424242424242');
    await fillFirst(page, [
      'input[name="cardExpiry"]', 'input[name="exp-date"]',
      'input[autocomplete="cc-exp"]', 'input[data-elements-stable-field-name="cardExpiry"]',
    ], '1240');
    await fillFirst(page, [
      'input[name="cardCvc"]', 'input[name="cvc"]',
      'input[autocomplete="cc-csc"]', 'input[data-elements-stable-field-name="cardCvc"]',
    ], '123');
    await fillFirst(page, ['input[name="billingName"]', 'input[autocomplete="cc-name"]'], 'PixelForge Smoke Test');
    const postal = page.locator('input[name="billingPostalCode"], input[autocomplete="postal-code"]').first();
    if (await postal.count() && await postal.isVisible().catch(() => false)) await postal.fill('10001');
    await page.locator('button[type="submit"]').last().click();
    await page.waitForURL((url) => url.hostname === '127.0.0.1' && url.pathname === '/payment_success', {
      timeout: 60_000,
    });
    assert.match(redirectUrl || page.url(), /payment_success\?session_id=cs_test_/);

    const paidSession = await stripe.checkout.sessions.retrieve(sessionId);
    assert.equal(paidSession.payment_status, 'paid');
    assert.equal(paidSession.amount_total, 500);
    assert.equal(paidSession.metadata?.app, 'pixelforge_ai');
    customerId = typeof paidSession.customer === 'string' ? paidSession.customer : '';

    const eventPayload = JSON.stringify({
      id: `evt_pixelforge_smoke_${runId.replaceAll('-', '')}`,
      object: 'event',
      api_version: '2025-03-31.basil',
      created: Math.floor(Date.now() / 1000),
      data: { object: paidSession },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: 'checkout.session.completed',
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload: eventPayload, secret: webhookSecret });
    const verifiedEvent = stripe.webhooks.constructEvent(eventPayload, signature, webhookSecret);
    assert.equal(verifiedEvent.type, 'checkout.session.completed');
    const { sql } = createFulfillmentSql();
    const webhookResult = await billing.creditPaidSession(sql, verifiedEvent.data.object);
    assert.equal(webhookResult.ok, true);
    assert.equal(webhookResult.credited, true);
    assert.equal(webhookResult.credited_credits, 32);
    assert.equal(webhookResult.credits, 52);

    const confirmResult = await billing.creditPaidSession(sql, paidSession, machineId);
    assert.equal(confirmResult.ok, true);
    assert.equal(confirmResult.already_processed, true);
    assert.equal(confirmResult.credited_credits, 0);
    assert.equal(confirmResult.paid_credits, 32);
    assert.equal(confirmResult.credits, 52);

    console.log(JSON.stringify({
      passed: true,
      stripe_mode: 'test',
      plan_id: 'starter_32',
      amount_cents: paidSession.amount_total,
      webhook_signature_verified: true,
      fulfillment_database: 'in-memory contract (Vercel KL_DATABASE_URL is currently empty)',
      credits_after_purchase: confirmResult.credits,
      paid_credits: confirmResult.paid_credits,
      idempotent_confirmation: confirmResult.already_processed,
    }, null, 2));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    if (customerId) await stripe.customers.del(customerId).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
