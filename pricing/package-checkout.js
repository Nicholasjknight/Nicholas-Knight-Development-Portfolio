(function () {
    try {
    const packagePresentationDefaults = {
        'website-demo-preview': {
            name: 'Demo Preview Site',
            price: '$200',
            family: 'website',
            profile: 'website-basic',
            goalLabel: 'What should this demo page prove?',
            goalPlaceholder: 'Tell us what you want to validate: offer clarity, layout direction, lead capture, or early customer feedback.'
        },
        'website-preview-launch': {
            name: 'Preview Launch Site',
            price: '$750',
            family: 'website',
            profile: 'website-basic',
            goalLabel: 'What is this preview page for?',
            goalPlaceholder: 'Tell us the main purpose of the page and what you want visitors to do when they land on it.'
        },
        'website-live-essential': {
            name: 'Essential Launch Site',
            price: '$700',
            family: 'website',
            profile: 'website-basic',
            checkoutEnabled: false,
            deprecated: true,
            goalLabel: 'What should this website help your business do?',
            goalPlaceholder: 'Example: generate calls, show services clearly, look more professional, or launch a simple business site.'
        },
        'website-live-plus': {
            name: 'Essential Launch Plus',
            price: '$850',
            family: 'website',
            profile: 'website-basic',
            checkoutEnabled: false,
            deprecated: true,
            goalLabel: 'What are we building, and what should it accomplish?',
            goalPlaceholder: 'Give us the short version. We only need enough to start the build cleanly.'
        },
        'website-search-foundation': {
            name: 'Search Foundation Site',
            price: '$1,200',
            family: 'website',
            profile: 'website-local',
            checkoutEnabled: false,
            deprecated: true,
            goalLabel: 'What should this search-ready site help you get more of?',
            goalPlaceholder: 'Example: local calls, quote requests, or a stronger Google-ready site.'
        },
        'website-search-foundation-plus': {
            name: 'Search Foundation Plus',
            price: '$1,500',
            family: 'website',
            profile: 'website-local',
            checkoutEnabled: false,
            deprecated: true,
            goalLabel: 'What should this search-ready site help your business do?',
            goalPlaceholder: 'Give us the core goal first. We can fill in the rest with you after checkout.'
        },
        'website-local-seo-starter': {
            name: 'Local Site',
            price: '$1,200',
            family: 'website',
            profile: 'website-local',
            goalLabel: 'What should this local site help you win?',
            goalPlaceholder: 'Example: stronger Google visibility, better design quality, cleaner lead capture, or competitor differentiation.',
            paymentOptions: [
                {
                    value: 'full',
                    label: 'Pay in full - $1,200',
                    help: 'Project payment through Stripe — financing may appear when eligible.'
                },
                {
                    value: 'deposit',
                    label: 'Reserve kickoff with a $600 deposit',
                    help: 'Deposit is applied to the project total. Remaining balance is invoiced during milestone approvals.'
                }
            ]
        },
        'website-local-launch-plus': {
            name: 'Authority Site',
            price: '$2,000',
            family: 'website',
            profile: 'website-local',
            goalLabel: 'What is the main growth goal for this up-to-30-page Authority build?',
            goalPlaceholder: 'Example: cover multiple service areas, expand page depth, or launch a stronger lead-generation site.',
            paymentOptions: [
                {
                    value: 'full',
                    label: 'Pay in full - $2,000',
                    help: 'Project payment through Stripe — financing may appear when eligible. GBP setup/optimize is included.'
                },
                {
                    value: 'deposit',
                    label: 'Reserve kickoff with a $1,000 deposit',
                    help: 'Deposit is applied to the project total. Remaining balance is invoiced during milestone approvals.'
                }
            ]
        },
        'website-local-launch-max': {
            name: 'Max Authority Site',
            price: '$4,500',
            family: 'website',
            profile: 'website-local',
            billingType: 'PROJECT',
            goalLabel: 'What should this up-to-40-page Max Authority PROJECT prioritize?',
            goalPlaceholder: 'Example: deeper service/location architecture, stronger technical SEO/GEO/AEO, or a denser conversion path than Authority Site.',
            paymentOptions: [
                {
                    value: 'full',
                    label: 'Pay in full - $4,500',
                    help: 'One-time PROJECT payment through Stripe — financing may appear when eligible. GBP setup/optimize is included. Monthly ops is separate.'
                },
                {
                    value: 'deposit',
                    label: 'Reserve kickoff with a $2,000 deposit',
                    help: 'Deposit is applied to the project total. Remaining balance is invoiced across scoped milestones.'
                }
            ]
        },
        'website-authority-network': {
            name: 'Authority Network',
            price: 'from $6,500',
            family: 'website',
            profile: 'website-local',
            billingType: 'SCOPED',
            requireDeposit: true,
            goalLabel: 'What 60–100+ page network architecture are we scoping?',
            goalPlaceholder: 'Example: multi-market service/location graph, standardized expansion pages, or a large authority network beyond Max Authority.',
            paymentOptions: [
                {
                    value: 'deposit',
                    label: 'Reserve scope with a $2,500 deposit',
                    help: 'Scope deposit only. Remaining balance is invoiced after page architecture and milestones are confirmed.'
                }
            ]
        },
        'ecommerce-preview-catalog': {
            name: 'Storefront Preview',
            price: '$750',
            family: 'ecommerce',
            profile: 'ecommerce',
            goalLabel: 'What kind of catalog or product showcase are we building?',
            goalPlaceholder: 'Example: product validation, portfolio-style catalog, or a preview before live checkout.'
        },
        'ecommerce-payment-links': {
            name: 'Payment-Link Store',
            price: '$1,200',
            family: 'ecommerce',
            profile: 'ecommerce',
            goalLabel: 'What should this store let people buy or request?',
            goalPlaceholder: 'Tell us the short version of what you sell and what kind of payment flow you want.'
        },
        'ecommerce-launch': {
            name: 'E-Commerce Launch',
            price: '$2,997',
            family: 'ecommerce',
            profile: 'ecommerce',
            billingType: 'PROJECT',
            goalLabel: 'What are we selling, and what should the buying process feel like?',
            goalPlaceholder: 'Example: clean cart flow, custom product pages, or a more polished online store than templates allow. Initial setup includes up to 20 products.',
            paymentOptions: [
                {
                    value: 'full',
                    label: 'Pay in full - $2,997',
                    help: 'One-time payment through Stripe. Initial product load capped; extra migration quoted separately.'
                },
                {
                    value: 'deposit',
                    label: 'Reserve kickoff with a $1,500 deposit',
                    help: 'Deposit is applied to the project total. Remaining balance is invoiced before final launch.'
                }
            ]
        },
        'ecommerce-launch-plus': {
            name: 'E-Commerce Launch Plus',
            price: '$3,497',
            family: 'ecommerce',
            profile: 'ecommerce',
            goalLabel: 'What makes this store larger than a standard launch?',
            goalPlaceholder: 'Example: 20+ products, a larger catalog, more complex checkout flow, or extra product-page depth.'
        },
        'ecommerce-growth-store': {
            name: 'E-Commerce Growth Store',
            price: '$3,997',
            family: 'ecommerce',
            profile: 'ecommerce',
            goalLabel: 'What makes this store more complex than a basic launch?',
            goalPlaceholder: 'Example: larger catalog, variants, CMS editing, stronger reporting, or post-purchase automations.',
            paymentOptions: [
                {
                    value: 'full',
                    label: 'Pay in full - $3,997',
                    help: 'One-time payment through Stripe.'
                },
                {
                    value: 'deposit',
                    label: 'Reserve kickoff with a $2,000 deposit',
                    help: 'Deposit is applied to the project total. Remaining balance is invoiced across scoped milestones.'
                }
            ]
        },
        'ecommerce-advanced-system': {
            name: 'Advanced E-Commerce System',
            price: 'from $7,500',
            family: 'ecommerce',
            profile: 'ecommerce',
            billingType: 'SCOPED',
            requireDeposit: true,
            goalLabel: 'What advanced store or system are we scoping?',
            goalPlaceholder: 'Example: dynamic inventory, admin editing, accounts, reporting, or complex purchase logic. Full price is confirmed after scope.',
            paymentOptions: [
                {
                    value: 'deposit',
                    label: 'Reserve strategy with a $2,500 deposit',
                    help: 'Strategy deposit only. Remaining balance is invoiced after scope confirmation — not a flat open checkout for large scope.'
                }
            ]
        },
        'gbp-setup': {
            name: 'GBP Setup',
            price: '$497',
            family: 'seo',
            profile: 'website-local',
            goalLabel: 'What do you need for Google Business Profile setup?',
            goalPlaceholder: 'Example: new profile from scratch, category cleanup, services, photos checklist, or verification help.'
        },
        'gbp-maintenance': {
            name: 'GBP Maintenance',
            price: '$147/mo',
            family: 'seo',
            profile: 'monthly',
            goalLabel: 'What should we maintain on your Google Business Profile each month?',
            goalPlaceholder: 'Example: posts, photo updates, Q&A, review reply templates, or category/service hygiene.'
        },
        'gbp-optimization': {
            name: 'GBP Setup',
            price: '$497',
            family: 'seo',
            profile: 'website-local',
            goalLabel: 'What do you want improved about your Google Business Profile?',
            goalPlaceholder: 'Example: better categories, services, conversion copy, Q&A, or a cleaner profile setup.'
        },
        'monthly-local-seo-starter': {
            name: 'Local Visibility Lite',
            price: '$197/mo',
            family: 'monthly',
            profile: 'monthly',
            goalLabel: 'What should we help you stay on top of every month?',
            goalPlaceholder: 'Example: light website edits, GBP upkeep, analytics checks, or basic visibility support.'
        },
        'monthly-visibility-standard': {
            name: 'Visibility Standard',
            price: '$397/mo',
            family: 'monthly',
            profile: 'monthly',
            goalLabel: 'What should we manage for you month to month?',
            goalPlaceholder: 'Example: monthly site updates, GBP posts, Search Console checks, or local SEO upkeep.'
        },
        'monthly-visibility-pro': {
            name: 'Visibility Pro',
            price: '$697/mo',
            family: 'monthly',
            profile: 'monthly',
            goalLabel: 'What is the biggest ongoing need we should handle each month?',
            goalPlaceholder: 'Example: website management, GBP support, citations, reviews, or lead-tracking help.'
        },
        'monthly-growth-management': {
            name: 'Growth Management',
            price: 'starting at $1,000/mo',
            family: 'monthly',
            profile: 'monthly',
            billingType: 'SCOPED',
            checkoutEnabled: false,
            goalLabel: 'What would you want us actively managing every month?',
            goalPlaceholder: 'Example: CRM, reporting, content coordination, automation workflows, or a broader growth system.'
        },
        'ops-simple-lead-tracker': {
            name: 'Simple Lead Tracker',
            price: '$250 setup + $49/mo',
            family: 'ops',
            profile: 'ops',
            goalLabel: 'What do you want this tracker to help you keep organized?',
            goalPlaceholder: 'Example: lead sources, quote pipeline, contact records, or sold job tracking.'
        },
        'ops-contractor-crm-starter': {
            name: 'Contractor CRM Starter',
            price: '$500 setup + $97/mo',
            family: 'ops',
            profile: 'ops',
            goalLabel: 'What part of the CRM or follow-up process needs the most help?',
            goalPlaceholder: 'Example: tracking estimates, review follow-up, pipeline stages, or lead organization.'
        },
        'ops-job-records-system': {
            name: 'Job Records System',
            price: '$750 setup + $149/mo',
            family: 'ops',
            profile: 'ops',
            goalLabel: 'What job records or documents need to be organized?',
            goalPlaceholder: 'Example: estimates, invoices, photos, work authorizations, or job folders.'
        },
        'ops-automated-job-records': {
            name: 'Automated Job Records',
            price: '$1,500 setup + $197/mo',
            family: 'ops',
            profile: 'ops',
            goalLabel: 'What process do you want automated?',
            goalPlaceholder: 'Example: form submissions, folder creation, notifications, or tracker updates.'
        },
        'ops-growth-system-starter': {
            name: 'Growth System Starter',
            price: 'from $5,000 setup + $397/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'What business bottleneck should this system solve first?',
            goalPlaceholder: 'Example: lead tracking, review workflow, reporting, or a weak process behind the website.'
        },
        'ops-full-growth-system': {
            name: 'Full Growth System',
            price: '$7,500 setup + $697/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'What should this full system improve most for the business?',
            goalPlaceholder: 'Example: lead flow, tracking, CRM, reporting, site and search alignment, or operations cleanup.'
        },
        'ops-custom-automation-system': {
            name: 'Custom / Field Ops System',
            price: '$10,000 setup + $1,000/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'What should the field app or multi-brand automation handle first?',
            goalPlaceholder: 'Example: mobile estimates/invoices/photos for crews, portal ticket dispatch, multi-brand outreach, or social fan-out from completed jobs.'
        },
        'ops-growth-systems-only-starter': {
            name: 'Growth Systems-Only Starter',
            price: 'from $2,500 setup + $397/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'You already have a site — what ops gap should we close first?',
            goalPlaceholder: 'Example: lead tracker, review follow-up, reporting, or quote follow-up on your existing website.'
        },
        'ops-growth-systems-only-full': {
            name: 'Growth Systems-Only Full',
            price: 'from $3,500 setup + $697/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'What back-office automation should run on your existing site?',
            goalPlaceholder: 'Example: follow-up email, ops alerts, outreach or social lane, GBP/search depth without rebuilding the site.'
        },
        'ops-growth-systems-only-field': {
            name: 'Field Ops Systems-Only',
            price: 'from $8,000 setup + $1,000/mo',
            family: 'ops',
            profile: 'ops',
            growthScoped: true,
            goalLabel: 'What should the field job app handle first on your current site?',
            goalPlaceholder: 'Example: mobile estimates, invoices, scoped photos, Stripe, or dispatch/portal intake without a marketing site rebuild.'
        }
    };
    const canonicalCatalog = window.KL_PACKAGE_CATALOG || { packages: [] };
    const routing = window.KLPackageRouting || null;
    const packageCatalog = Object.fromEntries((canonicalCatalog.packages || []).map((pkg) => {
        const defaults = packagePresentationDefaults[pkg.id] || {};
        const familyByLane = {
            WEBSITE: 'website',
            COMMERCE: 'ecommerce',
            VISIBILITY: pkg.id.startsWith('gbp-') ? 'seo' : 'monthly',
            OPERATIONS: 'ops',
            GROWTH_WEBSITE_SYSTEMS: 'ops',
            GROWTH_SYSTEMS_ONLY: 'ops',
            CARE: 'monthly',
            ADD_ON: 'ops'
        };
        const profileByLane = {
            WEBSITE: pkg.id.includes('demo') || pkg.id.includes('preview') ? 'website-basic' : 'website-local',
            COMMERCE: 'ecommerce',
            VISIBILITY: pkg.id.startsWith('gbp-') ? 'seo' : 'monthly',
            OPERATIONS: 'ops',
            GROWTH_WEBSITE_SYSTEMS: 'ops',
            GROWTH_SYSTEMS_ONLY: 'ops',
            CARE: 'monthly',
            ADD_ON: 'ops'
        };
        const canonicalPaymentOptions = routing ? routing.getPaymentOptions(pkg) : [];
        const paymentOptions = canonicalPaymentOptions.map((option) => ({
            value: option.key,
            label: option.key === 'deposit'
                ? `Pay ${option.priceDisplay}`
                : `Pay ${pkg.priceDisplay}`,
            help: option.description || (pkg.billingType === 'MONTHLY'
                ? 'Monthly subscription through Stripe.'
                : 'Secure payment through Stripe.')
        }));

        return [pkg.id, {
            ...defaults,
            name: pkg.name,
            price: pkg.priceDisplay,
            family: familyByLane[pkg.lane] || defaults.family || 'website',
            profile: profileByLane[pkg.lane] || defaults.profile || 'website-basic',
            checkoutEnabled: pkg.checkoutEnabled,
            checkoutMode: pkg.checkoutMode,
            pricingMode: pkg.pricingMode,
            deprecated: pkg.deprecated === true,
            depositOnly: pkg.checkoutMode === 'DEPOSIT_ONLY',
            consultOnly: pkg.checkoutMode === 'CONSULT_ONLY',
            growthScoped: ['GROWTH_WEBSITE_SYSTEMS', 'GROWTH_SYSTEMS_ONLY'].includes(pkg.lane),
            systemsOnly: pkg.lane === 'GROWTH_SYSTEMS_ONLY',
            paymentOptions: paymentOptions.length ? paymentOptions : undefined,
            goalLabel: defaults.goalLabel || `What should ${pkg.name} accomplish?`,
            goalPlaceholder: defaults.goalPlaceholder || pkg.bestFor || pkg.outcome || 'Tell us the result you need and any important constraints.'
        }];
    }));

    const productionCheckoutApiBase = 'https://knightlogics.com';
    const splitHostedProductionHosts = new Set(['knightlogics.com', 'www.knightlogics.com']);
    const uploadFileLimit = 2 * 1024 * 1024;
    const uploadTotalLimit = 4 * 1024 * 1024;
    const checkoutDraftStorageKey = 'pricingPackageCheckoutDraft';
    const intakeSupportEmail = 'support@knightlogics.com';

    const intakeOverlay = document.getElementById('starterPackageIntake');
    const intakeDialog = intakeOverlay ? intakeOverlay.querySelector('.starter-package-intake-dialog') : null;
    const intakeForm = document.getElementById('starterPackageIntakeForm');
    const intakePackageKeyInput = document.getElementById('starterPackageIntakePackageKey');
    const intakePackageNameInput = document.getElementById('starterPackageIntakePackageName');
    const intakePackagePriceInput = document.getElementById('starterPackageIntakePackagePrice');
    const intakePackageLabel = document.getElementById('starterPackageIntakePackage');
    const intakeStatus = document.getElementById('starterPackageIntakeStatus');
    const intakeCloseButton = document.getElementById('starterPackageIntakeClose');
    const intakeCancelButton = document.getElementById('starterPackageIntakeCancel');
    const intakeSubmitButton = document.getElementById('starterPackageIntakeSubmit');
    const intakeSubmitText = intakeSubmitButton ? intakeSubmitButton.querySelector('span') : null;
    const intakeSubmitLoading = intakeSubmitButton ? intakeSubmitButton.querySelector('.btn-loading') : null;
    const configuratorLabel = document.getElementById('starterPackageConfiguratorLabel');
    const configuratorTitle = document.getElementById('starterPackageConfiguratorTitle');
    const configuratorCopy = document.getElementById('starterPackageConfiguratorCopy');
    const configuratorPrice = document.getElementById('starterPackageConfiguratorPrice');
    const configuratorMeta = document.getElementById('starterPackageConfiguratorMeta');
    const assuranceTitle = document.getElementById('starterPackageAssuranceTitle');
    const assuranceBody = document.getElementById('starterPackageAssuranceBody');
    const assuranceChips = document.getElementById('starterPackageAssuranceChips');
    const dynamicFields = document.getElementById('starterPackageDynamicFields');
    const businessNameInput = document.getElementById('starterPackageBusinessName');
    const contactNameInput = document.getElementById('starterPackageContactName');
    const emailInput = document.getElementById('starterPackageEmail');
    const phoneInput = document.getElementById('starterPackagePhone');
    const logoFileInput = document.getElementById('starterPackageLogoFile');
    const referenceFilesInput = document.getElementById('starterPackageReferenceFiles');
    const assetLinkInput = document.getElementById('starterPackageAssetLink');
    const additionalNotesInput = document.getElementById('starterPackageAdditionalNotes');
    const fileList = document.getElementById('starterPackageFileList');
    const intakeHelper = document.getElementById('starterPackageIntakeHelper');
    const referralPartnerSelect = document.getElementById('starterPackageReferralPartner');
    const referralPartnerStatus = document.getElementById('starterPackageReferralStatus');

    const successOverlay = document.getElementById('starterPackageSuccessOverlay');
    const successDialog = successOverlay ? successOverlay.querySelector('.starter-package-success-dialog') : null;
    const successPackageLabel = document.getElementById('starterPackageSuccessPackage');
    const successCopy = document.getElementById('starterPackageSuccessCopy');
    const successConfirmButton = document.getElementById('starterPackageSuccessConfirm');
    const successCloseButton = document.getElementById('starterPackageSuccessClose');

    const followupOverlay = document.getElementById('starterPackageFollowupOverlay');
    const followupDialog = followupOverlay ? followupOverlay.querySelector('.starter-package-followup-dialog') : null;
    const followupForm = document.getElementById('starterPackageFollowupForm');
    const followupStatus = document.getElementById('starterPackageFollowupStatus');
    const followupPackageLabel = document.getElementById('starterPackageFollowupPackage');
    const followupPackageKeyInput = document.getElementById('starterPackageFollowupPackageKey');
    const followupPackageNameInput = document.getElementById('starterPackageFollowupPackageName');
    const followupPackagePriceInput = document.getElementById('starterPackageFollowupPackagePrice');
    const followupSubmissionStageInput = document.getElementById('starterPackageFollowupSubmissionStage');
    const followupSubmissionTypeInput = document.getElementById('starterPackageFollowupSubmissionType');
    const followupSubjectInput = document.getElementById('starterPackageFollowupSubject');
    const followupBusinessNameInput = document.getElementById('starterPackageFollowupBusinessName');
    const followupContactNameInput = document.getElementById('starterPackageFollowupContactName');
    const followupEmailInput = document.getElementById('starterPackageFollowupEmail');
    const followupAssetLinkInput = document.getElementById('starterPackageFollowupAssetLink');
    const followupLogoFileInput = document.getElementById('starterPackageFollowupLogoFile');
    const followupAttachmentsInput = document.getElementById('starterPackageFollowupAttachments');
    const followupDetailsInput = document.getElementById('starterPackageFollowupDetails');
    const followupFileList = document.getElementById('starterPackageFollowupFileList');
    const followupSubmitButton = document.getElementById('starterPackageFollowupSubmit');
    const followupSubmitText = followupSubmitButton ? followupSubmitButton.querySelector('span') : null;
    const followupSubmitLoading = followupSubmitButton ? followupSubmitButton.querySelector('.btn-loading') : null;
    const followupCloseButton = document.getElementById('starterPackageFollowupClose');

    const pricingCtas = Array.from(document.querySelectorAll('.pricing-card-cta[data-package-key], .pricing-card-cta[href*="openPackage="]'));
    let activePackageKey = 'website-local-seo-starter';
    let lastTrigger = null;
    let activePurchaseReturnPackageKey = '';
    let referralPartnersRequest = null;

    function getPackageKeyFromTrigger(trigger) {
        if (!trigger) {
            return '';
        }

        const dataPackageKey = trigger.getAttribute('data-package-key');
        if (dataPackageKey) {
            return dataPackageKey;
        }

        const href = trigger.getAttribute('href') || '';
        const url = new URL(href, window.location.origin);
        return url.searchParams.get('openPackage') || '';
    }

    function getPackageDetails(packageKey) {
        return packageCatalog[packageKey] || {
            name: 'Starter package',
            price: '',
            family: 'website',
            profile: 'website-basic',
            goalLabel: 'What are we building for you?',
            goalPlaceholder: 'Tell us the short version so we can start cleanly.'
        };
    }

    function resolveGrowthPackageRoute(systemsScope, maintenanceDepth, auditDepth) {
        const effectiveMaintenance = maintenanceDepth
            || (auditDepth === 'audit-maintained' ? 'management' : auditDepth === 'audit-full' ? 'pro' : 'standard');
        const systemsOnly = systemsScope === 'systems-only';

        if (systemsScope === 'custom' || effectiveMaintenance === 'management' || auditDepth === 'audit-maintained') {
            return {
                packageKey: systemsOnly ? 'ops-growth-systems-only-field' : 'ops-custom-automation-system',
                message: systemsOnly
                    ? 'Field-level systems preserve your existing-site choice; no website rebuild is added.'
                    : 'Field operations require an approved Website + Systems scope.'
            };
        }

        if (systemsScope === 'full-stack' || effectiveMaintenance === 'pro' || auditDepth === 'audit-full') {
            return {
                packageKey: systemsOnly ? 'ops-growth-systems-only-full' : 'ops-full-growth-system',
                message: systemsOnly
                    ? 'Full systems preserve your existing-site choice; no website rebuild is added.'
                    : 'Full Growth combines an approved website scope with broader workflows and monthly ownership.'
            };
        }

        return {
            packageKey: systemsOnly ? 'ops-growth-systems-only-starter' : 'ops-growth-system-starter',
            message: systemsOnly
                ? 'Starter systems use your suitable existing website; no rebuild is added.'
                : 'Growth Starter includes a named Local or Authority-equivalent website scope plus lead systems.'
        };
    }

    function applyGrowthScopeSelection() {
        const systemsScopeInput = intakeForm ? intakeForm.querySelector('#starterPackageSystemsScope') : null;
        const maintenanceDepthInput = intakeForm ? intakeForm.querySelector('#starterPackageMaintenanceDepth') : null;
        const auditDepthInput = intakeForm ? intakeForm.querySelector('#starterPackageAuditDepth') : null;

        if (!systemsScopeInput || !maintenanceDepthInput) {
            return null;
        }

        const auditDepth = auditDepthInput ? auditDepthInput.value : '';
        if (auditDepthInput && auditDepth && maintenanceDepthInput) {
            if (auditDepth === 'audit-maintained') {
                maintenanceDepthInput.value = 'management';
            } else if (auditDepth === 'audit-full') {
                maintenanceDepthInput.value = 'pro';
            } else if (!maintenanceDepthInput.value) {
                maintenanceDepthInput.value = 'standard';
            }
        }

        const route = resolveGrowthPackageRoute(
            systemsScopeInput.value || 'site-ops',
            maintenanceDepthInput.value || 'standard',
            auditDepth
        );
        const packageConfig = getPackageDetails(route.packageKey);
        activePackageKey = route.packageKey;

        if (intakePackageKeyInput) {
            intakePackageKeyInput.value = route.packageKey;
        }

        if (intakePackageNameInput) {
            intakePackageNameInput.value = packageConfig.name;
        }

        if (intakePackagePriceInput) {
            intakePackagePriceInput.value = packageConfig.price;
        }

        if (intakePackageLabel) {
            intakePackageLabel.textContent = `${packageConfig.name} - ${packageConfig.price}`;
        }

        renderAssurance(packageConfig);
        updateCheckoutSummary(packageConfig);

        if (configuratorCopy) {
            configuratorCopy.textContent = route.message;
        }

        if (configuratorMeta) {
            configuratorMeta.textContent = 'Variables: (1) Systems-only or Website + Systems with a named Local/Authority-equivalent website scope, (2) Website Audit depth, (3) systems complexity, (4) monthly ownership tier, and (5) selling or invoicing needs. Max or Authority Network depth is scoped separately.';
        }

        return packageConfig;
    }

    function getCheckoutEndpoint() {
        const apiBase = splitHostedProductionHosts.has(window.location.hostname)
            ? productionCheckoutApiBase
            : window.location.origin;

        return new URL('/api/create-checkout-session', `${apiBase}/`).toString();
    }

    function getUploadEndpoint() {
        const apiBase = splitHostedProductionHosts.has(window.location.hostname)
            ? productionCheckoutApiBase
            : window.location.origin;

        return new URL('/api/package-intake-upload', `${apiBase}/`).toString();
    }

    function hasDepositOption(packageConfig) {
        return Array.isArray(packageConfig.paymentOptions) && packageConfig.paymentOptions.some((option) => option.value === 'deposit');
    }

    function extractCurrencyAmount(text) {
        const match = String(text || '').match(/\$([\d,]+(?:\.\d{2})?)/);
        return match ? Number(match[1].replace(/,/g, '')) : null;
    }

    function getCheckoutAmount(packageConfig, paymentOptionConfig) {
        if (paymentOptionConfig) {
            const optionAmount = extractCurrencyAmount(paymentOptionConfig.label);
            if (Number.isFinite(optionAmount)) {
                return optionAmount;
            }
        }

        if (Array.isArray(packageConfig.paymentOptions)) {
            const fullOption = packageConfig.paymentOptions.find((option) => option.value === 'full');
            const fullAmount = extractCurrencyAmount(fullOption && fullOption.label);
            if (Number.isFinite(fullAmount)) {
                return fullAmount;
            }
        }

        return extractCurrencyAmount(packageConfig.price);
    }

    function supportsBnpl(packageConfig, paymentOptionConfig) {
        const checkoutAmount = getCheckoutAmount(packageConfig, paymentOptionConfig);
        return packageConfig && packageConfig.family !== 'monthly' && Number.isFinite(checkoutAmount) && checkoutAmount >= 800;
    }

    function getAssuranceData(packageConfig) {
        const baseChips = [
            'Secure Stripe checkout',
            'You do not need every detail right now',
            'Starter files can be attached now or after payment'
        ];

        if (packageConfig.family === 'ops') {
            return {
                title: 'Setup fee plus monthly system care',
                body: 'CRM, tracking, and automation systems need a first-time build plus ongoing upkeep. Checkout starts both together: the setup is charged today, then monthly support continues through Stripe.',
                chips: ['One-time setup fee', 'Monthly recurring support', 'Secure Stripe subscription checkout']
            };
        }

        if (packageConfig.family === 'monthly') {
            return {
                title: 'Simple onboarding before recurring checkout',
                body: 'This is just enough to start the relationship cleanly. Add the property we will be maintaining, the main monthly priority, and any starter files or links you already have.',
                chips: ['Month-to-month billing', 'Existing property required', 'Extra files can be sent after checkout']
            };
        }

        if (hasDepositOption(packageConfig)) {
            return {
                title: 'Secure checkout with a full-pay or deposit option',
                body: 'Use this starter form to lock in the package and attach anything helpful now. If you choose a deposit, it is applied to the project total and the remaining balance is handled in milestones.',
                chips: [...baseChips, 'Deposit is applied to the project total']
            };
        }

        const selectedPaymentConfig = Array.isArray(packageConfig.paymentOptions)
            ? packageConfig.paymentOptions.find((option) => option.value === getSelectedPaymentOption())
            : null;
        const financingChip = supportsBnpl(packageConfig, selectedPaymentConfig)
            ? ['Financing may appear in Stripe when eligible']
            : [];

        return {
            title: '2-minute starter form before secure checkout',
            body: 'This is not a full discovery questionnaire. It is just enough to start the project cleanly, collect any starter files you already have, and move you into checkout without unnecessary friction.',
            chips: [...baseChips, ...financingChip]
        };
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 KB';
        }

        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setReferralStatus(message, isError) {
        if (!referralPartnerStatus) {
            return;
        }

        referralPartnerStatus.textContent = message || '';
        referralPartnerStatus.classList.toggle('is-error', Boolean(isError));
    }

    function applyReferralPartnerOptions(partners) {
        if (!referralPartnerSelect || !Array.isArray(partners)) {
            return;
        }

        const previousValue = referralPartnerSelect.value;
        const optionMarkup = ['<option value="">Select a company (optional)</option>'];

        partners
            .filter((partner) => partner && partner.slug && partner.displayName)
            .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)))
            .forEach((partner) => {
                optionMarkup.push(`<option value="${escapeHtml(partner.slug)}">${escapeHtml(partner.displayName)}</option>`);
            });

        referralPartnerSelect.innerHTML = optionMarkup.join('');

        if (previousValue) {
            const matchingOption = Array.from(referralPartnerSelect.options).find((option) => option.value === previousValue);
            if (matchingOption) {
                referralPartnerSelect.value = previousValue;
            }
        }
    }

    async function ensureReferralPartnersLoaded() {
        if (!referralPartnerSelect || referralPartnerSelect.dataset.loaded === '1') {
            return;
        }

        if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            referralPartnerSelect.dataset.loaded = '1';
            setReferralStatus('', false);
            return;
        }

        if (referralPartnersRequest) {
            await referralPartnersRequest;
            return;
        }

        referralPartnersRequest = (async function () {
            try {
                setReferralStatus('Loading referral partners...', false);

                const response = await fetch('/api/referral-partners', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                });
                const payload = await response.json().catch(function () {
                    return {};
                });

                if (!response.ok || !payload || !Array.isArray(payload.partners)) {
                    throw new Error('Unable to load referral partners');
                }

                applyReferralPartnerOptions(payload.partners);
                referralPartnerSelect.dataset.loaded = '1';
                setReferralStatus('', false);
            } catch (error) {
                console.warn('Referral partner list unavailable:', error);
                setReferralStatus('Referral list is temporarily unavailable. You can still continue checkout.', false);
            }
        })();

        try {
            await referralPartnersRequest;
        } finally {
            referralPartnersRequest = null;
        }
    }

    function updateFileList(target, primaryInput, secondaryInput) {
        if (!target) {
            return;
        }

        const entries = [];
        const logoFiles = primaryInput && primaryInput.files ? Array.from(primaryInput.files) : [];
        const starterFiles = secondaryInput && secondaryInput.files ? Array.from(secondaryInput.files) : [];

        logoFiles.forEach((file) => {
            entries.push(`Logo: ${file.name} (${formatBytes(file.size)})`);
        });

        starterFiles.forEach((file) => {
            entries.push(`Starter file: ${file.name} (${formatBytes(file.size)})`);
        });

        if (entries.length === 0) {
            target.innerHTML = '';
            return;
        }

        target.innerHTML = entries
            .map((entry) => `<div class="starter-package-file-list-item">${entry}</div>`)
            .join('');
    }

    function validateSelectedFiles(primaryInput, secondaryInput) {
        const logoFiles = primaryInput && primaryInput.files ? Array.from(primaryInput.files) : [];
        const starterFiles = secondaryInput && secondaryInput.files ? Array.from(secondaryInput.files) : [];
        const allFiles = [...logoFiles, ...starterFiles];

        let totalBytes = 0;

        for (const file of allFiles) {
            totalBytes += file.size;

            if (file.size > uploadFileLimit) {
                return `Keep each uploaded file under ${formatBytes(uploadFileLimit)}. Use a share link for anything larger.`;
            }
        }

        if (totalBytes > uploadTotalLimit) {
            return `Keep total uploads under ${formatBytes(uploadTotalLimit)}. Use a share link for larger folders or videos.`;
        }

        return '';
    }

    function renderExistingPresenceFields(prefix) {
        return `
            <div class="form-group starter-package-intake-span-2">
                <label class="starter-package-checkbox" for="${prefix}HasPresence">
                    <input type="checkbox" id="${prefix}HasPresence" name="hasOnlinePresence" value="yes">
                    <span>I already have a website, listing, or social profile you should review</span>
                </label>
            </div>
            <div class="starter-package-conditional starter-package-intake-span-2" id="${prefix}PresenceFields" hidden>
                <div class="starter-package-intake-grid starter-package-intake-grid--nested">
                    <div class="form-group">
                        <label for="${prefix}WebsiteOrProfile">Website or profile URL</label>
                        <input type="url" id="${prefix}WebsiteOrProfile" name="websiteOrProfile" placeholder="Optional website, store, or profile link" maxlength="255">
                    </div>
                    <div class="form-group">
                        <label for="${prefix}GoogleBusinessProfile">Google Business Profile URL</label>
                        <input type="url" id="${prefix}GoogleBusinessProfile" name="googleBusinessProfile" placeholder="Optional GBP link" maxlength="255">
                    </div>
                    <div class="form-group">
                        <label for="${prefix}FacebookUrl">Facebook URL</label>
                        <input type="url" id="${prefix}FacebookUrl" name="facebookUrl" placeholder="Optional Facebook link" maxlength="255">
                    </div>
                    <div class="form-group">
                        <label for="${prefix}InstagramUrl">Instagram URL</label>
                        <input type="url" id="${prefix}InstagramUrl" name="instagramUrl" placeholder="Optional Instagram link" maxlength="255">
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <label for="${prefix}LinkedinUrl">LinkedIn or other profile URL</label>
                        <input type="url" id="${prefix}LinkedinUrl" name="linkedinUrl" placeholder="Optional LinkedIn or other profile link" maxlength="255">
                    </div>
                </div>
            </div>
        `;
    }

    function renderPaymentOptions(packageConfig) {
        if (!Array.isArray(packageConfig.paymentOptions) || packageConfig.paymentOptions.length === 0) {
            return '<input type="hidden" name="paymentOption" value="full">';
        }

        return `
            <div class="starter-package-payment-options">
                <div class="starter-package-payment-options-title">Payment option</div>
                ${packageConfig.paymentOptions.map((option, index) => `
                    <label class="starter-package-payment-option" for="starterPackagePaymentOption${index}">
                        <input
                            type="radio"
                            id="starterPackagePaymentOption${index}"
                            name="paymentOption"
                            value="${option.value}"
                            ${index === 0 ? 'checked' : ''}
                        >
                        <span>
                            <strong>${option.label}</strong>
                            <small>${option.help}</small>
                        </span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    function renderDynamicFields(packageConfig) {
        if (packageConfig.profile === 'website-local') {
            return `
                <div class="starter-package-intake-grid">
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageProjectGoal">${packageConfig.goalLabel}</label>
                        <textarea id="starterPackageProjectGoal" name="projectDetails" placeholder="${packageConfig.goalPlaceholder}" maxlength="1500" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="starterPackagePrimaryZip">Primary ZIP code</label>
                        <input type="text" id="starterPackagePrimaryZip" name="primaryZip" placeholder="Example: 34695" maxlength="20" required>
                    </div>
                    <div class="form-group">
                        <label for="starterPackageServiceRadiusMiles">Approximate service radius</label>
                        <select id="starterPackageServiceRadiusMiles" name="serviceRadiusMiles" required>
                            <option value="">Choose one...</option>
                            <option value="5">About 5 miles</option>
                            <option value="10">About 10 miles</option>
                            <option value="15">About 15 miles</option>
                            <option value="25">About 25 miles</option>
                            <option value="40+">40+ miles or broader region</option>
                        </select>
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackagePrimaryService">Main service or offer</label>
                        <input type="text" id="starterPackagePrimaryService" name="primaryService" placeholder="Optional, but helpful" maxlength="120">
                    </div>
                </div>
                ${renderExistingPresenceFields('starterPackage')}
                ${renderPaymentOptions(packageConfig)}
            `;
        }

        if (packageConfig.profile === 'ecommerce') {
            return `
                <div class="starter-package-intake-grid">
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageProjectGoal">${packageConfig.goalLabel}</label>
                        <textarea id="starterPackageProjectGoal" name="projectDetails" placeholder="${packageConfig.goalPlaceholder}" maxlength="1500" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="starterPackageApproxProductCount">Approximate product count</label>
                        <select id="starterPackageApproxProductCount" name="approxProductCount">
                            <option value="">Optional</option>
                            <option value="1-5">1 to 5 products</option>
                            <option value="6-10">6 to 10 products</option>
                            <option value="11-20">11 to 20 products</option>
                            <option value="21-50">21 to 50 products</option>
                            <option value="50+">50+ products</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="starterPackagePrimaryService">Main product category</label>
                        <input type="text" id="starterPackagePrimaryService" name="primaryService" placeholder="Optional" maxlength="120">
                    </div>
                </div>
                ${renderExistingPresenceFields('starterPackage')}
                ${renderPaymentOptions(packageConfig)}
            `;
        }

        if (packageConfig.profile === 'ops') {
            const growthFields = packageConfig.growthScoped ? `
                    <div class="form-group">
                        <label for="starterPackageSystemsScope">Which systems are you opting into?</label>
                        <select id="starterPackageSystemsScope" name="systemsScope" required>
                            <option value="">Choose one...</option>
                            <option value="systems-only" ${packageConfig.systemsOnly ? 'selected' : ''}>Systems only — keep my suitable existing website</option>
                            <option value="site-ops" ${packageConfig.systemsOnly ? '' : 'selected'}>Website + systems — approved Local/Authority-equivalent scope</option>
                            <option value="full-stack">Full stack — site, search, GBP, CRM, workflows</option>
                            <option value="custom">Custom — multi-brand CRM, routing, or custom automation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="starterPackageAuditDepth">How deep should Website Audits and maintained audits go?</label>
                        <select id="starterPackageAuditDepth" name="auditDepth" required>
                            <option value="">Choose one...</option>
                            <option value="audit-external">External audit — public checks only (no GSC/GBP login)</option>
                            <option value="audit-limited" selected>Limited Website Audit — partial access (e.g. no GSC yet)</option>
                            <option value="audit-full">Full-access Website Audit — GSC, GBP, analytics when granted</option>
                            <option value="audit-maintained">Full-access + maintained ongoing audits</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="starterPackageMaintenanceDepth">Monthly care level</label>
                        <select id="starterPackageMaintenanceDepth" name="maintenanceDepth" required>
                            <option value="">Choose one...</option>
                            <option value="standard" selected>Standard care — $397/mo</option>
                            <option value="pro">Pro care — $697/mo</option>
                            <option value="management">Growth Management — $1,000+/mo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="starterPackageSellingOnlineNeed">What selling, payment, or invoicing flow do you need?</label>
                        <select id="starterPackageSellingOnlineNeed" name="sellingOnlineNeed" required>
                            <option value="">Choose one...</option>
                            <option value="no">No online selling or invoicing</option>
                            <option value="later">Maybe later, but not now</option>
                            <option value="stripe-links">Simple payment links or buy buttons</option>
                            <option value="invoicing" selected>Job / estimate invoicing system (not a storefront)</option>
                            <option value="cart-store">A real cart and storefront checkout</option>
                        </select>
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <p class="starter-package-intake-helper" style="margin-top:0;">Systems-only keeps a suitable existing website. Website + Systems includes a named Local or Authority-equivalent scope; Max or Authority Network depth is quoted as an upgrade.</p>
                    </div>
            ` : '';

            return `
                <div class="starter-package-intake-grid">
                    ${growthFields}
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageProjectGoal">${packageConfig.goalLabel}</label>
                        <textarea id="starterPackageProjectGoal" name="projectDetails" placeholder="${packageConfig.goalPlaceholder}" maxlength="1500" required></textarea>
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageCurrentSystem">Current spreadsheet, software, or process</label>
                        <input type="text" id="starterPackageCurrentSystem" name="currentSystem" placeholder="Optional, but helpful" maxlength="160">
                    </div>
                </div>
                ${renderPaymentOptions(packageConfig)}
            `;
        }

        if (packageConfig.profile === 'monthly') {
            return `
                <div class="starter-package-intake-grid">
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageManagedPropertyUrl">Website or profile URL we will be working on</label>
                        <input type="url" id="starterPackageManagedPropertyUrl" name="managedPropertyUrl" placeholder="Website, GBP, or other main profile URL" maxlength="255" required>
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageProjectGoal">${packageConfig.goalLabel}</label>
                        <textarea id="starterPackageProjectGoal" name="projectDetails" placeholder="${packageConfig.goalPlaceholder}" maxlength="1500" required></textarea>
                    </div>
                    <div class="form-group starter-package-intake-span-2">
                        <label for="starterPackageCurrentSystem">Other URLs or systems we should know about</label>
                        <input type="text" id="starterPackageCurrentSystem" name="currentSystem" placeholder="Optional additional profile or system notes" maxlength="160">
                    </div>
                </div>
                ${renderExistingPresenceFields('starterPackageMonthly')}
                ${renderPaymentOptions(packageConfig)}
            `;
        }

        return `
            <div class="starter-package-intake-grid">
                <div class="form-group starter-package-intake-span-2">
                    <label for="starterPackageProjectGoal">${packageConfig.goalLabel}</label>
                    <textarea id="starterPackageProjectGoal" name="projectDetails" placeholder="${packageConfig.goalPlaceholder}" maxlength="1500" required></textarea>
                </div>
            </div>
            ${renderExistingPresenceFields('starterPackage')}
            ${renderPaymentOptions(packageConfig)}
        `;
    }

    function renderAssurance(packageConfig) {
        const data = getAssuranceData(packageConfig);

        if (assuranceTitle) {
            assuranceTitle.textContent = data.title;
        }

        if (assuranceBody) {
            assuranceBody.textContent = data.body;
        }

        if (assuranceChips) {
            assuranceChips.innerHTML = data.chips
                .map((chip) => `<span class="starter-package-chip">${chip}</span>`)
                .join('');
        }
    }

    function setIntakeStatus(message, type) {
        if (!intakeStatus) {
            return;
        }

        if (!message) {
            intakeStatus.className = 'starter-package-intake-status';
            intakeStatus.innerHTML = '';
            return;
        }

        intakeStatus.className = `starter-package-intake-status is-visible is-${type || 'error'}`;
        intakeStatus.innerHTML = message;
    }

    function setIntakeSubmitting(isSubmitting) {
        if (!intakeSubmitButton || !intakeSubmitText || !intakeSubmitLoading) {
            return;
        }

        intakeSubmitButton.disabled = isSubmitting;
        intakeSubmitText.style.display = isSubmitting ? 'none' : 'block';
        intakeSubmitLoading.style.display = isSubmitting ? 'block' : 'none';
    }

    function setFollowupStatus(message, type) {
        if (!followupStatus) {
            return;
        }

        if (!message) {
            followupStatus.className = 'starter-package-followup-status';
            followupStatus.innerHTML = '';
            return;
        }

        followupStatus.className = `starter-package-followup-status is-visible is-${type || 'error'}`;
        followupStatus.innerHTML = message;
    }

    function setFollowupSubmitting(isSubmitting) {
        if (!followupSubmitButton || !followupSubmitText || !followupSubmitLoading) {
            return;
        }

        followupSubmitButton.disabled = isSubmitting;
        followupSubmitText.style.display = isSubmitting ? 'none' : 'block';
        followupSubmitLoading.style.display = isSubmitting ? 'block' : 'none';
    }

    function getSelectedPaymentOption() {
        if (!intakeForm) {
            return 'full';
        }

        const selected = intakeForm.querySelector('input[name="paymentOption"]:checked');
        return selected ? selected.value : 'full';
    }

    function getSelectedPaymentLabel(packageConfig) {
        if (!Array.isArray(packageConfig.paymentOptions) || packageConfig.paymentOptions.length === 0) {
            return packageConfig.price;
        }

        const selected = getSelectedPaymentOption();
        const selectedConfig = packageConfig.paymentOptions.find((option) => option.value === selected);
        return selectedConfig ? selectedConfig.label : packageConfig.price;
    }

    function updateCheckoutSummary(packageConfig) {
        const selectedPayment = getSelectedPaymentOption();
        const selectedPaymentConfig = Array.isArray(packageConfig.paymentOptions)
            ? packageConfig.paymentOptions.find((option) => option.value === selectedPayment)
            : null;

        if (configuratorLabel) {
            configuratorLabel.textContent = Array.isArray(packageConfig.paymentOptions) && packageConfig.paymentOptions.length > 0
                ? 'Checkout Path'
                : packageConfig.family === 'monthly' || packageConfig.family === 'ops'
                    ? 'Subscription Path'
                    : 'Secure Checkout';
        }

        if (configuratorTitle) {
            configuratorTitle.textContent = packageConfig.name;
        }

        if (configuratorPrice) {
            configuratorPrice.textContent = selectedPaymentConfig
                ? selectedPaymentConfig.label.replace(/^.*?-\s*/, '')
                : packageConfig.price;
        }

        if (configuratorCopy) {
            configuratorCopy.textContent = selectedPaymentConfig && selectedPayment === 'deposit'
                ? selectedPaymentConfig.help
                : packageConfig.family === 'ops'
                    ? (packageConfig.growthScoped
                        ? 'Pricing begins at the published setup and monthly base. A consultation confirms the exact Systems-only or Website + Systems scope before any payment or subscription is created.'
                        : 'This checkout includes the setup fee today and starts the monthly support subscription in Stripe.')
                : packageConfig.family === 'monthly'
                    ? 'This starter form confirms the property and main priority before recurring Stripe checkout starts.'
                    : 'This starter form is just enough to get the project moving cleanly before secure Stripe checkout.';
        }

        if (configuratorMeta) {
            configuratorMeta.textContent = packageConfig.family === 'ops'
                ? (packageConfig.growthScoped
                    ? 'Variables: (1) Systems-only or Website + Systems with a named Local/Authority-equivalent website scope, (2) Website Audit depth, (3) systems complexity, (4) monthly ownership tier, and (5) selling or invoicing needs. Max or Authority Network depth is scoped separately.'
                    : 'CRM and automation systems are not one-and-done. The monthly portion covers upkeep, small adjustments, monitoring, and support after setup.')
                : packageConfig.family === 'monthly'
                ? 'You can attach starter files now, but the main thing we need is the site or profile you want maintained.'
                : hasDepositOption(packageConfig)
                    ? 'If you choose a deposit, it is applied to the project total. You will still get a post-payment handoff for more files and references.'
                    : 'Starter files can be attached now, and larger folders, videos, or raw media can be sent by share link now or after payment.';
        }

        if (intakeSubmitText) {
            intakeSubmitText.textContent = packageConfig.consultOnly
                ? 'Continue to Scope Consultation'
                : selectedPaymentConfig
                ? `Continue to Checkout - ${selectedPaymentConfig.label.replace(/^.*?-\s*/, '')}`
                : packageConfig.family === 'monthly' || packageConfig.family === 'ops'
                    ? `Continue to Subscription Checkout - ${packageConfig.price}`
                    : `Continue to Checkout - ${packageConfig.price}`;
        }
    }

    function bindDynamicFieldBehavior(packageConfig) {
        const existingPresenceCheckbox = intakeForm ? intakeForm.querySelector('#starterPackageHasPresence, #starterPackageMonthlyHasPresence') : null;
        const existingPresenceFields = intakeForm ? intakeForm.querySelector('#starterPackagePresenceFields, #starterPackageMonthlyPresenceFields') : null;
        const paymentInputs = intakeForm ? Array.from(intakeForm.querySelectorAll('input[name="paymentOption"]')) : [];
        const systemsScopeInput = intakeForm ? intakeForm.querySelector('#starterPackageSystemsScope') : null;
        const maintenanceDepthInput = intakeForm ? intakeForm.querySelector('#starterPackageMaintenanceDepth') : null;
        const auditDepthInput = intakeForm ? intakeForm.querySelector('#starterPackageAuditDepth') : null;

        if (existingPresenceCheckbox && existingPresenceFields) {
            const toggleExistingPresence = function () {
                existingPresenceFields.hidden = !existingPresenceCheckbox.checked;
            };

            existingPresenceCheckbox.addEventListener('change', toggleExistingPresence);
            toggleExistingPresence();
        }

        paymentInputs.forEach((input) => {
            input.addEventListener('change', function () {
                updateCheckoutSummary(getPackageDetails(activePackageKey) || packageConfig);
            });
        });

        if (systemsScopeInput && maintenanceDepthInput) {
            const syncGrowthScope = function () {
                applyGrowthScopeSelection();
            };

            systemsScopeInput.addEventListener('change', syncGrowthScope);
            maintenanceDepthInput.addEventListener('change', syncGrowthScope);
            if (auditDepthInput) {
                auditDepthInput.addEventListener('change', syncGrowthScope);
            }

            if (activePackageKey === 'ops-full-growth-system') {
                systemsScopeInput.value = 'full-stack';
                maintenanceDepthInput.value = 'pro';
                if (auditDepthInput) {
                    auditDepthInput.value = 'audit-full';
                }
            } else if (activePackageKey === 'ops-custom-automation-system') {
                systemsScopeInput.value = 'custom';
                maintenanceDepthInput.value = 'management';
                if (auditDepthInput) {
                    auditDepthInput.value = 'audit-maintained';
                }
            } else {
                systemsScopeInput.value = 'site-ops';
                maintenanceDepthInput.value = 'standard';
                if (auditDepthInput) {
                    auditDepthInput.value = 'audit-limited';
                }
            }

            syncGrowthScope();
        }
    }

    function saveCheckoutDraft(packageKey) {
        if (!window.sessionStorage) {
            return;
        }

        try {
            window.sessionStorage.setItem(checkoutDraftStorageKey, JSON.stringify({
                packageKey,
                businessName: businessNameInput ? businessNameInput.value.trim() : '',
                contactName: contactNameInput ? contactNameInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                scrollY: Math.round(window.scrollY || window.pageYOffset || 0)
            }));
        } catch (error) {
            console.warn('Unable to save checkout draft.', error);
        }
    }

    function getCheckoutDraft() {
        if (!window.sessionStorage) {
            return null;
        }

        try {
            const raw = window.sessionStorage.getItem(checkoutDraftStorageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('Unable to read checkout draft.', error);
            return null;
        }
    }

    function populateDraft(packageKey) {
        const draft = getCheckoutDraft();

        if (!draft || draft.packageKey !== packageKey) {
            return;
        }

        if (businessNameInput) {
            businessNameInput.value = draft.businessName || '';
        }

        if (contactNameInput) {
            contactNameInput.value = draft.contactName || '';
        }

        if (emailInput) {
            emailInput.value = draft.email || '';
        }

        if (phoneInput) {
            phoneInput.value = draft.phone || '';
        }
    }

    function restoreCheckoutScrollPosition() {
        const draft = getCheckoutDraft();

        if (!draft || !Number.isFinite(draft.scrollY)) {
            return;
        }

        window.scrollTo({ top: Math.max(0, draft.scrollY), behavior: 'auto' });
    }

    function serializeFormFields(formElement) {
        const payload = {};
        const formData = new FormData(formElement);

        formData.forEach((value, key) => {
            if (value instanceof File) {
                return;
            }

            if (typeof value === 'string' && value.trim() === '') {
                return;
            }

            payload[key] = value;
        });

        return payload;
    }

    function serializeFormForCheckout(formElement, options) {
        const config = options || {};
        const payload = serializeFormFields(formElement);

        if (payload.referralPartnerManual) {
            payload.referralPartner = payload.referralPartnerManual;
            payload.kl_ref = payload.referralPartnerManual;
        } else if (!payload.referralPartner && payload.kl_ref) {
            payload.referralPartner = payload.kl_ref;
        }
        delete payload.referralPartnerManual;

        payload.intakeUploadCompleted = Boolean(config.intakeUploadCompleted);
        payload.returnPath = window.location.pathname || '/pricing';
        return payload;
    }

    async function uploadPackageForm(payload, options) {
        const config = options || {};
        const requestHeaders = {
            Accept: 'application/json'
        };
        const requestBody = config.asJson ? JSON.stringify(payload) : payload;

        if (config.asJson) {
            requestHeaders['Content-Type'] = 'application/json';
        }

        const response = await fetch(getUploadEndpoint(), {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody
        });

        const responsePayload = await response.json().catch(function () {
            return {};
        });

        if (!response.ok) {
            throw new Error(responsePayload.error || 'We could not send the package files right now.');
        }

        return responsePayload;
    }

    function openIntake(packageKey, triggerElement) {
        if (!intakeOverlay || !intakeForm || !dynamicFields) {
            return;
        }

        const packageConfig = getPackageDetails(packageKey);

        if (packageConfig.checkoutEnabled === false || packageConfig.deprecated === true) {
            window.location.href = '/contact?reason=scope&package=' + encodeURIComponent(packageKey);
            return;
        }

        activePackageKey = packageKey;
        lastTrigger = triggerElement || null;

        intakeForm.reset();
        setIntakeStatus('');

        if (intakePackageKeyInput) {
            intakePackageKeyInput.value = packageKey;
        }

        if (intakePackageNameInput) {
            intakePackageNameInput.value = packageConfig.name;
        }

        if (intakePackagePriceInput) {
            intakePackagePriceInput.value = packageConfig.price;
        }

        if (intakePackageLabel) {
            intakePackageLabel.textContent = `${packageConfig.name} - ${packageConfig.price}`;
        }

        renderAssurance(packageConfig);
        dynamicFields.innerHTML = renderDynamicFields(packageConfig);
        updateCheckoutSummary(packageConfig);
        bindDynamicFieldBehavior(packageConfig);
        ensureReferralPartnersLoaded();
        populateDraft(packageKey);
        updateFileList(fileList, logoFileInput, referenceFilesInput);

        if (intakeHelper) {
            intakeHelper.innerHTML = 'Keep each file under 2 MB and total uploads under 4 MB. Small media and document files are fine here. For larger folders, videos, or raw media, use a share link now. You will also get a post-payment handoff for anything else.';
        }

        intakeOverlay.classList.add('is-visible');
        intakeOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('package-intake-open');

        window.requestAnimationFrame(function () {
            if (businessNameInput) {
                businessNameInput.focus();
            } else if (intakeDialog) {
                intakeDialog.focus();
            }
        });
    }

    function closeIntake(forceClose) {
        if (!intakeOverlay || !intakeOverlay.classList.contains('is-visible') || (!forceClose && intakeSubmitButton && intakeSubmitButton.disabled)) {
            return;
        }

        intakeOverlay.classList.remove('is-visible');
        intakeOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('package-intake-open');
        setIntakeStatus('');

        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
    }

    function syncModalState() {
        const hasOpenModal = Boolean(
            (successOverlay && successOverlay.classList.contains('is-visible')) ||
            (followupOverlay && followupOverlay.classList.contains('is-visible'))
        );

        document.body.classList.toggle('starter-package-modal-open', hasOpenModal);
    }

    function openSuccessOverlay(packageKey) {
        if (!successOverlay) {
            return;
        }

        const packageConfig = getPackageDetails(packageKey);
        activePurchaseReturnPackageKey = packageKey;

        if (successPackageLabel) {
            successPackageLabel.textContent = `${packageConfig.name} - ${packageConfig.price}`;
        }

        if (successCopy) {
            successCopy.textContent = `Payment for ${packageConfig.name} was received successfully. Click OK to continue to the final handoff for any remaining files, links, or notes.`;
        }

        successOverlay.classList.add('is-visible');
        successOverlay.setAttribute('aria-hidden', 'false');
        syncModalState();

        window.requestAnimationFrame(function () {
            if (successConfirmButton) {
                successConfirmButton.focus();
            } else if (successDialog) {
                successDialog.focus();
            }
        });
    }

    function closeSuccessOverlay() {
        if (!successOverlay || !successOverlay.classList.contains('is-visible')) {
            return;
        }

        successOverlay.classList.remove('is-visible');
        successOverlay.setAttribute('aria-hidden', 'true');
        syncModalState();
    }

    function openFollowupOverlay(packageKey) {
        if (!followupOverlay || !followupForm) {
            return;
        }

        const packageConfig = getPackageDetails(packageKey);
        const draft = getCheckoutDraft();

        followupForm.reset();
        setFollowupStatus('');

        if (followupPackageLabel) {
            followupPackageLabel.textContent = `${packageConfig.name} - ${packageConfig.price}`;
        }

        if (followupPackageKeyInput) {
            followupPackageKeyInput.value = packageKey;
        }

        if (followupPackageNameInput) {
            followupPackageNameInput.value = packageConfig.name;
        }

        if (followupPackagePriceInput) {
            followupPackagePriceInput.value = packageConfig.price;
        }

        if (followupSubmissionStageInput) {
            followupSubmissionStageInput.value = 'followup';
        }

        if (followupSubmissionTypeInput) {
            followupSubmissionTypeInput.value = 'starter-package-post-payment-handoff';
        }

        if (followupSubjectInput) {
            followupSubjectInput.value = `Starter Package Handoff: ${packageConfig.name}`;
        }

        if (draft && (!draft.packageKey || draft.packageKey === packageKey)) {
            if (followupBusinessNameInput) {
                followupBusinessNameInput.value = draft.businessName || '';
            }
            if (followupContactNameInput) {
                followupContactNameInput.value = draft.contactName || '';
            }
            if (followupEmailInput) {
                followupEmailInput.value = draft.email || '';
            }
        }

        updateFileList(followupFileList, followupLogoFileInput, followupAttachmentsInput);

        followupOverlay.classList.add('is-visible');
        followupOverlay.setAttribute('aria-hidden', 'false');
        syncModalState();

        window.requestAnimationFrame(function () {
            if (followupContactNameInput) {
                followupContactNameInput.focus();
            } else if (followupDialog) {
                followupDialog.focus();
            }
        });
    }

    function closeFollowupOverlay(forceClose) {
        if (!followupOverlay || !followupOverlay.classList.contains('is-visible') || (!forceClose && followupSubmitButton && followupSubmitButton.disabled)) {
            return;
        }

        followupOverlay.classList.remove('is-visible');
        followupOverlay.setAttribute('aria-hidden', 'true');
        syncModalState();
    }

    function proceedToFollowupOverlay() {
        const packageKey = activePurchaseReturnPackageKey || (followupPackageKeyInput ? followupPackageKeyInput.value : activePackageKey);
        closeSuccessOverlay();
        openFollowupOverlay(packageKey);
    }

    async function submitPackageIntake() {
        if (!intakeForm) {
            return;
        }

        const packageConfig = getPackageDetails(activePackageKey);
        const hasPrecheckoutFiles = Boolean(
            (logoFileInput && logoFileInput.files && logoFileInput.files.length) ||
            (referenceFilesInput && referenceFilesInput.files && referenceFilesInput.files.length)
        );
        const fileValidationMessage = hasPrecheckoutFiles
            ? validateSelectedFiles(logoFileInput, referenceFilesInput)
            : '';

        if (!intakeForm.reportValidity()) {
            return;
        }

        if (fileValidationMessage) {
            setIntakeStatus(fileValidationMessage, 'error');
            return;
        }

        const uploadFormData = new FormData(intakeForm);
        uploadFormData.set('submissionStage', 'precheckout');
        uploadFormData.set('submissionType', 'starter-package-precheckout-intake');
        uploadFormData.set('packageName', packageConfig.name);
        uploadFormData.set('packagePrice', packageConfig.price);
        uploadFormData.set('_replyto', emailInput ? emailInput.value.trim() : '');
        uploadFormData.set('_subject', `Starter Package Intake: ${packageConfig.name}`);
        uploadFormData.set('serviceType', `Starter Package Checkout - ${packageConfig.name}`);
        uploadFormData.set('budget', getSelectedPaymentLabel(packageConfig));
        uploadFormData.set('timeline', 'Submitted from pricing starter form');

        setIntakeSubmitting(true);
        setIntakeStatus('');

        try {
            let intakeUploadCompleted = false;

            if (hasPrecheckoutFiles) {
                await uploadPackageForm(uploadFormData);
                intakeUploadCompleted = true;
            }

            const checkoutPayload = serializeFormForCheckout(intakeForm, {
                intakeUploadCompleted
            });
            const response = await fetch(getCheckoutEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutPayload)
            });
            const payload = await response.json().catch(function () {
                return {};
            });

            if (!response.ok || !payload.url) {
                const error = new Error(payload.error || 'Unable to start checkout right now.');
                throw error;
            }

            saveCheckoutDraft(activePackageKey);
            window.location.href = payload.url;
        } catch (error) {
            console.error('Pricing package checkout error:', error);
            setIntakeStatus(
                `${error.message || 'We could not start checkout right now.'} If needed, email <a href="mailto:${intakeSupportEmail}">${intakeSupportEmail}</a> with a share link and we will help you manually.`,
                'error'
            );
        } finally {
            setIntakeSubmitting(false);
        }
    }

    async function submitFollowup() {
        if (!followupForm) {
            return;
        }

        const fileValidationMessage = validateSelectedFiles(followupLogoFileInput, followupAttachmentsInput);

        if (!followupForm.reportValidity()) {
            return;
        }

        if (fileValidationMessage) {
            setFollowupStatus(fileValidationMessage, 'error');
            return;
        }

        const hasDetails = Boolean(followupDetailsInput && followupDetailsInput.value.trim());
        const hasShareLink = Boolean(followupAssetLinkInput && followupAssetLinkInput.value.trim());
        const hasFiles = Boolean(
            (followupLogoFileInput && followupLogoFileInput.files && followupLogoFileInput.files.length) ||
            (followupAttachmentsInput && followupAttachmentsInput.files && followupAttachmentsInput.files.length)
        );

        if (!hasDetails && !hasShareLink && !hasFiles) {
            setFollowupStatus('Add notes, a share link, or at least one file before sending the handoff.', 'error');
            return;
        }

        const uploadFormData = new FormData(followupForm);
        uploadFormData.set('submissionStage', 'followup');
        uploadFormData.set('submissionType', 'starter-package-post-payment-handoff');
        uploadFormData.set('_replyto', followupEmailInput ? followupEmailInput.value.trim() : '');

        setFollowupSubmitting(true);
        setFollowupStatus('');

        try {
            if (hasFiles) {
                await uploadPackageForm(uploadFormData);
            } else {
                const followupPayload = serializeFormFields(followupForm);
                await uploadPackageForm(followupPayload, { asJson: true });
            }
            setFollowupStatus(`Your additional files and notes for ${followupPackageNameInput ? followupPackageNameInput.value : 'this package'} were sent. If you still need to share a large folder or video, email <a href="mailto:${intakeSupportEmail}">${intakeSupportEmail}</a> with the link.`, 'success');
            updateFileList(followupFileList, followupLogoFileInput, followupAttachmentsInput);
        } catch (error) {
            console.error('Pricing package follow-up error:', error);
            setFollowupStatus(
                `${error.message || 'We could not send the handoff right now.'} You can still email <a href="mailto:${intakeSupportEmail}">${intakeSupportEmail}</a> with a share link.`,
                'error'
            );
        } finally {
            setFollowupSubmitting(false);
        }
    }

    function schedulePurchaseReturnExperience(packageKey) {
        const run = function () {
            restoreCheckoutScrollPosition();
            window.setTimeout(function () {
                openSuccessOverlay(packageKey);
            }, 150);
        };

        if (document.readyState === 'complete') {
            run();
            return;
        }

        window.addEventListener('load', run, { once: true });
    }

    function scheduleCheckoutCancelled(packageKey) {
        const run = function () {
            restoreCheckoutScrollPosition();
            openIntake(packageKey, null);
            setIntakeStatus('Checkout was cancelled. Your starter details were kept locally in this browser so you can pick up where you left off.', 'warning');
        };

        if (document.readyState === 'complete') {
            run();
            return;
        }

        window.addEventListener('load', run, { once: true });
    }

    pricingCtas.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const packageKey = getPackageKeyFromTrigger(link);

            if (!packageKey || !packageCatalog[packageKey]) {
                return;
            }

            openIntake(packageKey, link);
        });
    });

    if (logoFileInput) {
        logoFileInput.addEventListener('change', function () {
            updateFileList(fileList, logoFileInput, referenceFilesInput);
        });
    }

    if (referenceFilesInput) {
        referenceFilesInput.addEventListener('change', function () {
            updateFileList(fileList, logoFileInput, referenceFilesInput);
        });
    }

    if (followupLogoFileInput) {
        followupLogoFileInput.addEventListener('change', function () {
            updateFileList(followupFileList, followupLogoFileInput, followupAttachmentsInput);
        });
    }

    if (followupAttachmentsInput) {
        followupAttachmentsInput.addEventListener('change', function () {
            updateFileList(followupFileList, followupLogoFileInput, followupAttachmentsInput);
        });
    }

    if (intakeForm) {
        intakeForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitPackageIntake();
        });
    }

    if (followupForm) {
        followupForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitFollowup();
        });
    }

    if (intakeCloseButton) {
        intakeCloseButton.addEventListener('click', function () {
            closeIntake();
        });
    }

    if (intakeCancelButton) {
        intakeCancelButton.addEventListener('click', function () {
            closeIntake();
        });
    }

    if (intakeOverlay) {
        intakeOverlay.addEventListener('click', function (event) {
            if (event.target === intakeOverlay) {
                closeIntake();
            }
        });
    }

    if (successConfirmButton) {
        successConfirmButton.addEventListener('click', proceedToFollowupOverlay);
    }

    if (successCloseButton) {
        successCloseButton.addEventListener('click', proceedToFollowupOverlay);
    }

    if (successOverlay) {
        successOverlay.addEventListener('click', function (event) {
            if (event.target === successOverlay) {
                proceedToFollowupOverlay();
            }
        });
    }

    if (followupCloseButton) {
        followupCloseButton.addEventListener('click', function () {
            closeFollowupOverlay();
        });
    }

    if (followupOverlay) {
        followupOverlay.addEventListener('click', function (event) {
            if (event.target === followupOverlay) {
                closeFollowupOverlay();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
            return;
        }

        if (successOverlay && successOverlay.classList.contains('is-visible')) {
            proceedToFollowupOverlay();
            return;
        }

        if (followupOverlay && followupOverlay.classList.contains('is-visible')) {
            closeFollowupOverlay();
            return;
        }

        closeIntake();
    });

    const params = new URLSearchParams(window.location.search);
    const hashPackageKey = (window.location.hash || '').replace(/^#/, '').trim();
    const openPackageKey = params.get('openPackage') || (hashPackageKey && packageCatalog[hashPackageKey] ? hashPackageKey : '');
    const purchaseState = params.get('purchase');
    const returnPackageKey = params.get('package');

    if (openPackageKey && packageCatalog[openPackageKey]) {
        openIntake(openPackageKey, null);

        if (window.history && typeof window.history.replaceState === 'function') {
            params.delete('openPackage');
            const nextSearch = params.toString();
            const nextHash = hashPackageKey === openPackageKey ? '' : (window.location.hash || '');
            const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${nextHash}`;
            window.history.replaceState({}, document.title, nextUrl);
        }
    }

    if (purchaseState === 'success' && returnPackageKey && packageCatalog[returnPackageKey]) {
        schedulePurchaseReturnExperience(returnPackageKey);
    }

    if (purchaseState === 'cancelled' && returnPackageKey && packageCatalog[returnPackageKey]) {
        scheduleCheckoutCancelled(returnPackageKey);
    }
    window.__pricingPackageCheckoutReady = true;
    } catch (error) {
        console.error('Pricing package checkout script failed:', error);
        window.__pricingPackageCheckoutError = error && error.message ? error.message : String(error);
    }
})();
