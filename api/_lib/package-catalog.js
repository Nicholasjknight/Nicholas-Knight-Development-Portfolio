'use strict';

const crypto = require('node:crypto');
const catalog = require('../../data/package-catalog.json');

function toCents(value) {
    return Math.round(Number(value || 0) * 100);
}

function familyForLane(lane, packageId) {
    if (String(packageId || '').startsWith('gbp-')) {
        return 'seo';
    }

    const families = {
        WEBSITE: 'website',
        COMMERCE: 'ecommerce',
        VISIBILITY: 'monthly',
        OPERATIONS: 'ops',
        GROWTH_WEBSITE_SYSTEMS: 'ops',
        GROWTH_SYSTEMS_ONLY: 'ops',
        CARE: 'monthly',
        ADD_ON: 'addon'
    };

    return families[lane] || 'service';
}

function descriptionForPackage(pkg) {
    return pkg.outcome
        || pkg.bestFor
        || (Array.isArray(pkg.inclusions) ? pkg.inclusions.slice(0, 3).join('; ') : '')
        || `${pkg.name} from Knight Logics.`;
}

function buildPackageDefinitions(profileDefaults) {
    const defaults = profileDefaults || {};
    const definitions = {};

    for (const pkg of catalog.packages) {
        const fallback = defaults[pkg.id] || {};
        const isRecurring = ['MONTHLY', 'SETUP_MONTHLY'].includes(pkg.billingType);
        const amount = isRecurring ? toCents(pkg.monthlyPrice) : toCents(pkg.projectPrice);
        const definition = {
            ...fallback,
            mode: isRecurring ? 'subscription' : 'payment',
            name: pkg.name,
            description: descriptionForPackage(pkg),
            amount,
            currency: String(catalog.currency || 'USD').toLowerCase(),
            priceDisplay: pkg.priceDisplay,
            billingType: pkg.billingType,
            pricingMode: pkg.pricingMode,
            checkoutMode: pkg.checkoutMode,
            checkoutEnabled: pkg.checkoutEnabled === true,
            deprecated: pkg.deprecated === true,
            requireDeposit: pkg.checkoutMode === 'DEPOSIT_ONLY',
            depositOnly: pkg.checkoutMode === 'DEPOSIT_ONLY',
            pageLimit: pkg.pageLimit || undefined,
            setupAmount: pkg.setupPrice ? toCents(pkg.setupPrice) : undefined,
            setupPriceDisplay: pkg.setupPrice ? `$${Number(pkg.setupPrice).toLocaleString('en-US')} setup` : undefined,
            recurring: isRecurring ? { interval: 'month' } : undefined,
            metadata: {
                ...(fallback.metadata || {}),
                packageType: pkg.id.replace(/-/g, '_'),
                fulfillment: isRecurring ? 'managed_service' : 'project',
                family: familyForLane(pkg.lane, pkg.id),
                catalogVersion: catalog.catalogVersion,
                pricingMode: pkg.pricingMode,
                checkoutMode: pkg.checkoutMode
            }
        };

        definitions[pkg.id] = definition;
    }

    return definitions;
}

function buildPaymentOptions() {
    const options = {};

    for (const pkg of catalog.packages) {
        if (!pkg.depositPrice || !['FULL_OR_DEPOSIT', 'DEPOSIT_ONLY'].includes(pkg.checkoutMode)) {
            continue;
        }

        const scopeDeposit = pkg.checkoutMode === 'DEPOSIT_ONLY';
        options[pkg.id] = {
            deposit: {
                amount: toCents(pkg.depositPrice),
                priceDisplay: `$${Number(pkg.depositPrice).toLocaleString('en-US')} ${scopeDeposit ? 'scope ' : ''}deposit`,
                lineItemName: `${pkg.name} - ${scopeDeposit ? 'Scope' : 'Kickoff'} Deposit`,
                description: scopeDeposit
                    ? `Scope deposit applied to the approved ${pkg.name} project. The final total and milestones are confirmed before additional payment.`
                    : `Project deposit applied to the fixed ${pkg.name} total. The remaining balance is invoiced according to the disclosed milestones.`
            }
        };
    }

    return options;
}

function getCatalogHash() {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(catalog))
        .digest('hex')
        .slice(0, 16);
}

module.exports = {
    catalog,
    buildPackageDefinitions,
    buildPaymentOptions,
    getCatalogHash,
    toCents
};

