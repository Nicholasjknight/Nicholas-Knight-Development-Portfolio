const Stripe = require('stripe');
const serviceCheckoutHandler = require('./_lib/service-checkout');
const serviceOrdersHandler = require('./_lib/service-orders');
const serviceDeliveryHandler = require('./_lib/service-delivery');
const serviceStatusHandler = require('./_lib/service-status');

const DEFAULT_ALLOWED_ORIGINS = new Set([
    'https://knightlogics.com',
    'https://www.knightlogics.com',
    'http://127.0.0.1:4180',
    'http://localhost:4180'
]);

const LOCAL_DEV_ORIGIN_PATTERN = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/;
const FORMSPREE_ENDPOINT = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/xnnggyzp';
const VALID_PAGE_COUNT_EXPECTATIONS = new Set(['small', 'preview', 'medium', 'local', 'large', 'authority', 'enterprise', 'max', 'growth']);
const VALID_SEO_EXPANSION_NEEDS = new Set(['no', 'services', 'cities', 'both', 'audit-external', 'audit-limited', 'audit-full', 'audit-maintained']);
const VALID_SELLING_ONLINE_NEEDS = new Set(['no', 'later', 'stripe-links', 'invoicing', 'cart-store']);
const MAX_JSON_BODY_BYTES = 64 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestBuckets = new Map();
const KL_PRODUCT_KEY_META = 'kl_package_key';
const KL_PAYMENT_OPTION_META = 'kl_payment_option';

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

