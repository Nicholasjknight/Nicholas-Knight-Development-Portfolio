(function packageRoutingFactory(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.KLPackageRouting = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildPackageRouting() {
    'use strict';

    const PAGE_BANDS = Object.freeze({
        demo: 0,
        small: 1,
        preview: 1,
        medium: 2,
        local: 2,
        large: 3,
        authority: 3,
        enterprise: 4,
        max: 4,
        network: 5,
        growth: 5
    });

    const WEBSITE_BY_BAND = Object.freeze({
        0: 'website-demo-preview',
        1: 'website-preview-launch',
        2: 'website-local-seo-starter',
        3: 'website-local-launch-plus',
        4: 'website-local-launch-max',
        5: 'website-authority-network'
    });

    const COMMERCE_BY_LEVEL = Object.freeze({
        preview: 'ecommerce-preview-catalog',
        links: 'ecommerce-payment-links',
        launch: 'ecommerce-launch',
        growth: 'ecommerce-growth-store',
        advanced: 'ecommerce-advanced-system'
    });

    const SYSTEMS_ONLY_BY_LEVEL = Object.freeze({
        starter: 'ops-growth-systems-only-starter',
        full: 'ops-growth-systems-only-full',
        field: 'ops-growth-systems-only-field'
    });

    const WEBSITE_SYSTEMS_BY_LEVEL = Object.freeze({
        starter: 'ops-growth-system-starter',
        full: 'ops-full-growth-system',
        field: 'ops-custom-automation-system'
    });

    function makePackageMap(catalogInput) {
        const packages = Array.isArray(catalogInput)
            ? catalogInput
            : (catalogInput && Array.isArray(catalogInput.packages) ? catalogInput.packages : []);

        return new Map(packages.map((pkg) => [pkg.id, pkg]));
    }

    function normalizeText(value, maximumLength) {
        return String(value || '').trim().slice(0, maximumLength || 500);
    }

    function normalizeIntake(input) {
        const source = input && typeof input === 'object' ? input : {};
        const rawPageBand = normalizeText(
            source.pageBand || source.pageCountExpectation || source.pageCount || '',
            32
        ).toLowerCase();
        const pageBand = Object.prototype.hasOwnProperty.call(PAGE_BANDS, rawPageBand)
            ? rawPageBand
            : '';
        const requestedLane = normalizeText(
            source.lane || source.outcome || source.goalLane || '',
            48
        ).toLowerCase();
        const systemsChoice = normalizeText(
            source.systemsChoice || source.growthScope || source.growthLane || '',
            48
        ).toLowerCase();
        const sellingOnline = normalizeText(
            source.commerceRequirement || source.sellingOnlineNeed || source.sellingOnline || '',
            48
        ).toLowerCase();
        const specialFeatures = normalizeText(source.specialFeatures || source.requirements || '', 1200);
        const servicesOrAreas = normalizeText(
            source.servicesOrAreas || source.seoExpansionNeed || '',
            120
        ).toLowerCase();
        const gbpState = normalizeText(source.gbpState || source.gbpNeed || '', 48).toLowerCase();
        const complexity = normalizeText(source.complexity || source.systemComplexity || '', 48).toLowerCase();

        return {
            pageBand,
            requestedLane,
            systemsChoice,
            sellingOnline,
            specialFeatures,
            servicesOrAreas,
            gbpState,
            complexity,
            currentSiteSuitable: source.currentSiteSuitable === true
                || String(source.currentSiteSuitable || '').toLowerCase() === 'yes'
        };
    }

    function isComplexFeatureRequest(value) {
        return /(member|portal|dashboard|inventory|login|account|calculator|quote tool|custom app|dispatch|ticket|erp|subscription|marketplace|automation)/i.test(value || '');
    }

    function isSystemsOnlyPackage(packageId) {
        return Object.values(SYSTEMS_ONLY_BY_LEVEL).includes(packageId);
    }

    function isWebsiteSystemsPackage(packageId) {
        return Object.values(WEBSITE_SYSTEMS_BY_LEVEL).includes(packageId);
    }

    function getSystemsLevel(packageId, intake) {
        if (
            packageId.includes('field')
            || packageId.includes('custom')
            || intake.complexity === 'field'
            || intake.complexity === 'custom'
            || /(dispatch|ticket|field|crew|route)/i.test(intake.specialFeatures)
        ) {
            return 'field';
        }

        if (
            packageId.includes('full')
            || intake.complexity === 'full'
            || intake.complexity === 'integrated'
            || /(multi-step|nurture|reporting|social|multiple workflow)/i.test(intake.specialFeatures)
        ) {
            return 'full';
        }

        return 'starter';
    }

    function commerceRecommendation(requestedPackage, intake) {
        const complex = isComplexFeatureRequest(intake.specialFeatures);

        if (complex || ['advanced', 'subscription', 'marketplace', 'integration'].includes(intake.sellingOnline)) {
            return {
                id: COMMERCE_BY_LEVEL.advanced,
                reason: 'Advanced commerce requirements need a scoped integration plan.'
            };
        }

        if (['cart-store', 'cart', 'store'].includes(intake.sellingOnline)) {
            if (['authority', 'max', 'network', 'growth', 'large', 'enterprise'].includes(intake.pageBand)) {
                return {
                    id: COMMERCE_BY_LEVEL.growth,
                    reason: 'The larger catalog and merchandising scope fit Growth Store.'
                };
            }

            return {
                id: COMMERCE_BY_LEVEL.launch,
                reason: 'A production cart and checkout fit E-Commerce Launch.'
            };
        }

        if (['stripe-links', 'payment-links', 'links'].includes(intake.sellingOnline)) {
            return {
                id: COMMERCE_BY_LEVEL.links,
                reason: 'Hosted payment links fit Payment-Link Store.'
            };
        }

        if (intake.pageBand || intake.sellingOnline) {
            return {
                id: COMMERCE_BY_LEVEL.preview,
                reason: 'A noindex catalog preview is the lowest-risk fit for this scope.'
            };
        }

        return { id: requestedPackage.id, reason: 'The selected commerce package matches the submitted scope.' };
    }

    function websiteRecommendation(requestedPackage, intake) {
        if (!intake.pageBand && !intake.servicesOrAreas && !isComplexFeatureRequest(intake.specialFeatures)) {
            return { id: requestedPackage.id, reason: 'The selected website package matches the submitted scope.' };
        }

        let rank = PAGE_BANDS[intake.pageBand] || 0;

        if (isComplexFeatureRequest(intake.specialFeatures)) {
            rank = Math.max(rank, 4);
        }

        if (['cities', 'both', 'multi-area'].includes(intake.servicesOrAreas)) {
            rank = Math.max(rank, 3);
        }

        const id = WEBSITE_BY_BAND[Math.min(5, rank)] || 'website-local-seo-starter';
        const reasons = {
            'website-demo-preview': 'A 1–5 page concept fits Demo Preview.',
            'website-preview-launch': 'An up-to-10-page noindex concept fits Preview Launch.',
            'website-local-seo-starter': 'An up-to-15-page live build fits Local Site.',
            'website-local-launch-plus': 'An up-to-30-page multi-service or multi-area build fits Authority Site.',
            'website-local-launch-max': 'An up-to-40-page research and conversion-intensive build fits Max Authority.',
            'website-authority-network': 'A large phased page network requires Authority Network scoping.'
        };

        return { id, reason: reasons[id] };
    }

    function resolvePackage(requestedKey, intakeInput, catalogInput) {
        const packageMap = makePackageMap(catalogInput);
        const requestedPackage = packageMap.get(requestedKey);

        if (!requestedPackage || requestedPackage.deprecated === true || requestedPackage.recommendable === false) {
            return {
                ok: false,
                code: 'INVALID_PACKAGE',
                requestedKey: normalizeText(requestedKey, 120),
                message: 'The selected package is unavailable.'
            };
        }

        const intake = normalizeIntake(intakeInput);
        let recommendation = {
            id: requestedPackage.id,
            reason: 'The selected package matches the submitted scope.'
        };

        if (isSystemsOnlyPackage(requestedPackage.id) || isWebsiteSystemsPackage(requestedPackage.id)) {
            const level = getSystemsLevel(requestedPackage.id, intake);
            const explicitlyWebsiteSystems = ['website-systems', 'website+systems', 'with-website'].includes(intake.systemsChoice);
            const explicitlySystemsOnly = ['systems-only', 'systems', 'existing-site'].includes(intake.systemsChoice);
            const keepSystemsOnly = explicitlySystemsOnly
                || (!explicitlyWebsiteSystems && isSystemsOnlyPackage(requestedPackage.id));
            const family = keepSystemsOnly ? SYSTEMS_ONLY_BY_LEVEL : WEBSITE_SYSTEMS_BY_LEVEL;

            recommendation = {
                id: family[level],
                reason: keepSystemsOnly
                    ? `The ${level} systems-only level preserves your existing-site choice.`
                    : `The ${level} Website + Systems level includes an approved website scope.`
            };
        } else if (requestedPackage.lane === 'WEBSITE') {
            recommendation = websiteRecommendation(requestedPackage, intake);
        } else if (requestedPackage.lane === 'COMMERCE') {
            recommendation = commerceRecommendation(requestedPackage, intake);
        }

        const resolvedPackage = packageMap.get(recommendation.id);

        if (!resolvedPackage || resolvedPackage.deprecated === true || resolvedPackage.recommendable === false) {
            return {
                ok: false,
                code: 'INVALID_RESOLUTION',
                requestedKey: requestedPackage.id,
                message: 'The submitted scope did not resolve to an available package.'
            };
        }

        return {
            ok: true,
            requestedKey: requestedPackage.id,
            resolvedKey: resolvedPackage.id,
            changed: requestedPackage.id !== resolvedPackage.id,
            reason: recommendation.reason,
            pricingMode: resolvedPackage.pricingMode,
            checkoutMode: resolvedPackage.checkoutMode,
            priceDisplay: resolvedPackage.priceDisplay,
            includedScope: resolvedPackage.scopeLimits || {},
            billingType: resolvedPackage.billingType,
            catalogVersion: catalogInput && catalogInput.catalogVersion ? catalogInput.catalogVersion : ''
        };
    }

    function getPaymentOptions(pkg) {
        if (!pkg || ['CONSULT_ONLY', 'DISABLED'].includes(pkg.checkoutMode)) {
            return [];
        }

        if (pkg.checkoutMode === 'DEPOSIT_ONLY') {
            return [{
                key: 'deposit',
                amount: pkg.depositPrice,
                priceDisplay: `$${Number(pkg.depositPrice).toLocaleString('en-US')}`,
                description: 'Scope deposit applied to the approved final project.'
            }];
        }

        const fullOption = {
            key: 'full',
            projectPrice: pkg.projectPrice || 0,
            setupPrice: pkg.setupPrice || 0,
            monthlyPrice: pkg.monthlyPrice || 0,
            priceDisplay: pkg.priceDisplay
        };

        if (pkg.checkoutMode === 'FULL_OR_DEPOSIT') {
            return [
                fullOption,
                {
                    key: 'deposit',
                    amount: pkg.depositPrice,
                    priceDisplay: `$${Number(pkg.depositPrice).toLocaleString('en-US')}`,
                    description: 'Project deposit applied to the fixed package total.'
                }
            ];
        }

        return [fullOption];
    }

    return Object.freeze({
        PAGE_BANDS,
        WEBSITE_BY_BAND,
        COMMERCE_BY_LEVEL,
        SYSTEMS_ONLY_BY_LEVEL,
        WEBSITE_SYSTEMS_BY_LEVEL,
        makePackageMap,
        normalizeIntake,
        resolvePackage,
        getPaymentOptions,
        isSystemsOnlyPackage,
        isWebsiteSystemsPackage
    });
}));