const PACKAGE_DEFINITIONS = {
    'website-demo-preview': {
        mode: 'payment',
        name: 'Demo Preview Site',
        description: 'Low-risk single-page custom demo on a GitHub Pages URL to validate layout, offer clarity, and conversion direction before a full build investment.',
        amount: 20000,
        currency: 'usd',
        priceDisplay: '$200',
        metadata: {
            packageType: 'demo_preview_site',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-preview-launch': {
        mode: 'payment',
        name: 'Preview Launch Site',
        description: 'Professional multi-page preview — up to about 20 pages — for proof-of-concept before a Local or Authority build.',
        amount: 75000,
        currency: 'usd',
        priceDisplay: '$750',
        metadata: {
            packageType: 'preview_launch_site',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-live-essential': {
        mode: 'payment',
        name: 'Essential Launch Site',
        description: 'Deprecated ghost package. Prefer Local Site.',
        amount: 70000,
        currency: 'usd',
        priceDisplay: '$700',
        checkoutEnabled: false,
        deprecated: true,
        metadata: {
            packageType: 'essential_launch_site',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-live-plus': {
        mode: 'payment',
        name: 'Essential Launch Plus',
        description: 'Deprecated ghost package. Prefer Local Site or Authority Site.',
        amount: 85000,
        currency: 'usd',
        priceDisplay: '$850',
        checkoutEnabled: false,
        deprecated: true,
        metadata: {
            packageType: 'essential_launch_plus',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-search-foundation': {
        mode: 'payment',
        name: 'Search Foundation Site',
        description: 'Deprecated — superseded by Local Site.',
        amount: 120000,
        currency: 'usd',
        priceDisplay: '$1,200',
        checkoutEnabled: false,
        deprecated: true,
        metadata: {
            packageType: 'search_foundation_site',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-search-foundation-plus': {
        mode: 'payment',
        name: 'Search Foundation Plus',
        description: 'Deprecated ghost package.',
        amount: 150000,
        currency: 'usd',
        priceDisplay: '$1,500',
        checkoutEnabled: false,
        deprecated: true,
        metadata: {
            packageType: 'search_foundation_plus',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-local-seo-starter': {
        mode: 'payment',
        name: 'Local Site',
        description: 'Domain-backed local website with up to 35 pages, search foundation (GSC, schema, analytics), and launch QA. GBP Setup is optional and chosen in intake.',
        amount: 120000,
        currency: 'usd',
        priceDisplay: '$1,200',
        metadata: {
            packageType: 'local_launch_website_package',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-local-launch-plus': {
        mode: 'payment',
        name: 'Authority Site',
        description: '35-60 page multi-area authority website with advanced schema, conversion tracking, and a GBP setup or optimization pass included.',
        amount: 200000,
        currency: 'usd',
        priceDisplay: '$2,000',
        metadata: {
            packageType: 'local_launch_plus',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-local-launch-max': {
        mode: 'payment',
        name: 'Max Authority Site',
        description: 'Up to 40-page Max Authority website PROJECT with deep service/location architecture, audit-grade SEO/GEO/AEO depth, and a GBP setup or optimization pass included. Ongoing ops sold separately.',
        amount: 450000,
        currency: 'usd',
        priceDisplay: '$4,500',
        billingType: 'PROJECT',
        pageLimit: 40,
        metadata: {
            packageType: 'local_launch_max',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'website-authority-network': {
        mode: 'payment',
        name: 'Authority Network',
        description: '60-100+ page structured service/location architecture. Scope required — deposit or consult only; not a flat open checkout for maximum page counts.',
        amount: 650000,
        currency: 'usd',
        priceDisplay: 'from $6,500',
        billingType: 'SCOPED',
        requireDeposit: true,
        pageLimitMin: 60,
        pageLimit: 100,
        metadata: {
            packageType: 'authority_network',
            fulfillment: 'project',
            family: 'website'
        }
    },
    'ecommerce-preview-catalog': {
        mode: 'payment',
        name: 'Storefront Preview',
        description: 'Custom-coded storefront preview with product cards and inquiry-based calls to action, built to validate a product concept before a full live store.',
        amount: 75000,
        currency: 'usd',
        priceDisplay: '$750',
        metadata: {
            packageType: 'storefront_preview',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'ecommerce-payment-links': {
        mode: 'payment',
        name: 'Payment-Link Store',
        description: 'Small storefront with Stripe payment links, product pages, and a basic purchase flow without full cart or inventory logic.',
        amount: 120000,
        currency: 'usd',
        priceDisplay: '$1,200',
        metadata: {
            packageType: 'payment_link_store',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'ecommerce-launch': {
        mode: 'payment',
        name: 'E-Commerce Launch',
        description: 'Full custom-coded storefront with cart, checkout, product pages, confirmation flow, and initial setup for up to 20 products. CMS can hold more SKUs; extra migration is quoted separately.',
        amount: 299700,
        currency: 'usd',
        priceDisplay: '$2,997',
        billingType: 'PROJECT',
        productLoadLimit: 20,
        metadata: {
            packageType: 'ecommerce_launch',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'ecommerce-launch-plus': {
        mode: 'payment',
        name: 'E-Commerce Launch Plus',
        description: 'Full custom storefront with cart, checkout, product pages, confirmation flow, and extended scope for large catalogs, complex purchase flows, or 20+ products.',
        amount: 349700,
        currency: 'usd',
        priceDisplay: '$3,497',
        metadata: {
            packageType: 'ecommerce_launch_plus',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'ecommerce-growth-store': {
        mode: 'payment',
        name: 'E-Commerce Growth Store',
        description: 'Expanded storefront build with stronger product management, variant support, checkout tracking, and post-purchase automation.',
        amount: 399700,
        currency: 'usd',
        priceDisplay: '$3,997',
        metadata: {
            packageType: 'ecommerce_growth_store',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'ecommerce-advanced-system': {
        mode: 'payment',
        name: 'Advanced E-Commerce System',
        description: 'Advanced e-commerce build with dynamic product management, inventory logic, admin editing, webhooks, and reporting. Scope required — strategy deposit only until scope is confirmed.',
        amount: 750000,
        currency: 'usd',
        priceDisplay: 'from $7,500',
        billingType: 'SCOPED',
        requireDeposit: true,
        metadata: {
            packageType: 'advanced_ecommerce_system',
            fulfillment: 'project',
            family: 'ecommerce'
        }
    },
    'gbp-optimization': {
        mode: 'payment',
        name: 'Google Business Profile Sprint',
        description: 'One-time Google Business Profile sprint covering categories, services, conversion copy, Q&A, review-request guidance, and a ranking baseline.',
        amount: 39700,
        currency: 'usd',
        priceDisplay: '$397',
        metadata: {
            packageType: 'gbp_sprint',
            fulfillment: 'service',
            family: 'seo'
        }
    },
    'monthly-local-seo-starter': {
        mode: 'subscription',
        name: 'Local Visibility Lite',
        description: 'Monthly support with one GBP update or refresh, one small website edit batch, a visibility snapshot, and website-to-GBP alignment checks.',
        amount: 19700,
        currency: 'usd',
        priceDisplay: '$197 / month',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'local_visibility_lite',
            fulfillment: 'subscription',
            family: 'monthly'
        }
    },
    'monthly-visibility-standard': {
        mode: 'subscription',
        name: 'Visibility Standard',
        description: 'Monthly site updates, GBP posts, Search Console checks, analytics review, and local SEO recommendations.',
        amount: 39700,
        currency: 'usd',
        priceDisplay: '$397 / month',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'visibility_standard',
            fulfillment: 'subscription',
            family: 'monthly'
        }
    },
    'monthly-visibility-pro': {
        mode: 'subscription',
        name: 'Visibility Pro',
        description: 'Monthly website and GBP management, citation monitoring, lead tracking support, and reporting.',
        amount: 69700,
        currency: 'usd',
        priceDisplay: '$697 / month',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'visibility_pro',
            fulfillment: 'subscription',
            family: 'monthly'
        }
    },
    'monthly-growth-management': {
        mode: 'subscription',
        name: 'Growth Management',
        description: 'Ongoing growth management covering CRM support, reporting, content coordination, and automation workflows. Scope required for ranges above the $1,000/mo floor.',
        amount: 100000,
        currency: 'usd',
        priceDisplay: 'starting at $1,000 / month',
        billingType: 'SCOPED',
        checkoutEnabled: false,
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'growth_management',
            fulfillment: 'subscription',
            family: 'monthly'
        }
    },
    'ops-simple-lead-tracker': {
        mode: 'subscription',
        name: 'Simple Lead Tracker',
        description: 'Simple lead tracker with source fields, status pipeline, quote tracking, and light monthly upkeep.',
        setupAmount: 25000,
        setupPriceDisplay: '$250 setup',
        amount: 4900,
        currency: 'usd',
        priceDisplay: '$250 setup + $49/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'simple_lead_tracker',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-contractor-crm-starter': {
        mode: 'subscription',
        name: 'Contractor CRM Starter',
        description: 'Starter CRM with pipeline stages, review-request tracking, monthly summary fields, and ongoing upkeep.',
        setupAmount: 50000,
        setupPriceDisplay: '$500 setup',
        amount: 9700,
        currency: 'usd',
        priceDisplay: '$500 setup + $97/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'contractor_crm_starter',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-job-records-system': {
        mode: 'subscription',
        name: 'Job Records System',
        description: 'Job records system with intake, estimate and invoice templates, Drive folder structure, and monthly system care.',
        setupAmount: 75000,
        setupPriceDisplay: '$750 setup',
        amount: 14900,
        currency: 'usd',
        priceDisplay: '$750 setup + $149/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'job_records_system',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-automated-job-records': {
        mode: 'subscription',
        name: 'Automated Job Records',
        description: 'Automated records workflow connecting form submissions, folders, notifications, tracker updates, and monthly monitoring.',
        setupAmount: 150000,
        setupPriceDisplay: '$1,500 setup',
        amount: 19700,
        currency: 'usd',
        priceDisplay: '$1,500 setup + $197/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'automated_job_records',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-growth-system-starter': {
        mode: 'subscription',
        name: 'Growth System Starter',
        description: 'Starter growth system with site upgrades, lead tracking, review workflow, reporting dashboard, and monthly optimization support.',
        setupAmount: 500000,
        setupPriceDisplay: '$5,000 setup',
        amount: 39700,
        currency: 'usd',
        priceDisplay: 'from $5,000 setup + $397/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'growth_system_starter',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-full-growth-system': {
        mode: 'subscription',
        name: 'Full Growth System',
        description: 'Full business growth system including site, search, GBP, CRM, tracking, reporting, and monthly management.',
        setupAmount: 500000,
        setupPriceDisplay: '$5,000 setup',
        amount: 69700,
        currency: 'usd',
        priceDisplay: '$5,000 setup + $697/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'full_growth_system',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-custom-automation-system': {
        mode: 'subscription',
        name: 'Custom / Field Ops System',
        description: 'Branded field mobile job app and/or multi-brand automation — estimates, invoices, scoped photos, Stripe, OutreachEngine, Email-Agent, and Social when scoped.',
        setupAmount: 1000000,
        setupPriceDisplay: '$10,000 setup',
        amount: 100000,
        currency: 'usd',
        priceDisplay: '$10,000 setup + $1,000/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'custom_automation_system',
            fulfillment: 'subscription',
            family: 'ops'
        }
    },
    'ops-growth-systems-only-starter': {
        mode: 'subscription',
        name: 'Growth Systems-Only Starter',
        description: 'Ops layer only on an existing website — lead tracker, review/follow-up, reporting, and monthly support. No new marketing site build.',
        setupAmount: 250000,
        setupPriceDisplay: '$2,500 setup',
        amount: 39700,
        currency: 'usd',
        priceDisplay: 'from $2,500 setup + $397/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'growth_systems_only_starter',
            fulfillment: 'subscription',
            family: 'ops',
            systemsOnly: 'true'
        }
    },
    'ops-growth-systems-only-full': {
        mode: 'subscription',
        name: 'Growth Systems-Only Full',
        description: 'Full back-office growth systems on an existing site — follow-up, ops alerts, one automation lane, monthly management. No marketing site rebuild.',
        setupAmount: 350000,
        setupPriceDisplay: '$3,500 setup',
        amount: 69700,
        currency: 'usd',
        priceDisplay: 'from $3,500 setup + $697/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'growth_systems_only_full',
            fulfillment: 'subscription',
            family: 'ops',
            systemsOnly: 'true'
        }
    },
    'ops-growth-systems-only-field': {
        mode: 'subscription',
        name: 'Field Ops Systems-Only',
        description: 'Field Job App / dispatch systems on your current marketing site — estimates, invoices, photos, Stripe when scoped. No full site rebuild.',
        setupAmount: 800000,
        setupPriceDisplay: '$8,000 setup',
        amount: 100000,
        currency: 'usd',
        priceDisplay: 'from $8,000 setup + $1,000/mo',
        recurring: {
            interval: 'month'
        },
        metadata: {
            packageType: 'growth_systems_only_field',
            fulfillment: 'subscription',
            family: 'ops',
            systemsOnly: 'true'
        }
    }
};

const PACKAGE_PAYMENT_OPTIONS = {
    'website-search-foundation-plus': {
        deposit: {
            amount: 75000,
            priceDisplay: '$750 deposit',
            lineItemName: 'Search Foundation Plus - Kickoff Deposit',
            description: 'Kickoff deposit applied to the Search Foundation Plus project total. Remaining balance is invoiced before final launch.'
        }
    },
    'website-local-seo-starter': {
        deposit: {
            amount: 60000,
            priceDisplay: '$600 deposit',
            lineItemName: 'Local Site - Kickoff Deposit',
            description: 'Kickoff deposit applied to the Local Site project total. Remaining balance is invoiced during milestone approvals before final launch.'
        }
    },
    'website-local-launch-plus': {
        deposit: {
            amount: 100000,
            priceDisplay: '$1,000 deposit',
            lineItemName: 'Authority Site - Kickoff Deposit',
            description: 'Kickoff deposit applied to the Authority Site project total. Remaining balance is invoiced during milestone approvals before final launch.'
        }
    },
    'website-local-launch-max': {
        deposit: {
            amount: 200000,
            priceDisplay: '$2,000 deposit',
            lineItemName: 'Max Authority Site - Kickoff Deposit',
            description: 'Kickoff deposit applied to the Max Authority Site project total. Remaining balance is invoiced across scoped milestones before final delivery.'
        }
    },
    'website-authority-network': {
        deposit: {
            amount: 250000,
            priceDisplay: '$2,500 scope deposit',
            lineItemName: 'Authority Network - Scope Deposit',
            description: 'Scope deposit applied to the Authority Network project total. Remaining balance is invoiced after page architecture and milestones are confirmed.'
        }
    },
    'ecommerce-launch': {
        deposit: {
            amount: 150000,
            priceDisplay: '$1,500 deposit',
            lineItemName: 'E-Commerce Launch - Kickoff Deposit',
            description: 'Kickoff deposit applied to the E-Commerce Launch project total. Remaining balance is invoiced before final launch.'
        }
    },
    'ecommerce-growth-store': {
        deposit: {
            amount: 200000,
            priceDisplay: '$2,000 deposit',
            lineItemName: 'E-Commerce Growth Store - Kickoff Deposit',
            description: 'Kickoff deposit applied to the E-Commerce Growth Store project total. Remaining balance is invoiced across scoped milestones.'
        }
    },
    'ecommerce-advanced-system': {
        deposit: {
            amount: 250000,
            priceDisplay: '$2,500 strategy deposit',
            lineItemName: 'Advanced E-Commerce System - Strategy Deposit',
            description: 'Strategy deposit applied to the Advanced E-Commerce System project total. Remaining balance is invoiced after scope confirmation and milestone approvals.'
        }
    },
    
};

function getBaseUrl(req) {
    const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const forwardedHost = (req.headers['x-forwarded-host'] || '').split(',')[0].trim();
    const host = forwardedHost || req.headers.host;
    const isLocalHost = host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
    const proto = forwardedProto || (isLocalHost ? 'http' : 'https');

    return `${proto}://${host}`;
}

function getAllowedOrigins() {
    const configuredOrigins = (process.env.CHECKOUT_ALLOWED_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
}

function getAllowedOrigin(req) {
    const requestOrigin = req.headers.origin;

    if (!requestOrigin) {
        return null;
    }

    return getAllowedOrigins().has(requestOrigin) || LOCAL_DEV_ORIGIN_PATTERN.test(requestOrigin)
        ? requestOrigin
        : false;
}

function applyCorsHeaders(res, allowedOrigin) {
    if (!allowedOrigin) {
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end(JSON.stringify(payload));
}

function sendEmpty(res, statusCode) {
    res.statusCode = statusCode;
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end();
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }

    return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function getRateLimitState(ip) {
    const now = Date.now();
    const existing = requestBuckets.get(ip);

    if (!existing || now > existing.resetAt) {
        const fresh = {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS
        };
        requestBuckets.set(ip, fresh);
        return { limited: false, remainingMs: RATE_LIMIT_WINDOW_MS };
    }

    existing.count += 1;

    if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
        return { limited: true, remainingMs: Math.max(0, existing.resetAt - now) };
    }

    if (requestBuckets.size > 5000) {
        for (const [bucketIp, bucket] of requestBuckets) {
            if (now > bucket.resetAt) {
                requestBuckets.delete(bucketIp);
            }
        }
    }

    return { limited: false, remainingMs: Math.max(0, existing.resetAt - now) };
}

async function readRawBody(req) {
    if (Buffer.isBuffer(req.rawBody)) {
        return req.rawBody;
    }

    if (typeof req.rawBody === 'string') {
        return Buffer.from(req.rawBody);
    }

    if (req.rawBody instanceof Uint8Array) {
        return Buffer.from(req.rawBody);
    }

    const chunks = [];
    let totalBytes = 0;

    for await (const chunk of req) {
        const normalizedChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += normalizedChunk.length;

        if (totalBytes > MAX_JSON_BODY_BYTES) {
            throw createHttpError(413, 'Checkout payload is too large.');
        }

        chunks.push(normalizedChunk);
    }

    return Buffer.concat(chunks);
}

async function parseJsonBody(req) {
    const rawBody = await readRawBody(req);

    if (!rawBody.length) {
        throw createHttpError(400, 'Checkout details are required.');
    }

    try {
        return JSON.parse(rawBody.toString('utf8'));
    } catch (error) {
        throw createHttpError(400, 'Invalid checkout details.');
    }
}

function getPageCountRank(pageCountExpectation) {
    const pageRanks = {
        small: 1,
        preview: 2,
        medium: 2,
        local: 3,
        large: 4,
        authority: 4,
        enterprise: 5,
        max: 5,
        growth: 6
    };

    return pageRanks[pageCountExpectation] || 0;
}

function getPackageRoute(packageKey, intakeDetails) {
    const packageDefinition = PACKAGE_DEFINITIONS[packageKey];

    if (!packageDefinition) {
        return null;
    }

    if (packageKey === 'website-demo-preview') {
        return { routeType: 'allowed' };
    }

    const pageRank = getPageCountRank(intakeDetails.pageCountExpectation);
    const seoNeed = intakeDetails.seoExpansionNeed || 'no';
    const sellingNeed = intakeDetails.sellingOnlineNeed || 'no';
    const specialFeatures = intakeDetails.specialFeatures || '';
    const hasComplexFeatureRequest = /(member|portal|dashboard|inventory|login|account|calculator|quote tool|custom app|automation)/i.test(specialFeatures);
    const family = packageDefinition.metadata ? packageDefinition.metadata.family : 'website';
    let recommendedPackageKey = packageKey;
    let recommendationMessage = 'These options fit the package you selected.';

    if (family === 'ops' || family === 'monthly' || family === 'seo') {
        return { routeType: 'allowed' };
    }

    if (pageRank >= 4 || hasComplexFeatureRequest) {
        if (sellingNeed === 'cart-store' || family === 'ecommerce') {
            return {
                routeType: packageKey === 'ecommerce-advanced-system' ? 'allowed' : 'package',
                recommendedPackageKey: 'ecommerce-advanced-system',
                recommendationMessage: hasComplexFeatureRequest
                    ? 'Complex storefront features moved this to Advanced E-Commerce System.'
                    : 'A larger storefront build fits the Advanced E-Commerce System package.'
            };
        }

        return {
            routeType: (packageKey === 'website-local-launch-max' || packageKey === 'website-authority-network')
                ? 'allowed'
                : 'package',
            recommendedPackageKey: intakeDetails.pageCountExpectation === 'growth'
                ? 'website-authority-network'
                : 'website-local-launch-max',
            recommendationMessage: hasComplexFeatureRequest
                ? 'Complex website features moved this to Max Authority Site (PROJECT) or Authority Network (SCOPED).'
                : (intakeDetails.pageCountExpectation === 'growth'
                    ? 'A 60–100+ page network fits Authority Network (scoped from $6,500).'
                    : 'An up-to-40-page deep authority PROJECT fits Max Authority Site ($4,500).')
        };
    }

    if (sellingNeed === 'cart-store') {
        recommendedPackageKey = pageRank >= 3 ? 'ecommerce-growth-store' : 'ecommerce-launch';
        recommendationMessage = pageRank >= 3
            ? 'A larger storefront with checkout fits the E-Commerce Growth Store package.'
            : 'A real cart and storefront flow fits the E-Commerce Launch package.';
    } else if (sellingNeed === 'stripe-links') {
        recommendedPackageKey = pageRank >= 3 ? 'ecommerce-growth-store' : 'ecommerce-payment-links';
        recommendationMessage = pageRank >= 3
            ? 'A larger store with payment links fits the E-Commerce Growth Store package.'
            : 'Simple online payments fit the Payment-Link Store package.';
    } else if (family === 'ecommerce') {
        if (pageRank >= 3) {
            recommendedPackageKey = 'ecommerce-growth-store';
            recommendationMessage = 'A larger catalog fits the E-Commerce Growth Store package.';
        } else if (pageRank >= 2) {
            recommendedPackageKey = 'ecommerce-payment-links';
            recommendationMessage = 'A mid-size non-checkout storefront fits the Payment-Link Store package.';
        } else {
            recommendedPackageKey = 'ecommerce-preview-catalog';
            recommendationMessage = 'A small preview catalog fits the Storefront Preview package.';
        }
    } else if (seoNeed === 'cities' || seoNeed === 'both' || seoNeed === 'services') {
        if (pageRank >= 3) {
            recommendedPackageKey = 'website-local-launch-plus';
            recommendationMessage = 'A large site with SEO coverage fits the Authority Site package.';
        } else if (pageRank >= 2) {
            recommendedPackageKey = 'website-local-seo-starter';
            recommendationMessage = 'A standard site with SEO coverage fits the Local Site package.';
        } else {
            recommendedPackageKey = 'website-local-seo-starter';
            recommendationMessage = seoNeed === 'services'
                ? 'A small live site with service-page SEO fits the Local Site package.'
                : 'City or service-area SEO work fits the Local Site package.';
        }
    } else {
        if (pageRank >= 3) {
            recommendedPackageKey = 'website-local-launch-plus';
            recommendationMessage = 'A large build fits the Authority Site package.';
        } else if (pageRank >= 2) {
            recommendedPackageKey = 'website-local-seo-starter';
            recommendationMessage = 'A medium live site fits the Local Site package.';
        } else {
            recommendedPackageKey = packageKey === 'website-preview-launch'
                ? 'website-preview-launch'
                : 'website-local-seo-starter';
            recommendationMessage = recommendedPackageKey === 'website-preview-launch'
                ? 'A small preview site fits the Preview Launch package.'
                : 'A small live site fits the Local Site package.';
        }
    }

    if (recommendedPackageKey !== packageKey) {
        return {
            routeType: 'package',
            recommendedPackageKey,
            recommendationMessage
        };
    }

    return { routeType: 'allowed' };
}

function normalizeSingleLine(value, maxLength) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeMultiLine(value, maxLength) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, maxLength);
}

function normalizeReturnPath(value) {
    const raw = normalizeSingleLine(value, 120);

    if (!raw || !raw.startsWith('/')) {
        return '/pricing';
    }

    if (raw.startsWith('//') || raw.includes('://')) {
        return '/pricing';
    }

    return raw;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasLegacyScopeSelectors(intakeDetails) {
    return Boolean(
        intakeDetails.pageCountExpectation &&
        intakeDetails.seoExpansionNeed &&
        intakeDetails.sellingOnlineNeed
    );
}

function buildIntakeDetails(body, packageDefinition) {
    const intakeDetails = {
        businessName: normalizeSingleLine(body && body.businessName, 120),
        contactName: normalizeSingleLine(body && body.contactName, 120),
        email: normalizeSingleLine(body && body.email, 160),
        phone: normalizeSingleLine(body && body.phone, 40),
        preferredContact: normalizeSingleLine(body && body.preferredContact, 20).toLowerCase() || 'email',
        websiteOrProfile: normalizeSingleLine(body && body.websiteOrProfile, 255),
        managedPropertyUrl: normalizeSingleLine(body && body.managedPropertyUrl, 255),
        pageCountExpectation: normalizeSingleLine(body && body.pageCountExpectation, 20),
        seoExpansionNeed: normalizeSingleLine(body && body.seoExpansionNeed, 20).toLowerCase(),
        sellingOnlineNeed: normalizeSingleLine(body && body.sellingOnlineNeed, 20).toLowerCase(),
        projectDetails: normalizeMultiLine((body && (body.projectDetails || body.projectGoal)) || '', 1500),
        specialFeatures: normalizeMultiLine((body && (body.specialFeatures || body.additionalNotes)) || '', 1000),
        primaryZip: normalizeSingleLine(body && body.primaryZip, 20),
        serviceRadiusMiles: normalizeSingleLine(body && body.serviceRadiusMiles, 20),
        primaryService: normalizeSingleLine(body && body.primaryService, 120),
        approxProductCount: normalizeSingleLine(body && body.approxProductCount, 40),
        currentSystem: normalizeSingleLine(body && body.currentSystem, 160),
        facebookUrl: normalizeSingleLine(body && body.facebookUrl, 255),
        instagramUrl: normalizeSingleLine(body && body.instagramUrl, 255),
        linkedinUrl: normalizeSingleLine(body && body.linkedinUrl, 255),
        googleBusinessProfile: normalizeSingleLine(body && body.googleBusinessProfile, 255),
        assetLink: normalizeSingleLine(body && body.assetLink, 255),
        paymentOption: normalizeSingleLine(body && body.paymentOption, 30).toLowerCase() || 'full',
        intakeUploadCompleted: body && (body.intakeUploadCompleted === true || body.intakeUploadCompleted === 'true'),
        returnPath: normalizeReturnPath(body && body.returnPath),
        referralPartner: normalizeSingleLine(body && (body.kl_ref || body.referralPartner), 80),
        referralOffer: normalizeSingleLine(body && (body.kl_offer || body.referralOffer), 80),
        utmMedium: normalizeSingleLine(body && (body.kl_utm_medium || body.utmMedium), 80),
        utmCampaign: normalizeSingleLine(body && (body.kl_utm_campaign || body.utmCampaign), 80),
        utmFirstUrl: normalizeSingleLine(body && (body.kl_first_url || body.utmFirstUrl), 300),
        sessionId: normalizeSingleLine(body && (body.kl_session_id || body.sessionId), 64)
    };

    if (!intakeDetails.businessName || !intakeDetails.contactName || !intakeDetails.email || !intakeDetails.projectDetails) {
        return {
            error: 'Complete the required starter fields before checkout.'
        };
    }

    if (!isValidEmail(intakeDetails.email)) {
        return {
            error: 'Enter a valid email address before checkout.'
        };
    }

    if (packageDefinition && packageDefinition.metadata && packageDefinition.metadata.family === 'monthly' && !intakeDetails.managedPropertyUrl && !intakeDetails.websiteOrProfile) {
        return {
            error: 'Add the website or profile URL we will be maintaining before checkout.'
        };
    }

    if (hasLegacyScopeSelectors(intakeDetails)) {
        if (!VALID_PAGE_COUNT_EXPECTATIONS.has(intakeDetails.pageCountExpectation)) {
            return {
                error: 'Choose the expected page count before checkout.'
            };
        }

        if (!VALID_SEO_EXPANSION_NEEDS.has(intakeDetails.seoExpansionNeed)) {
            return {
                error: 'Choose the search or local SEO depth before checkout.'
            };
        }

        if (!VALID_SELLING_ONLINE_NEEDS.has(intakeDetails.sellingOnlineNeed)) {
            return {
                error: 'Choose the selling flow before checkout.'
            };
        }
    }

    return { intakeDetails };
}

function getPaymentSelection(packageKey, requestedOption, packageDefinition) {
    const packageOptions = PACKAGE_PAYMENT_OPTIONS[packageKey];
    const forceDeposit = Boolean(packageDefinition.requireDeposit) || packageDefinition.billingType === 'SCOPED';

    if (forceDeposit && packageDefinition.mode === 'payment') {
        if (!packageOptions || !packageOptions.deposit) {
            const error = createHttpError(400, 'This package requires scoped deposit checkout. Contact Knight Logics to proceed.');
            throw error;
        }

        return {
            key: 'deposit',
            amount: packageOptions.deposit.amount,
            priceDisplay: packageOptions.deposit.priceDisplay,
            lineItemName: packageOptions.deposit.lineItemName,
            description: packageOptions.deposit.description
        };
    }

    if (
        packageOptions
        && packageDefinition.mode === 'payment'
        && requestedOption === 'deposit'
    ) {
        return {
            key: 'deposit',
            amount: packageOptions.deposit.amount,
            priceDisplay: packageOptions.deposit.priceDisplay,
            lineItemName: packageOptions.deposit.lineItemName,
            description: packageOptions.deposit.description
        };
    }

    return {
        key: 'full',
        amount: packageDefinition.amount,
        priceDisplay: packageDefinition.priceDisplay,
        lineItemName: packageDefinition.name,
        description: packageDefinition.description
    };
}

function buildInlineLineItem(packageDefinition, paymentSelection) {
    const priceData = {
        currency: packageDefinition.currency,
        product_data: {
            name: paymentSelection.lineItemName,
            description: paymentSelection.description
        },
        unit_amount: paymentSelection.amount
    };

    if (packageDefinition.mode === 'subscription') {
        priceData.recurring = packageDefinition.recurring;
    }

    return {
        price_data: priceData,
        quantity: 1
    };
}

function buildInlineSetupLineItem(packageDefinition) {
    return {
        price_data: {
            currency: packageDefinition.currency,
            product_data: {
                name: `${packageDefinition.name} - Setup`,
                description: packageDefinition.setupDescription || `One-time setup for ${packageDefinition.name}.`
            },
            unit_amount: packageDefinition.setupAmount
        },
        quantity: 1
    };
}

function normalizeRecurringInterval(recurring) {
    if (!recurring || !recurring.interval) {
        return '';
    }

    return String(recurring.interval).toLowerCase();
}

function normalizeRecurringIntervalCount(recurring) {
    if (!recurring || !Number.isFinite(recurring.interval_count)) {
        return 1;
    }

    return recurring.interval_count;
}

function doesPriceMatchSelection(price, packageDefinition, paymentSelection) {
    if (!price || price.currency !== packageDefinition.currency || price.unit_amount !== paymentSelection.amount) {
        return false;
    }

    const paymentOption = (price.metadata && price.metadata[KL_PAYMENT_OPTION_META]) || 'full';

    if (paymentOption !== paymentSelection.key) {
        return false;
    }

    if (packageDefinition.mode === 'subscription') {
        if (!price.recurring) {
            return false;
        }

        return (
            normalizeRecurringInterval(price.recurring) === normalizeRecurringInterval(packageDefinition.recurring) &&
            normalizeRecurringIntervalCount(price.recurring) === normalizeRecurringIntervalCount(packageDefinition.recurring)
        );
    }

    return !price.recurring;
}

async function getOrCreateCatalogProduct(stripe, packageKey, packageDefinition) {
    const productsResponse = await stripe.products.list({ active: true, limit: 100 });
    const existing = (productsResponse.data || []).find((product) =>
        product &&
        product.metadata &&
        product.metadata[KL_PRODUCT_KEY_META] === packageKey
    );

    if (existing) {
        return existing;
    }

    return stripe.products.create({
        name: `KL - ${packageDefinition.name}`,
        description: packageDefinition.description,
        metadata: {
            [KL_PRODUCT_KEY_META]: packageKey,
            kl_package_name: packageDefinition.name,
            kl_mode: packageDefinition.mode,
            kl_family: (packageDefinition.metadata && packageDefinition.metadata.family) || ''
        }
    });
}

async function getOrCreateCatalogPrice(stripe, product, packageKey, packageDefinition, paymentSelection) {
    const pricesResponse = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100
    });

    const existing = (pricesResponse.data || []).find((price) =>
        doesPriceMatchSelection(price, packageDefinition, paymentSelection)
    );

    if (existing) {
        return existing;
    }

    const createPayload = {
        product: product.id,
        currency: packageDefinition.currency,
        unit_amount: paymentSelection.amount,
        metadata: {
            [KL_PRODUCT_KEY_META]: packageKey,
            [KL_PAYMENT_OPTION_META]: paymentSelection.key,
            kl_package_name: packageDefinition.name
        },
        nickname: paymentSelection.key === 'deposit'
            ? `${packageDefinition.name} Deposit`
            : `${packageDefinition.name} Full`
    };

    if (packageDefinition.mode === 'subscription') {
        createPayload.recurring = packageDefinition.recurring;
    }

    return stripe.prices.create(createPayload);
}

async function buildCatalogLineItem(stripe, packageKey, packageDefinition, paymentSelection) {
    const product = await getOrCreateCatalogProduct(stripe, packageKey, packageDefinition);
    const price = await getOrCreateCatalogPrice(stripe, product, packageKey, packageDefinition, paymentSelection);

    return {
        price: price.id,
        quantity: 1
    };
}

async function buildCheckoutLineItems(stripe, packageKey, packageDefinition, paymentSelection) {
    let recurringOrPaymentLineItem;

    try {
        recurringOrPaymentLineItem = await buildCatalogLineItem(stripe, packageKey, packageDefinition, paymentSelection);
    } catch (catalogError) {
        // Fallback keeps checkout operational if Stripe catalog lookup fails.
        console.error('Stripe catalog lookup failed; falling back to inline checkout price data:', catalogError);
        recurringOrPaymentLineItem = buildInlineLineItem(packageDefinition, paymentSelection);
    }

    if (packageDefinition.mode === 'subscription' && packageDefinition.setupAmount) {
        return [
            buildInlineSetupLineItem(packageDefinition),
            recurringOrPaymentLineItem
        ];
    }

    return [recurringOrPaymentLineItem];
}

function buildCheckoutMetadata(packageKey, packageDefinition, intakeDetails, paymentSelection) {
    const metadata = {
        packageKey,
        packageName: packageDefinition.name,
        selectedPaymentOption: paymentSelection.key,
        selectedPaymentDisplay: paymentSelection.priceDisplay,
        ...packageDefinition.metadata
    };

    metadata.businessName = intakeDetails.businessName;
    metadata.contactName = intakeDetails.contactName;
    metadata.intakeEmail = intakeDetails.email;
    metadata.preferredContact = intakeDetails.preferredContact || 'email';
    metadata.returnPath = intakeDetails.returnPath || '/pricing';
    metadata.intakeSummary = intakeDetails.projectDetails.slice(0, 400);

    if (packageDefinition.setupAmount) {
        metadata.setupPriceDisplay = packageDefinition.setupPriceDisplay || '';
        metadata.monthlyPriceDisplay = paymentSelection.priceDisplay || '';
    }

    if (intakeDetails.phone) {
        metadata.contactPhone = intakeDetails.phone;
    }

    if (intakeDetails.primaryZip) {
        metadata.primaryZip = intakeDetails.primaryZip;
    }

    if (intakeDetails.serviceRadiusMiles) {
        metadata.serviceRadius = intakeDetails.serviceRadiusMiles;
    }

    if (intakeDetails.primaryService) {
        metadata.primaryService = intakeDetails.primaryService.slice(0, 120);
    }

    if (intakeDetails.managedPropertyUrl) {
        metadata.managedPropertyUrl = intakeDetails.managedPropertyUrl.slice(0, 200);
    } else if (intakeDetails.websiteOrProfile) {
        metadata.websiteOrProfile = intakeDetails.websiteOrProfile.slice(0, 200);
    }

    if (intakeDetails.googleBusinessProfile) {
        metadata.googleBusinessProfile = intakeDetails.googleBusinessProfile.slice(0, 200);
    }

    if (intakeDetails.assetLink) {
        metadata.assetLink = intakeDetails.assetLink.slice(0, 200);
    }

    if (intakeDetails.approxProductCount) {
        metadata.approxProductCount = intakeDetails.approxProductCount.slice(0, 60);
    }

    if (intakeDetails.currentSystem) {
        metadata.currentSystem = intakeDetails.currentSystem.slice(0, 120);
    }

    if (intakeDetails.specialFeatures) {
        metadata.specialFeatures = intakeDetails.specialFeatures.slice(0, 200);
    }

    if (intakeDetails.referralPartner) {
        metadata.referralPartner = intakeDetails.referralPartner;
    }

    if (intakeDetails.referralOffer) {
        metadata.referralOffer = intakeDetails.referralOffer;
    }

    if (intakeDetails.utmMedium) {
        metadata.utmMedium = intakeDetails.utmMedium;
    }

    if (intakeDetails.utmCampaign) {
        metadata.utmCampaign = intakeDetails.utmCampaign;
    }

    if (intakeDetails.sessionId) {
        metadata.referralSessionId = intakeDetails.sessionId;
    }

    return metadata;
}

function buildFormspreePayload(packageDefinition, intakeDetails, paymentSelection) {
    return {
        businessName: intakeDetails.businessName,
        contactName: intakeDetails.contactName,
        email: intakeDetails.email,
        serviceType: `Starter Package Checkout - ${packageDefinition.name}`,
        timeline: 'Submitted immediately before Stripe checkout',
        budget: paymentSelection.priceDisplay,
        projectDetails: intakeDetails.projectDetails,
        preferredContact: intakeDetails.preferredContact || 'email',
        phone: intakeDetails.phone || 'Not provided',
        websiteOrProfile: intakeDetails.websiteOrProfile || intakeDetails.managedPropertyUrl || 'Not provided',
        primaryZip: intakeDetails.primaryZip || 'Not provided',
        serviceRadiusMiles: intakeDetails.serviceRadiusMiles || 'Not provided',
        primaryService: intakeDetails.primaryService || 'Not provided',
        approxProductCount: intakeDetails.approxProductCount || 'Not provided',
        currentSystem: intakeDetails.currentSystem || 'Not provided',
        googleBusinessProfile: intakeDetails.googleBusinessProfile || 'Not provided',
        assetLink: intakeDetails.assetLink || 'Not provided',
        pageCountExpectation: intakeDetails.pageCountExpectation || 'Not provided',
        seoExpansionNeed: intakeDetails.seoExpansionNeed || 'Not provided',
        sellingOnlineNeed: intakeDetails.sellingOnlineNeed || 'Not provided',
        specialFeatures: intakeDetails.specialFeatures || 'Not provided',
        paymentOption: paymentSelection.key,
        packageName: packageDefinition.name,
        packagePrice: packageDefinition.priceDisplay,
        packageBillingMode: packageDefinition.mode,
        additionalDetails: 'Buyer can also send more files, links, and final notes through the pricing-page post-payment handoff.',
        referralPartner: intakeDetails.referralPartner || '',
        referralOffer: intakeDetails.referralOffer || '',
        utmMedium: intakeDetails.utmMedium || '',
        utmCampaign: intakeDetails.utmCampaign || '',
        utmFirstUrl: intakeDetails.utmFirstUrl || '',
        _replyto: intakeDetails.email,
        _subject: `Starter Package Intake: ${packageDefinition.name}`
    };
}

async function submitIntakeToFormspree(packageDefinition, intakeDetails, paymentSelection, allowedOrigin) {
    const shouldSkipForwarding = !FORMSPREE_ENDPOINT || (allowedOrigin && LOCAL_DEV_ORIGIN_PATTERN.test(allowedOrigin));

    if (shouldSkipForwarding) {
        return;
    }

    const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(buildFormspreePayload(packageDefinition, intakeDetails, paymentSelection))
    });

    if (!response.ok) {
        const error = new Error('Unable to send intake details right now.');
        error.code = 'INTAKE_SUBMISSION_FAILED';
        throw error;
    }
}

async function sendReferralEvent(apiBase, payload) {
    if (!apiBase || !payload) {
        return;
    }

    try {
        await fetch(apiBase + '/api/referral-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function () {});
    } catch (_) {}
}

async function handler(req, res) {
    let serviceRoute = req.query && typeof req.query.serviceRoute === 'string'
        ? req.query.serviceRoute
        : '';
    if (!serviceRoute && typeof req.url === 'string') {
        try { serviceRoute = new URL(req.url, 'http://localhost').searchParams.get('serviceRoute') || ''; } catch (_) {}
    }
    if (serviceRoute === 'checkout') return serviceCheckoutHandler(req, res);
    if (serviceRoute === 'orders') return serviceOrdersHandler(req, res);
    if (serviceRoute === 'delivery') return serviceDeliveryHandler(req, res);
    if (serviceRoute === 'status') return serviceStatusHandler(req, res);

    const allowedOrigin = getAllowedOrigin(req);

    if (allowedOrigin === false) {
        return sendJson(res, 403, { error: 'Origin not allowed.' });
    }

    applyCorsHeaders(res, allowedOrigin);

    if (req.method === 'OPTIONS') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendEmpty(res, 204);
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    const rateState = getRateLimitState(getClientIp(req));

    if (rateState.limited) {
        const retryAfterSeconds = Math.max(1, Math.ceil(rateState.remainingMs / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return sendJson(res, 429, { error: 'Too many checkout attempts. Please wait and try again.' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

    if (!stripeSecretKey) {
        return sendJson(res, 500, { error: 'Stripe is not configured on this deployment.' });
    }

    const contentType = req.headers['content-type'] || '';

    if (!/application\/json/i.test(contentType)) {
        return sendJson(res, 400, { error: 'Send checkout details as JSON.' });
    }

    let requestBody;

    try {
        requestBody = await parseJsonBody(req);
    } catch (error) {
        return sendJson(res, error.statusCode || 400, {
            error: error.message || 'Invalid checkout details.',
            intakeAccepted: false
        });
    }

    const packageKey = requestBody && requestBody.packageKey;
    const packageDefinition = PACKAGE_DEFINITIONS[packageKey];

    if (!packageDefinition) {
        return sendJson(res, 400, { error: 'Invalid package selected.' });
    }

    if (packageDefinition.checkoutEnabled === false || packageDefinition.deprecated === true) {
        return sendJson(res, 400, {
            error: 'This package is not available for self-serve checkout. Contact Knight Logics to scope the right fit.',
            intakeAccepted: false
        });
    }

    const intakeResult = buildIntakeDetails(requestBody || {}, packageDefinition);

    if (intakeResult.error) {
        return sendJson(res, 400, { error: intakeResult.error, intakeAccepted: false });
    }

    const { intakeDetails } = intakeResult;

    if (hasLegacyScopeSelectors(intakeDetails)) {
        const packageRoute = getPackageRoute(packageKey, intakeDetails);

        if (packageRoute && packageRoute.routeType !== 'allowed') {
            return sendJson(res, 409, {
                error: 'This package is not the best fit for the submitted scope.',
                intakeAccepted: false,
                routeType: packageRoute.routeType,
                recommendedPackageKey: packageRoute.recommendedPackageKey || '',
                recommendationMessage: packageRoute.recommendationMessage || ''
            });
        }
    }

    let paymentSelection;

    try {
        paymentSelection = getPaymentSelection(packageKey, intakeDetails.paymentOption, packageDefinition);
    } catch (error) {
        return sendJson(res, error.statusCode || 400, {
            error: error.message || 'Unable to build checkout payment selection.',
            intakeAccepted: false
        });
    }

    try {
        if (!intakeDetails.intakeUploadCompleted) {
            await submitIntakeToFormspree(packageDefinition, intakeDetails, paymentSelection, allowedOrigin);
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-03-31.basil'
        });

        const baseUrl = allowedOrigin || getBaseUrl(req);
        const apiBase = baseUrl.replace(/\/$/, '');
        const checkoutMetadata = buildCheckoutMetadata(packageKey, packageDefinition, intakeDetails, paymentSelection);
        const successReturnUrl = new URL(intakeDetails.returnPath || '/pricing', `${baseUrl}/`);
        successReturnUrl.searchParams.set('purchase', 'success');
        successReturnUrl.searchParams.set('package', packageKey);

        const cancelReturnUrl = new URL(intakeDetails.returnPath || '/pricing', `${baseUrl}/`);
        cancelReturnUrl.searchParams.set('purchase', 'cancelled');
        cancelReturnUrl.searchParams.set('package', packageKey);

        if (intakeDetails.referralPartner || intakeDetails.referralOffer) {
            await sendReferralEvent(apiBase, {
                eventType: 'form_submit',
                referralPartner: intakeDetails.referralPartner || '',
                referralOffer: intakeDetails.referralOffer || '',
                utmMedium: intakeDetails.utmMedium || '',
                utmCampaign: intakeDetails.utmCampaign || '',
                firstUrl: intakeDetails.utmFirstUrl || '',
                pagePath: intakeDetails.returnPath || '/pricing',
                contactEmail: intakeDetails.email || '',
                contactName: intakeDetails.contactName || '',
                packageName: packageKey || '',
                sessionId: intakeDetails.sessionId || '',
                eventSource: 'starter_package'
            });
        }

        const lineItems = await buildCheckoutLineItems(stripe, packageKey, packageDefinition, paymentSelection);

        const sessionParams = {
            mode: packageDefinition.mode,
            line_items: lineItems,
            billing_address_collection: 'auto',
            customer_email: intakeDetails.email,
            success_url: `${successReturnUrl.toString()}#starter-packages`,
            cancel_url: `${cancelReturnUrl.toString()}#starter-packages`,
            metadata: checkoutMetadata
        };

        if (packageDefinition.mode === 'payment') {
            sessionParams.customer_creation = 'always';
            sessionParams.payment_intent_data = {
                metadata: checkoutMetadata
            };
        } else {
            sessionParams.subscription_data = {
                metadata: checkoutMetadata
            };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        /* Fire-and-forget referral checkout_start event — never blocks checkout */
        if (intakeDetails.referralPartner || intakeDetails.referralOffer) {
            await sendReferralEvent(apiBase, {
                eventType: 'checkout_start',
                referralPartner: intakeDetails.referralPartner || '',
                referralOffer: intakeDetails.referralOffer || '',
                utmMedium: intakeDetails.utmMedium || '',
                utmCampaign: intakeDetails.utmCampaign || '',
                firstUrl: intakeDetails.utmFirstUrl || '',
                pagePath: '/checkout',
                contactEmail: intakeDetails.email || '',
                contactName: intakeDetails.contactName || '',
                packageName: packageKey || '',
                amountCents: paymentSelection && paymentSelection.amount != null ? paymentSelection.amount : 0,
                sessionId: intakeDetails.sessionId || '',
                eventSource: 'starter_package',
                externalEventId: 'checkout_start:' + session.id
            });
        }

        return sendJson(res, 200, {
            url: session.url,
            paymentOption: paymentSelection.key,
            paymentDisplay: paymentSelection.priceDisplay
        });
    } catch (error) {
        if (error.code === 'INTAKE_SUBMISSION_FAILED') {
            console.error('Formspree intake submission failed:', error);
            return sendJson(res, 502, {
                error: 'We could not send your package intake right now. Please try again or use the contact form.',
                intakeAccepted: false
            });
        }

        console.error('Stripe Checkout session creation failed:', error);
        return sendJson(res, 502, {
            error: 'Your intake details were received, but Stripe checkout could not be started right now.',
            intakeAccepted: true
        });
    }
}

module.exports = handler;
module.exports.PACKAGE_DEFINITIONS = PACKAGE_DEFINITIONS;
module.exports.PACKAGE_PAYMENT_OPTIONS = PACKAGE_PAYMENT_OPTIONS;
