// Loading Screen and Initial Setup
// Global variables for landing mode
let isInLandingMode = false;
let exitLandingMode = null;
let suppressLandingReentry = false; // Prevent immediate hero re-entry after nav clicks
let anchorNavigationInitialized = false;

// Keep verbose landing logs disabled in production to reduce main-thread work on mobile.
const DEBUG_LANDING = false;

// KL Lead push notifications — fires to ntfy.sh desktop/browser on every successful form submission
// Subscribe at: https://ntfy.sh/kl-leads-9r4x  (or ntfy desktop app → add topic kl-leads-9r4x)
var KL_NTFY_TOPIC = 'kl-leads-9r4x';
function klNotifyLead(title, body) {
    try {
        fetch('https://ntfy.sh/' + KL_NTFY_TOPIC, {
            method: 'POST',
            headers: { 'Title': title, 'Priority': 'high', 'Tags': 'bell' },
            body: String(body)
        }).catch(function() {});
    } catch (e) {}
}

function landingLog(...args) {
    if (DEBUG_LANDING) {
        console.log(...args);
    }
}

function scheduleNonCriticalInit(fn, delay = 0) {
    const run = () => {
        try {
            fn();
        } catch (error) {
            console.warn('Deferred init failed:', error);
        }
    };

    const enqueue = () => {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(run, { timeout: 1500 });
        } else {
            setTimeout(run, 0);
        }
    };

    if (delay > 0) {
        setTimeout(enqueue, delay);
    } else {
        enqueue();
    }
}

function setLandingViewportHeight() {
    if (window.CSS && typeof window.CSS.supports === 'function' && window.CSS.supports('height', '100svh')) {
        return;
    }

    document.documentElement.style.setProperty('--landing-viewport-height', `${window.innerHeight}px`);
}

function resolveAnchorHash(href) {
    if (!href || href === '#') return null;

    const isSamePageHash = href.startsWith('#');
    const isIndexHash = /(^|\/)index\.html#/.test(href);
    const isRootHash = /^\/#[^\s]+$/.test(href);
    const onIndexPage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/';

    if (isSamePageHash) return href;
    if ((isIndexHash || isRootHash) && onIndexPage) return href.substring(href.indexOf('#'));
    return null;
}

function findAnchorTarget(hash) {
    const aliasMap = {
        '#featured-projects': '#work'
    };
    const normHash = hash.toLowerCase();

    return document.querySelector(hash)
        || document.querySelector(`[id="${normHash.replace('#', '')}"]`)
        || (aliasMap[normHash] ? document.querySelector(aliasMap[normHash]) : null);
}

function scrollToHashTarget(hash, target) {
    const scrollWithOffset = () => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const navbar = document.querySelector('.navbar');
        const offset = navbar ? navbar.offsetHeight : 0;
        if (offset) {
            setTimeout(() => { window.scrollBy(0, -offset); }, 250);
        }
        history.pushState(null, null, hash);
    };

    if (isInLandingMode && typeof exitLandingMode === 'function') {
        suppressLandingReentry = true;
        exitLandingMode();
        setTimeout(() => {
            scrollWithOffset();
            setTimeout(() => { suppressLandingReentry = false; }, 1000);
        }, 900);
    } else {
        scrollWithOffset();
    }
}

function initAnchorNavigation() {
    if (anchorNavigationInitialized) return;
    anchorNavigationInitialized = true;

    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href*="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        const hash = resolveAnchorHash(href);
        if (!hash) return;

        const target = findAnchorTarget(hash);
        if (!target) return;

        e.preventDefault();
        scrollToHashTarget(hash, target);
    });
}

// Dynamic Header and Footer Loading — parallel fetches to minimise round-trips
async function loadSocialIcons() {
    const targets = document.querySelectorAll('[data-kl-social-icons]');
    if (!targets.length) {
        return;
    }

    try {
        const res = await fetch(new URL('/partials/kl-social-icons.html?v=20260625social1', window.location.origin), { cache: 'default' });
        if (!res.ok) {
            console.warn('Social icons partial could not be loaded.');
            return;
        }

        const markup = await res.text();
        targets.forEach((target) => {
            if (!target.innerHTML.trim()) {
                target.innerHTML = markup;
            }
        });
    } catch (error) {
        console.warn('Social icons partial fetch failed:', error);
    }
}

const HEADER_FOOTER_VER = '20260727nav1';

async function loadHeaderFooter() {
    try {
        const tryFetch = async (urls) => {
            for (const url of urls) {
                try {
                    const res = await fetch(url, { cache: 'default' });
                    if (res.ok) {
                        return await res.text();
                    }
                } catch (err) {
                    console.warn('Partial fetch error for', url.toString(), err);
                }
            }
            return null;
        };

        const headerCandidates = [
            new URL(`/header.html?v=${HEADER_FOOTER_VER}`, window.location.origin),
            new URL('/header', window.location.origin)
        ];
        const footerCandidates = [
            new URL(`/footer.html?v=${HEADER_FOOTER_VER}`, window.location.origin),
            new URL('/footer', window.location.origin)
        ];

        const [headerContent, footerContent] = await Promise.all([
            tryFetch(headerCandidates),
            tryFetch(footerCandidates)
        ]);

        const headerContainer = document.getElementById('header-container');
        if (headerContainer && headerContent) {
            headerContainer.innerHTML = headerContent;
        } else if (headerContainer) {
            console.warn('Header partial could not be loaded from known routes.');
        }

        const footerContainer = document.getElementById('footer-container');
        if (footerContainer && footerContent) {
            footerContainer.innerHTML = footerContent;
        } else if (footerContainer) {
            console.warn('Footer partial could not be loaded from known routes.');
        }
    } catch (error) {
        console.error('Error loading header/footer:', error);
    }
}

// Load header and footer on page load, then initialize everything
document.addEventListener('DOMContentLoaded', function() {
    setLandingViewportHeight();
    window.addEventListener('resize', setLandingViewportHeight, { passive: true });
    window.addEventListener('orientationchange', setLandingViewportHeight);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', setLandingViewportHeight, { passive: true });
    }

    initAnchorNavigation();

    // Fetch header/footer in parallel — initNavigation runs when ready, doesn't block paint
    loadHeaderFooter().then(() => {
        loadSocialIcons();
        initNavigation();
        setupIntersectionObserver();
        // Defer Tidio until first real user interaction so Lighthouse's sandbox
        // never triggers the WebSocket connect (fixes Best Practices console errors).
        initSiteChatWidgetOnInteraction();
    });

    // Keep only above-the-fold essentials immediate.
    initLayeredParallax();
    initLocalTrustParallax();
    initProofCardVideos();
    initHeroEntranceAnimations();
    initSubpageStarsHeroes();
    initCityLandingFormSidebar();
    initProofAboutEntrance();
    initServicesEntrance();
    initShowcaseCardReveal();
    initMobileReadMore();

    // Push non-critical effects after first paint / idle time.
    scheduleNonCriticalInit(initScrollEffects, 120);
    scheduleNonCriticalInit(initAnimations, 120);
    scheduleNonCriticalInit(initProjectFilters, 220);
    scheduleNonCriticalInit(initVideoPlayer, 220);
    scheduleNonCriticalInit(initGoogleReviewsCarousel, 240);
    scheduleNonCriticalInit(initGbpDynamicRatings, 260);
    scheduleNonCriticalInit(initSkillBars, 280);
    scheduleNonCriticalInit(initCaseStudyLightbox, 280);
    scheduleNonCriticalInit(initPricingStickyNav, 300);
    scheduleNonCriticalInit(initServiceSidebarForms, 320);
    scheduleNonCriticalInit(initPageFeatureScripts, 340);
    scheduleNonCriticalInit(initAdvancedParallax, 380);
    scheduleNonCriticalInit(initMagneticButtons, 450);
    scheduleNonCriticalInit(initCursorTrail, 550);
    
    // Dismiss loading screen — header/footer parallel fetch is usually done well before this
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            scheduleNonCriticalInit(initMainAnimations);
        }, 120);
    } else {
        scheduleNonCriticalInit(initMainAnimations, 120);
    }
});

// Fixed Hero Landing Screen with Code Forest Exit Effect
function initLayeredParallax() {
    const heroSection = document.querySelector('#hero');
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const codeForest = document.querySelector('.parallax-bg-near');
    const cityBg = document.querySelector('.hero-parallax-layer, #hero .parallax-bg-far, .parallax-bg-far');
    const grungeLayer = document.querySelector('.parallax-bg-mid');
    
    // Debug element selection
    landingLog('🔍 Element selection:');
    landingLog('🌲 codeForest (.parallax-bg-near):', codeForest);
    landingLog('🏙️ cityBg (.parallax-bg-far):', cityBg);
    landingLog('🌫️ grungeLayer (.parallax-bg-mid):', grungeLayer);
    
    if (!heroSection) {
        landingLog('Hero section not found');
        return;
    }
    
    // Separate narrow desktop windows from actual handheld/touch devices.
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isHandheldTouchDevice = mobileUserAgent || (hasCoarsePointer && navigator.maxTouchPoints > 0);
    const isMobile = isMobileViewport || mobileUserAgent;
    landingLog('📱 Mobile detection: width=', window.innerWidth, 'isMobile=', isMobile, 'isHandheldTouchDevice=', isHandheldTouchDevice, 'userAgent=', navigator.userAgent);
    
    // Check if user navigated to a specific section (has hash in URL)
    const hasHash = window.location.hash && window.location.hash.length > 1;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function applyStaticHeroLayout() {
        if (!heroSection) return;

        heroSection.style.position = 'relative';
        heroSection.style.top = 'auto';
        heroSection.style.left = 'auto';
        heroSection.style.width = '100%';
        heroSection.style.height = 'var(--landing-viewport-height, 100vh)';
        heroSection.style.minHeight = '100svh';
        heroSection.style.display = 'flex';
        heroSection.style.alignItems = 'center';
        heroSection.style.justifyContent = 'center';
        heroSection.style.overflow = 'hidden';
        heroSection.style.zIndex = '1';
        heroSection.style.pointerEvents = 'auto';
        heroSection.style.opacity = '1';

        const heroNext = document.querySelector('.hero + section, .hero + .kl-proof-stack');
        if (heroNext) {
            heroNext.style.marginTop = '0';
        }
    }

    function hideLegacyHeroOverlay() {
        if (codeForest) {
            codeForest.style.display = 'none';
            codeForest.style.opacity = '0';
        }
        if (grungeLayer) {
            grungeLayer.style.display = 'none';
            grungeLayer.style.opacity = '0';
        }
        if (scrollIndicator) {
            scrollIndicator.style.display = 'none';
        }
    }

    function initHeroScrollParallax(farLayer) {
        if (!farLayer || !heroSection) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const mobileParallax = window.matchMedia('(max-width: 1024px)').matches;
        let ticking = false;

        const getHeroVar = (name, fallback) => {
            const raw = getComputedStyle(heroSection).getPropertyValue(name).trim();
            const parsed = parseFloat(raw);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const update = () => {
            ticking = false;
            const rect = heroSection.getBoundingClientRect();
            if (rect.bottom <= 0 || rect.top > window.innerHeight) return;

            const shift = Math.max(0, -rect.top);
            const rate = getHeroVar('--hero-parallax-rate', mobileParallax ? 0.55 : 0.45);

            farLayer.style.transform = `translate3d(0, ${shift * rate}px, 0)`;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
    }

    // Clean hero: normal scroll, no door lock, no CircuitBrush — photo parallax only.
    isInLandingMode = false;
    unlockLandingScroll();
    hideLegacyHeroOverlay();
    applyStaticHeroLayout();
    initHeroScrollParallax(cityBg);
    exitLandingMode = null;
    return;

    let scrollActionCount = 0;
    let lastScrollY = 0;
    let lastScrollPosition = 0; // Track scroll position for re-entry detection
    let scrollBarActionCount = 0; // Track scrollbar usage separately
    let lastScrollbarPosition = 0;
    let isScrollbarScrolling = false;
    const maxLandingScrolls = 3; // Stay on landing screen for 3 scroll actions
    let landingReentryTimeoutId = null;

    function suppressLandingReentryFor(duration = 1600) {
        suppressLandingReentry = true;

        if (landingReentryTimeoutId) {
            window.clearTimeout(landingReentryTimeoutId);
        }

        landingReentryTimeoutId = window.setTimeout(() => {
            suppressLandingReentry = false;
            lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            landingReentryTimeoutId = null;
        }, duration);
    }

    function lockLandingScroll() {
        document.body.classList.add('landing-mode');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
    }

    function unlockLandingScroll() {
        document.body.classList.remove('landing-mode');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
    }

    function applyLandingHeroLayout() {
        if (!heroSection) return;

        heroSection.style.position = 'fixed';
        heroSection.style.top = '0';
        heroSection.style.left = '0';
        heroSection.style.width = '100%';
        heroSection.style.height = 'var(--landing-viewport-height, 100vh)';
        heroSection.style.minHeight = '100svh';
        heroSection.style.display = 'flex';
        heroSection.style.alignItems = 'center';
        heroSection.style.justifyContent = 'center';
        heroSection.style.overflow = 'hidden';
        heroSection.style.zIndex = '1000';
        heroSection.style.pointerEvents = 'auto';
    }

    function applyStaticHeroLayout() {
        if (!heroSection) return;

        heroSection.style.position = 'relative';
        heroSection.style.top = 'auto';
        heroSection.style.left = 'auto';
        heroSection.style.width = '100%';
        heroSection.style.height = 'var(--landing-viewport-height, 100vh)';
        heroSection.style.minHeight = '100svh';
        heroSection.style.display = 'flex';
        heroSection.style.alignItems = 'center';
        heroSection.style.justifyContent = 'center';
        heroSection.style.overflow = 'hidden';
        heroSection.style.zIndex = '1';
        heroSection.style.pointerEvents = 'auto';
        heroSection.style.opacity = '1';

        const heroNext = document.querySelector('.hero + section, .hero + .kl-proof-stack');
        if (heroNext) {
            heroNext.style.marginTop = '0';
        }
    }

    function getForestBaseScale() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (viewportWidth <= 480) return 1.12;
        if (viewportWidth >= 1400 && viewportHeight <= 900) return 1.12;
        return 1.10;
    }

    codeForest.style.setProperty('transform', `translate3d(0, 0, 0) scale(${getForestBaseScale()})`, 'important');
    codeForest.style.setProperty('opacity', '0.9', 'important');
    
    // Prevent default scrolling during landing mode
    function preventScroll(e) {
        if (isInLandingMode) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    // Mobile touch handling for landing mode
    let touchStartY = 0;
    // Mobile now uses same scrollActionCount as desktop (no separate touchMoves needed)
    
    function handleTouchStart(e) {
        if (isInLandingMode) {
            touchStartY = e.touches[0].clientY;
        }
    }
    
    function handleTouchMove(e) {
        landingLog('📱 Touch move detected, isInLandingMode:', isInLandingMode);
        if (!isInLandingMode) return;
        
        if (e.deltaY < 0 && e.cancelable) {
            e.preventDefault();
        }
        e.stopPropagation();
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        landingLog('📱 Touch deltaY:', deltaY, 'Threshold check:', Math.abs(deltaY) > 20);
        
        // Simulate wheel events for mobile - use SAME logic as desktop
        if (Math.abs(deltaY) > 20) {
            landingLog('📱 Creating fake wheel event with deltaY:', deltaY > 0 ? 100 : -100);
            
            // Create fake wheel event and use same handler
            const fakeWheelEvent = {
                deltaY: deltaY > 0 ? 100 : -100, // Positive = down, negative = up
                preventDefault: () => {}
            };
            
            // Use the SAME wheel handler as desktop
            landingLog('📱 Calling handleWheelScroll with fake event');
            handleWheelScroll(fakeWheelEvent);
            
            touchStartY = touchY; // Reset for next move
        }
    }
    
    function handleWheelScroll(e) {
        if (!isInLandingMode) {
            const currentScroll = window.pageYOffset;
            const aboutSection = document.querySelector('#about');
            const aboutSectionTop = aboutSection ? aboutSection.offsetTop : 0;
            
            // Enhanced scroll-up detection for blank space and About section
            if (e.deltaY < 0) { // Scrolling up
                // Trigger if in the blank space above About or at the very top of About section
                if (!suppressLandingReentry && currentScroll <= aboutSectionTop + 200) { // Include blank space + top portion of About
                    e.preventDefault();
                    landingLog('🔄 Scroll up detected at position:', currentScroll, 'About section at:', aboutSectionTop);
                    enterLandingMode();
                    return;
                }
            }
            return;
        }
        
        // Count scroll actions (wheel events)
        if (e.deltaY > 0) { // Scrolling down
            scrollActionCount = Math.min(scrollActionCount + 1, maxLandingScrolls);
        } else { // Scrolling up
            scrollActionCount = Math.max(scrollActionCount - 1, 0);
        }
        
        updateForestEffect();
        
        // Exit landing mode after max scrolls
        if (scrollActionCount >= maxLandingScrolls) {
            exitLandingModeFunction();
        }
    }
    
    function updateForestEffect() {
        // Both mobile and desktop now use scrollActionCount since mobile calls handleWheelScroll
        const isMobile = window.innerWidth <= 768;
        const currentProgress = scrollActionCount / maxLandingScrolls; // Unified progress tracking
        const progress = Math.min(currentProgress, 1);
        
        landingLog(`🌲 updateForestEffect - Mobile: ${isMobile}, ScrollActions: ${scrollActionCount}/${maxLandingScrolls}, Progress: ${progress}`);
        
        if (codeForest) {
            // EXPAND the code forest - this creates the "exiting forest" illusion
            // As the image gets larger, less of the branches are visible in the frame
            const baseScale = getForestBaseScale();
            const maxScale = Math.max(baseScale + 1.55, 2.7);
            const scale = baseScale + (progress * (maxScale - baseScale));
            const opacity = Math.max(0.9 - (progress * 0.6), 0.1); // Gradually fade
            
            landingLog(`🌲 Forest transform: scale(${scale.toFixed(2)}), opacity: ${opacity.toFixed(2)}`);
            landingLog('🌲 Forest element:', codeForest);
            
            // Use 3D transform for better mobile performance and force hardware acceleration
            codeForest.style.setProperty('transform', `translate3d(0, 0, 0) scale(${scale})`, 'important');
            codeForest.style.setProperty('opacity', String(opacity), 'important');
            codeForest.style.willChange = 'transform, opacity';
            
            // Check if transform was applied
            landingLog('🌲 Applied transform result:', codeForest.style.transform);
        } else {
            landingLog('❌ codeForest element not found! Selector: .parallax-bg-near');
        }
        
        // City background stays COMPLETELY STATIC (never moves)
        if (cityBg) {
            const heroBackgroundPosition = window.innerWidth >= 1025 ? 'top center' : 'center center';
            cityBg.style.transform = 'none';
            cityBg.style.transformOrigin = 'center center';
            cityBg.style.backgroundPosition = heroBackgroundPosition;
            cityBg.style.backgroundSize = 'cover';
            cityBg.style.opacity = Math.min(0.8 + (progress * 0.3), 1);
        }
        
        // Grunge layer subtle effect
        if (grungeLayer) {
            grungeLayer.style.opacity = Math.max(0.2 - (progress * 0.1), 0.05);
        }
        
        // Keep title visible throughout the parallax sequence (don't fade until exit)
        if (heroTitle) {
            heroTitle.style.opacity = 1;
            heroTitle.style.transform = 'translateY(0px)';
        }
        if (heroSubtitle) {
            heroSubtitle.style.opacity = 1;
            heroSubtitle.style.transform = 'translateY(0px)';
        }
        
        // Keep CTA buttons visible throughout the parallax sequence
        const heroCTAButtons = document.querySelector('.hero-cta-buttons');
        if (heroCTAButtons) {
            heroCTAButtons.style.opacity = 1;
            heroCTAButtons.style.transform = 'translateY(0px)';
        }
        
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(1 - (progress * 1.5), 0);
        }
        
        landingLog(`Forest exit progress: ${(progress * 100).toFixed(1)}% (${scrollActionCount}/${maxLandingScrolls} scrolls)`);
    }
    
    function exitLandingModeFunction() {
        isInLandingMode = false;
        scrollActionCount = 0; // Reset for next time
        scrollBarActionCount = 0; // Reset scrollbar tracking
        lastScrollbarPosition = 0;
        isScrollbarScrolling = false;
        suppressLandingReentryFor();
        // Mobile now uses same scrollActionCount reset as desktop
        
        // Transition to About section (first content section)
        if (heroSection) {
            heroSection.style.transition = 'opacity 0.8s ease-out';
            heroSection.style.opacity = '0';
            
            setTimeout(() => {
                heroSection.style.display = 'none';
                heroSection.style.pointerEvents = 'none';
                unlockLandingScroll();
                
                // Remove the hero spacer margin so no black gap remains
                const heroNextSection = document.querySelector('.hero + section');
                if (heroNextSection) heroNextSection.style.marginTop = '0';
                
                // Scroll to About section (first after hero) with proper positioning
                const aboutSection = document.querySelector('.about') || document.querySelector('#about');
                if (aboutSection) {
                    requestAnimationFrame(() => {
                        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 80;
                        const offsetTop = aboutSection.offsetTop - navbarHeight + 30;
                        window.scrollTo({
                            top: Math.max(0, offsetTop),
                            behavior: 'smooth'
                        });
                    });
                }
                
                landingLog('Exited landing mode - scrolled to About section');
            }, 800);
        }
        
        // Remove scroll prevention but keep wheel listener for re-entry
        document.removeEventListener('touchmove', preventScroll, { passive: false });
        document.removeEventListener('keydown', preventKeyScroll);
    }
    
    // Assign to global variable for access from navigation
    exitLandingMode = exitLandingModeFunction;
    
    // Handle hash navigation - automatically exit landing mode and scroll to target
    if (hasHash) {
        landingLog('Hash detected in URL - auto-exiting landing mode and scrolling to:', window.location.hash);
        setTimeout(() => {
            if (isInLandingMode) {
                // Use a modified exit that doesn't auto-scroll to about
                isInLandingMode = false;
                scrollActionCount = 0;
                
                if (heroSection) {
                    heroSection.style.transition = 'opacity 0.8s ease-out';
                    heroSection.style.opacity = '0';
                    
                    setTimeout(() => {
                        heroSection.style.display = 'none';
                        heroSection.style.pointerEvents = 'none';
                        unlockLandingScroll();
                        
                        // Scroll to the hash target instead of about section
                        const targetSection = document.querySelector(window.location.hash);
                        if (targetSection) {
                            requestAnimationFrame(() => {
                                const offsetTop = targetSection.offsetTop - 100;
                                window.scrollTo({
                                    top: offsetTop,
                                    behavior: 'smooth'
                                });
                                landingLog('Scrolled to hash target:', window.location.hash);
                            });
                        }
                    }, 800);
                }
                
                // Remove scroll prevention
                document.removeEventListener('touchmove', preventScroll, { passive: false });
                document.removeEventListener('keydown', preventKeyScroll);
            }
        }, 1200); // Wait a bit longer for landing mode to be fully established
    }
    
    function preventKeyScroll(e) {
        if (!isInLandingMode) return;
        // Space (32), Page Down (34), Down Arrow (40), Enter (13) advance the parallax
        const advanceKeys = [13, 32, 34, 40];
        // Up Arrow (38), Page Up (33) reverse it; Home (36), End (35), Left/Right (37,39) block
        const blockKeys = [33, 35, 36, 37, 38, 39];
        if (advanceKeys.includes(e.keyCode)) {
            e.preventDefault();
            scrollActionCount = Math.min(scrollActionCount + 1, maxLandingScrolls);
            updateForestEffect();
            if (scrollActionCount >= maxLandingScrolls) exitLandingModeFunction();
            return false;
        }
        if (blockKeys.includes(e.keyCode)) {
            e.preventDefault();
            if (e.keyCode === 38 || e.keyCode === 33) { // Up / Page Up — reverse
                scrollActionCount = Math.max(scrollActionCount - 1, 0);
                updateForestEffect();
            }
            return false;
        }
    }
    
    function enterLandingMode() {
        scrollActionCount = 0;
        scrollBarActionCount = 0; // Reset scrollbar tracking
        lastScrollbarPosition = 0;
        isScrollbarScrolling = false;
        isInLandingMode = true;
        
        if (heroSection) {
            applyLandingHeroLayout();
            heroSection.style.opacity = '1';
            heroSection.style.transition = 'opacity 0.5s ease-in';
            lockLandingScroll();
            
            // Restore the hero spacer margin when re-entering landing mode
            const heroNextSection = document.querySelector('.hero + section');
            if (heroNextSection) heroNextSection.style.marginTop = '';
        }
        
        updateForestEffect();
        
        // Re-add scroll prevention
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('keydown', preventKeyScroll);
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        landingLog('Re-entered landing mode');
    }
    
    function handleScrollBarScroll() {
        if (!isInLandingMode) return;
        
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDelta = currentScrollTop - lastScrollbarPosition;
        const scrollRange = Math.max(1, window.innerHeight * 0.75);
        const nativeProgress = Math.min(Math.max(currentScrollTop / scrollRange, 0), 1);
        
        // Ignore tiny initial movements, but keep native wheel/scrollbar progress intact.
        if (Math.abs(scrollDelta) > 3 || currentScrollTop > 5) {
            landingLog('📜 Native scroll detected:', scrollDelta, 'Current position:', currentScrollTop, 'Progress:', nativeProgress);
            
            if (scrollDelta > 0 || nativeProgress > 0) {
                scrollBarActionCount = Math.max(scrollBarActionCount, Math.ceil(nativeProgress * maxLandingScrolls));
                scrollActionCount = Math.max(scrollActionCount, Math.min(scrollBarActionCount, maxLandingScrolls));
            } else if (scrollDelta < 0) {
                scrollBarActionCount = Math.max(scrollBarActionCount - 1, 0);
                scrollActionCount = Math.max(0, Math.min(scrollActionCount, scrollBarActionCount));
            }

            isScrollbarScrolling = nativeProgress > 0 && nativeProgress < 1;
            updateForestEffect();
            
            lastScrollbarPosition = currentScrollTop;

            if (nativeProgress >= 1 || scrollActionCount >= maxLandingScrolls) {
                landingLog('📜 Native scroll exit threshold reached');
                exitLandingModeFunction();
            }
        }
    }

    function resetToLanding() {
        const currentScroll = window.pageYOffset;
        const aboutSection = document.querySelector('#about');
        const aboutSectionTop = aboutSection ? aboutSection.offsetTop : 0;
        const scrollDelta = (lastScrollPosition || 0) - currentScroll;
        
        // Reset scrollbar tracking when returning to landing
        if (currentScroll <= aboutSectionTop + 150 && !isInLandingMode && !suppressLandingReentry) {
            // Only trigger on upward scroll motion
            if (scrollDelta > 16) {
                landingLog('🔄 resetToLanding triggered - returning to hero');
                scrollBarActionCount = 0;
                scrollActionCount = 0;
                lastScrollbarPosition = 0;
                isScrollbarScrolling = false;
                enterLandingMode();
            }
        }
        lastScrollPosition = currentScroll;
    }
    
    // Initialize landing mode
    if (heroSection) {
        applyLandingHeroLayout();
        lockLandingScroll();
        heroSection.style.opacity = '1';
    }
    
    // Add event listeners
    document.addEventListener('wheel', handleWheelScroll, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('keydown', preventKeyScroll);

    // Add scrollbar support for landing mode
    window.addEventListener('scroll', handleScrollBarScroll, { passive: true });
    
    // Allow reset when scrolling back to top (keep this listener always active)
    window.addEventListener('scroll', resetToLanding, { passive: true });
    
    // Enhanced scroll up detection for blank space and About section header
    window.addEventListener('wheel', (e) => {
        if (!isInLandingMode && e.deltaY < 0) {
            const currentScroll = window.pageYOffset;
            const aboutSection = document.querySelector('#about');
            const aboutSectionTop = aboutSection ? aboutSection.offsetTop : 0;
            
            // Trigger when scrolling up in blank space or at About section header
            if (!suppressLandingReentry && currentScroll <= aboutSectionTop + 200) {
                e.preventDefault();
                landingLog('🔄 Secondary wheel handler triggered at:', currentScroll);
                enterLandingMode();
            }
        }
    }, { passive: false });
    
    // Initial forest effect
    updateForestEffect();
    
    landingLog('Fixed hero landing screen initialized - 3 scrolls to exit, scroll up near top to re-enter');
}

function initLocalTrustParallax() {
    const bridge = document.querySelector('.kl-trust-bridge');
    const section = bridge || document.querySelector('#testimonials.kl-local-trust--parallax');
    const layer = bridge?.querySelector('.kl-local-trust-parallax')
        || section?.querySelector('.kl-local-trust-parallax');
    if (!section || !layer) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const scrollTarget = bridge || section;

    const getRate = () => {
        const raw = getComputedStyle(scrollTarget).getPropertyValue('--kl-parallax-rate').trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 0.68;
    };

    const update = () => {
        ticking = false;
        const rect = scrollTarget.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top > window.innerHeight) return;

        const centerOffset = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
        const rate = getRate();
        layer.style.transform = `translate3d(0, ${centerOffset * -rate}px, 0)`;
    };

    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
}

// Main Animations
function initMainAnimations() {
    // Animate text reveals (skip hero — handled by initHeroEntranceAnimations)
    setTimeout(() => {
        document.querySelectorAll('.text-reveal').forEach((el, index) => {
            if (el.closest('#hero')) return;
            setTimeout(() => {
                el.classList.add('animate');
            }, index * 200);
        });
    }, 500);

    // Start counter animations
    animateCounters();
    
    // Start staggered animations
    setTimeout(() => {
        document.querySelectorAll('.stagger-item').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 150);
        });
    }, 1500);
}

const KL_HERO_PANEL_POOL = [
    '/images/showcase/faith-works-og-card.webp',
    '/images/screen-team-showcase-800.webp',
    '/images/KGHero.webp',
    '/images/showcase/roof-monsters-og-card.webp',
    '/images/momhero.webp',
    '/images/websitehero.webp?v=20260604perf1'
];

const KL_HERO_IMAGE_FOCUS = {
    '/images/showcase/faith-works-og-card.webp': { desktop: '42% 38%', mobile: '44% 36%' },
    '/images/screen-team-showcase-800.webp': { desktop: '74% 48%', mobile: '82% 50%' },
    '/images/KGHero.webp': { desktop: '76% 44%', mobile: '82% 46%' },
    '/images/showcase/roof-monsters-og-card.webp': { desktop: '50% 40%', mobile: '52% 42%' },
    '/images/momhero.webp': { desktop: '50% 32%', mobile: '50% 28%' },
    '/images/websitehero.webp': { desktop: '38% 36%', mobile: '42% 38%' },
    '/images/websitehero.webp?v=20260604perf1': { desktop: '38% 36%', mobile: '42% 38%' }
};

const KL_HERO_MOBILE_PRIORITY = [
    '/images/screen-team-showcase-800.webp',
    '/images/KGHero.webp',
    '/images/websitehero.webp?v=20260604perf1',
    '/images/showcase/roof-monsters-og-card.webp',
    '/images/showcase/faith-works-og-card.webp',
    '/images/momhero.webp'
];

function normalizeKlHeroSrc(src) {
    if (!src) return '';
    return src.split('?')[0];
}

function getKlHeroFocus(src, mobile = false) {
    const key = src || '';
    const bare = normalizeKlHeroSrc(key);
    const entry = KL_HERO_IMAGE_FOCUS[key] || KL_HERO_IMAGE_FOCUS[bare];
    if (!entry) return '50% 42%';
    return mobile ? entry.mobile : entry.desktop;
}

function pickKlMobileHeroImage(panels, primarySrc) {
    const barePrimary = normalizeKlHeroSrc(primarySrc);
    if (barePrimary && (KL_HERO_IMAGE_FOCUS[primarySrc] || KL_HERO_IMAGE_FOCUS[barePrimary])) {
        const match = panels.find((p) => normalizeKlHeroSrc(p) === barePrimary);
        if (match) return match;
        if (primarySrc && !/KnightLogicsLogo/i.test(primarySrc)) return primarySrc;
    }

    for (const preferred of KL_HERO_MOBILE_PRIORITY) {
        const found = panels.find((p) => normalizeKlHeroSrc(p) === normalizeKlHeroSrc(preferred));
        if (found) return found;
    }

    return panels[0];
}

function pickKlHeroPanels(slug, primarySrc) {
    const panels = [];
    if (primarySrc && !/KnightLogicsLogo/i.test(primarySrc)) {
        panels.push(primarySrc);
    }

    const key = String(slug || 'page');
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
        hash = (hash + key.charCodeAt(i) * (i + 3)) % KL_HERO_PANEL_POOL.length;
    }

    for (let i = 0; panels.length < 4; i += 1) {
        const candidate = KL_HERO_PANEL_POOL[(hash + i) % KL_HERO_PANEL_POOL.length];
        if (!panels.includes(candidate)) panels.push(candidate);
        if (i > KL_HERO_PANEL_POOL.length * 2) break;
    }

    while (panels.length < 4) {
        panels.push(KL_HERO_PANEL_POOL[panels.length % KL_HERO_PANEL_POOL.length]);
    }

    return panels.slice(0, 4);
}

function buildKlHeroPanelsMarkup(panels, primarySrc) {
    const mobile = pickKlMobileHeroImage(panels, primarySrc);
    const positions = ['left', 'top', 'bottom', 'right'];

    const panelEls = positions.map((pos, i) => {
        const src = panels[i];
        const loading = i < 2 ? 'eager' : 'lazy';
        const focus = getKlHeroFocus(src);
        if (pos === 'bottom') {
            return `<div class="hero-panel hero-panel--${pos} hero-panel--photo">
            <img class="hero-panel-img--desktop" src="${src}" alt="" width="800" height="600" decoding="async" loading="${loading}" style="object-position:${focus};">
            <img class="hero-panel-img--mobile" src="${mobile}" alt="" width="800" height="600" decoding="async" loading="eager" style="object-position:${getKlHeroFocus(mobile, true)};">
        </div>`;
        }
        return `<div class="hero-panel hero-panel--${pos} hero-panel--photo"><img src="${src}" alt="" width="800" height="600" decoding="async" loading="${loading}" style="object-position:${focus};"></div>`;
    }).join('');

    return `<div class="hero-panels" aria-hidden="true">${panelEls}</div><div class="svc-hero-overlay" aria-hidden="true"></div>`;
}

const KL_SVC_HERO_STARS_VER = '20260715cta1';

const KL_SUBPAGE_HERO_SELECTORS = [
    '.svc-hero:not(.svc-hero--stars):not(.svc-hero--panels)',
    '.pricing-hero:not(.svc-hero--stars)',
    '.profile-hero:not(.svc-hero--stars)',
    '.cs-hero:not(.svc-hero--stars)',
    '.automation-hero:not(.svc-hero--stars)',
    '.referral-hero:not(.svc-hero--stars)',
    '.displayplus-hero:not(.svc-hero--stars)',
    '.videoforge-hero:not(.svc-hero--stars)',
    '.pixelforge-hero:not(.svc-hero--stars)',
    '.contact-page-hero:not(.svc-hero--stars)',
    '.ed-hero:not(.svc-hero--stars)',
    '.svc-hero--panels',
].join(', ');

function ensureSvcHeroStarsReady(done) {
    if (typeof window.klUpgradeHeroToStars === 'function') {
        done();
        return;
    }
    const existing = document.querySelector('script[data-kl-svc-hero-stars="1"]');
    if (existing) {
        existing.addEventListener('load', () => done(), { once: true });
        existing.addEventListener('error', () => done(), { once: true });
        return;
    }
    const script = document.createElement('script');
    script.src = `/svc-hero-stars.js?v=${KL_SVC_HERO_STARS_VER}`;
    script.defer = true;
    script.dataset.klSvcHeroStars = '1';
    script.onload = () => done();
    script.onerror = () => done();
    document.head.appendChild(script);
}

function initSubpageStarsHeroes() {
    if (document.getElementById('hero')) return;

    ensureSvcHeroStarsReady(() => {
        upgradeLegacySubpageHeroes();
        compactSubpageHeroContent();
        // Compact creates the actions bar after the first stars mount — refresh so
        // the canvas/bg cover both the title band and the actions band.
        if (typeof window.klRefreshSvcHeroStars === 'function') {
            window.klRefreshSvcHeroStars();
        } else if (typeof window.klInitSvcHeroStars === 'function') {
            window.klInitSvcHeroStars();
        }
        requestAnimationFrame(() => {
            if (typeof window.klRefreshSvcHeroStars === 'function') {
                window.klRefreshSvcHeroStars();
            }
        });
    });
}

function findSubpageHeroInner(hero) {
    const selectors = [
        '.svc-hero-inner',
        '.cs-hero-inner',
        '.profile-hero-inner',
        '.contact-page-hero-inner',
        '.videoforge-hero-copy',
        '.pixelforge-hero-copy',
        '.displayplus-hero-copy',
        '.ed-hero-copy',
        '.container',
    ];
    for (let i = 0; i < selectors.length; i++) {
        const node = hero.querySelector(selectors[i]);
        if (node) return node;
    }
    return null;
}

function compactSubpageHeroContent() {
    document.querySelectorAll('.svc-hero--stars, .svc-hero--panels').forEach((hero) => {
        if (hero.dataset.compacted === '1') return;

        const inner = findSubpageHeroInner(hero);
        if (!inner) return;
        if (!inner.classList.contains('svc-hero-inner')) {
            inner.classList.add('svc-hero-inner', 'fade-in');
        }

        const movable = [];
        inner.querySelectorAll('p').forEach((p) => {
            if (p.classList.contains('svc-eyebrow') || p.classList.contains('pricing-hero-kicker')) return;
            if (p.closest('.svc-eyebrow')) return;
            if (!p.classList.contains('svc-hero-lead')) p.classList.add('svc-hero-lead');
            movable.push(p);
        });

        inner.querySelectorAll(
            '.kl-growth-stats, .kl-growth-metrics, .cs-tech-stack, .svc-cta-row, .pricing-nav-pills, .cs-hero-sub, .cs-hero-actions, .contact-page-hero-actions'
        ).forEach((node) => movable.push(node));

        inner.querySelectorAll('div').forEach((div) => {
            if (div.classList.contains('videoforge-hero-panel')
                || div.classList.contains('pixelforge-hero-panel')
                || div.classList.contains('displayplus-hero-panel')
                || div.classList.contains('referral-hero-grid')) return;
            if (div.querySelector('a.services-panel-link, .btn-primary, .btn-secondary')) {
                if (!div.classList.contains('svc-cta-row')) div.classList.add('svc-cta-row');
                movable.push(div);
            }
        });

        if (!movable.length) return;

        let bar = hero.nextElementSibling;
        if (!bar || !bar.classList.contains('kl-hero-actions-bar')) {
            const zone = hero.closest('.kl-stars-hero-zone');
            bar = zone ? zone.querySelector('.kl-hero-actions-bar') : null;
        }
        if (!bar || !bar.classList.contains('kl-hero-actions-bar')) {
            bar = document.createElement('section');
            bar.className = 'kl-hero-actions-bar';
            const container = document.createElement('div');
            container.className = 'container fade-in';
            bar.appendChild(container);
            const zone = hero.closest('.kl-stars-hero-zone');
            if (zone) zone.appendChild(bar);
            else hero.insertAdjacentElement('afterend', bar);
        }

        const container = bar.querySelector('.container') || bar;
        movable.forEach((node) => container.appendChild(node));

        hero.dataset.compacted = '1';
    });
}

function upgradeLegacySubpageHeroes() {
    if (document.getElementById('hero')) return;

    document.querySelectorAll(KL_SUBPAGE_HERO_SELECTORS).forEach((section) => {
        if (section.dataset.starsUpgraded === '1') return;
        if (typeof window.klUpgradeHeroToStars === 'function') {
            window.klUpgradeHeroToStars(section);
        }
    });
}

function initHeroPanels() {
    document.querySelectorAll('.hero-panels').forEach((panels) => {
        const hero = panels.closest('.svc-hero--panels');
        if (!hero || hero.dataset.panelsInit === '1') return;
        hero.dataset.panelsInit = '1';

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            hero.classList.add('hero-panels-ready');
            return;
        }

        requestAnimationFrame(() => hero.classList.add('hero-panels-ready'));
    });
}

function initHeroEntranceAnimations() {
    const hero = document.getElementById('hero');
    if (!hero || hero.dataset.entranceReady === '1') return;
    hero.dataset.entranceReady = '1';
    document.body.classList.add('hero-js-ready');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const textReveals = hero.querySelectorAll('.text-reveal');

    const runTextRevealFlash = () => {
        textReveals.forEach((el, index) => {
            window.setTimeout(() => el.classList.add('animate'), index * 240);
        });
    };

    const finishEntrance = () => {
        hero.classList.add('hero-animate-done', 'hero-animate-fallback');
    };

    if (prefersReducedMotion) {
        hero.classList.add('hero-animate', 'hero-animate-done', 'hero-animate-fallback');
        runTextRevealFlash();
        return;
    }

    requestAnimationFrame(() => {
        hero.classList.add('hero-animate');
        window.setTimeout(runTextRevealFlash, 1180);
        window.setTimeout(finishEntrance, 1400);
    });

    // Safety net if animation class fails to apply or stalls
    window.setTimeout(() => {
        if (!hero.classList.contains('hero-animate-done')) {
            hero.classList.add('hero-animate', 'hero-animate-fallback', 'hero-animate-done');
            runTextRevealFlash();
        }
    }, 1600);
}

function initProofAboutEntrance() {
    const about = document.getElementById('about');
    if (!about || about.dataset.proofEntranceReady === '1') return;
    about.dataset.proofEntranceReady = '1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startAnimation = () => {
        if (about.classList.contains('kl-proof-animate')) return;
        about.classList.add('kl-proof-animate');
        window.setTimeout(() => about.classList.add('kl-proof-animate-done'), 2800);
    };

    if (prefersReducedMotion) {
        startAnimation();
        return;
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    startAnimation();
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });
        observer.observe(about);
        return;
    }

    startAnimation();
}

function initProofCardVideos() {
    const cards = document.querySelectorAll(
        '.kl-proof-card--video .kl-proof-card-video, video.kl-lane-video'
    );
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const playVideo = (video) => {
        video.muted = true;
        video.playsInline = true;
        const attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') {
            attempt.catch(() => {});
        }
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    playVideo(video);
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.2 });

        cards.forEach((video) => observer.observe(video));
        return;
    }

    cards.forEach((video) => playVideo(video));
}

function initServicesEntrance() {
    const services = document.getElementById('services');
    if (!services || !services.classList.contains('services--unified-v1') || services.dataset.servicesEntranceReady === '1') return;
    services.dataset.servicesEntranceReady = '1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startSectionAnimation = () => {
        if (services.classList.contains('kl-services-animate')) return;
        services.classList.add('kl-services-animate');
        window.setTimeout(() => services.classList.add('kl-services-animate-done'), 900);
    };

    const startShowcaseAnimation = (showcase) => {
        if (showcase.classList.contains('kl-services-showcase-animate')) return;
        showcase.classList.add('kl-services-showcase-animate');
        const cardCount = showcase.querySelectorAll('.services-showcase-card.kl-services-enter').length;
        const doneMs = Math.min(2800, 1100 + cardCount * 110);
        window.setTimeout(() => showcase.classList.add('kl-services-showcase-animate-done'), doneMs);
    };

    const startCtaAnimation = (cta) => {
        if (!cta || cta.classList.contains('kl-services-cta-animate')) return;
        cta.classList.add('kl-services-cta-animate');
        window.setTimeout(() => cta.classList.add('kl-services-cta-animate-done'), 1000);
    };

    const showcaseBlocks = services.querySelectorAll('.kl-services-showcase');
    const servicesCta = services.querySelector('[data-kl-services-cta]');

    const isNearViewport = (el, leadPx = 280) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        return rect.top < vh + leadPx && rect.bottom > -leadPx;
    };

    if (prefersReducedMotion) {
        startSectionAnimation();
        showcaseBlocks.forEach(startShowcaseAnimation);
        startCtaAnimation(servicesCta);
        return;
    }

    // Only auto-start if already clearly on screen (refresh mid-page). Avoid
    // burning the entrance while the user is still reading content above.
    if (isNearViewport(services, 40)) startSectionAnimation();
    showcaseBlocks.forEach((showcase) => {
        if (isNearViewport(showcase, 24)) startShowcaseAnimation(showcase);
    });
    if (servicesCta && isNearViewport(servicesCta, 40)) startCtaAnimation(servicesCta);

    // Failsafe only if the block is in/near view and somehow never animated.
    window.setTimeout(() => {
        if (isNearViewport(services, 80)) startSectionAnimation();
        showcaseBlocks.forEach((showcase) => {
            if (isNearViewport(showcase, 80)) startShowcaseAnimation(showcase);
        });
        if (servicesCta && isNearViewport(servicesCta, 80)) startCtaAnimation(servicesCta);
    }, 4500);

    if ('IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    startSectionAnimation();
                    sectionObserver.disconnect();
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });
        sectionObserver.observe(services);

        showcaseBlocks.forEach((showcase) => {
            if (showcase.classList.contains('kl-services-showcase-animate')) return;
            const observeTarget = showcase.querySelector('.services-showcase-grid') || showcase;
            const showcaseObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startShowcaseAnimation(showcase);
                        showcaseObserver.disconnect();
                    }
                });
            }, {
                // Fire when a solid chunk of the mosaic is actually on screen
                threshold: 0.22,
                rootMargin: '0px 0px -12% 0px'
            });
            showcaseObserver.observe(observeTarget);
        });

        if (servicesCta && !servicesCta.classList.contains('kl-services-cta-animate')) {
            const ctaObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startCtaAnimation(servicesCta);
                        ctaObserver.disconnect();
                    }
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -6% 0px'
            });
            ctaObserver.observe(servicesCta);
        }
        return;
    }

    startSectionAnimation();
    showcaseBlocks.forEach(startShowcaseAnimation);
    startCtaAnimation(servicesCta);
}

function initShowcaseCardReveal() {
    const cards = document.querySelectorAll('.services--unified-v1 .services-showcase-card--slide');
    if (!cards.length) return;

    const desktopMq = window.matchMedia('(min-width: 769px)');
    const coarseMq = window.matchMedia('(pointer: coarse)');

    function clearReveal(except) {
        cards.forEach((card) => {
            if (card !== except) card.classList.remove('is-showcase-reveal');
        });
    }

    cards.forEach((card) => {
        card.addEventListener('click', (e) => {
            if (!desktopMq.matches || !coarseMq.matches) return;
            if (card.classList.contains('is-showcase-reveal')) return;
            e.preventDefault();
            clearReveal(card);
            card.classList.add('is-showcase-reveal');
        }, true);
    });

    document.addEventListener('click', (e) => {
        if (!desktopMq.matches) return;
        const open = document.querySelector('.services-showcase-card--slide.is-showcase-reveal');
        if (!open || open.contains(e.target)) return;
        clearReveal(null);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') clearReveal(null);
    });
}

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
                counter.textContent = target + '+';
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// Cursor Trail Effect
function initCursorTrail() {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);
    
    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animateTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;
        
        trail.style.left = trailX - 10 + 'px';
        trail.style.top = trailY - 10 + 'px';
        
        requestAnimationFrame(animateTrail);
    }
    
    animateTrail();
}

// Magnetic Button Effect
function initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.magnetic-btn');
    
    magneticButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
        });
    });
}

// Advanced Parallax Effects
function initAdvancedParallax() {
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Hero background parallax
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${rate}px) scale(${1 + scrolled * 0.0002})`;
        }
        
        // Rotate hero logo based on scroll
        const heroLogo = document.querySelector('.hero-logo');
        if (heroLogo) {
            const rotation = scrolled * 0.1;
            heroLogo.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 + scrolled * 0.0001})`;
        }
        
        // Parallax for section backgrounds
        document.querySelectorAll('section::before').forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const scrollPercent = (scrolled - sectionTop + window.innerHeight) / (sectionHeight + window.innerHeight);
            
            if (scrollPercent >= 0 && scrollPercent <= 1) {
                const yPos = -(scrolled - sectionTop) * 0.3;
                section.style.transform = `translateY(${yPos}px)`;
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Desktop nav: shrink link size/gap so links never overlap .nav-actions CTAs
let navLinksFitRaf = 0;

function fitDesktopNavLinks() {
    const desktopMq = window.matchMedia('(min-width: 1025px)');
    const navLinksEl = document.querySelector('.nav-menu .mobile-nav-links');
    const navActions = document.querySelector('.nav-actions');
    const navMenu = document.getElementById('nav-menu');

    if (!navLinksEl) return;

    navLinksEl.style.removeProperty('--nav-links-font-size');
    navLinksEl.style.removeProperty('--nav-links-gap');
    if (navMenu) navMenu.style.removeProperty('--nav-menu-gap');

    if (!desktopMq.matches || !navActions || navActions.offsetParent === null) return;

    const sampleLink = navLinksEl.querySelector('.nav-link');
    if (!sampleLink) return;

    const buffer = 10;
    let fontSize = parseFloat(getComputedStyle(sampleLink).fontSize);
    let gap = parseFloat(getComputedStyle(navLinksEl).columnGap || getComputedStyle(navLinksEl).gap) || 18;
    let menuGap = navMenu ? parseFloat(getComputedStyle(navMenu).columnGap || getComputedStyle(navMenu).gap) || 14 : 14;
    const minFont = 11;
    const minGap = 8;
    const minMenuGap = 6;

    function overlaps() {
        const actionsRect = navActions.getBoundingClientRect();
        let maxRight = navLinksEl.getBoundingClientRect().right;
        navLinksEl.querySelectorAll(':scope > *').forEach((child) => {
            maxRight = Math.max(maxRight, child.getBoundingClientRect().right);
        });
        return maxRight > actionsRect.left - buffer;
    }

    if (!overlaps()) return;

    while (overlaps() && fontSize > minFont) {
        fontSize = Math.max(minFont, fontSize - 0.5);
        navLinksEl.style.setProperty('--nav-links-font-size', `${fontSize}px`);
    }

    while (overlaps() && gap > minGap) {
        gap = Math.max(minGap, gap - 2);
        navLinksEl.style.setProperty('--nav-links-gap', `${gap}px`);
    }

    if (navMenu) {
        while (overlaps() && menuGap > minMenuGap) {
            menuGap = Math.max(minMenuGap, menuGap - 2);
            navMenu.style.setProperty('--nav-menu-gap', `${menuGap}px`);
        }
    }
}

function scheduleFitDesktopNavLinks() {
    if (navLinksFitRaf) cancelAnimationFrame(navLinksFitRaf);
    navLinksFitRaf = requestAnimationFrame(() => {
        navLinksFitRaf = 0;
        fitDesktopNavLinks();
    });
}

// Navigation
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navMenuOverlay = document.getElementById('nav-menu-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    function closeNavigationUI() {
        if (navMenu) navMenu.classList.remove('active');
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Open menu');
        }
        if (navMenuOverlay) navMenuOverlay.classList.remove('active');
        document.body.classList.remove('nav-menu-open');
        document.body.style.overflow = '';
    }

    // Enhanced hamburger menu toggle with overlay
    function toggleMobileMenu() {
        if (!navMenu || !hamburger || !navMenuOverlay) return;
        
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeNavigationUI();
        } else {
            navMenu.classList.add('active');
            hamburger.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
            hamburger.setAttribute('aria-label', 'Close menu');
            navMenuOverlay.classList.add('active');
            document.body.classList.add('nav-menu-open');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hamburger click handler
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Overlay click handler - close menu when tapping outside the drawer
    if (navMenuOverlay) {
        navMenuOverlay.addEventListener('click', closeNavigationUI);
    }

    const mobileMenuClose = document.getElementById('mobile-menu-close');
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeNavigationUI);
    }

    if (navMenu) {
        navMenu.querySelectorAll('.mobile-upwork-row a, .site-footer-social-link, .mobile-menu-brand').forEach((el) => {
            el.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    setTimeout(closeNavigationUI, 120);
                }
            });
        });
    }

    // Dropdown menu handling
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    const desktopMega = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)');

    function clearMegaPanelAlign(mega) {
        if (!mega) return;
        mega.querySelectorAll('.nav-dropdown-mega-panel').forEach((p) => {
            p.style.removeProperty('--mega-align-offset');
        });
    }

    /** Desktop: line up each panel's first link with its left-side tab row. */
    function alignMegaPanelToTab(mega, index) {
        if (!mega) return;
        const tabs = mega.querySelectorAll('.nav-dropdown-mega-tab');
        const panels = mega.querySelectorAll('.nav-dropdown-mega-panel');
        clearMegaPanelAlign(mega);
        if (!desktopMega.matches) return;
        const tab = tabs[index];
        const firstTab = tabs[0];
        const panel = panels[index];
        if (!tab || !firstTab || !panel) return;
        const offset = Math.max(0, tab.offsetTop - firstTab.offsetTop);
        panel.style.setProperty('--mega-align-offset', `${offset}px`);
    }

    function resetMegaNav(mega) {
        if (!mega) return;
        const tabs = mega.querySelectorAll('.nav-dropdown-mega-tab');
        const panels = mega.querySelectorAll('.nav-dropdown-mega-panel');
        mega.classList.remove('nav-dropdown-mega--flyout-open');
        tabs.forEach((t, i) => {
            const active = i === 0;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach((p, i) => {
            const active = i === 0;
            p.classList.toggle('is-active', active);
            if (active) p.removeAttribute('hidden');
            else p.setAttribute('hidden', '');
        });
        alignMegaPanelToTab(mega, 0);
    }

    function scrollMegaIntoDrawer(target) {
        if (!target || typeof target.scrollIntoView !== 'function') return;
        requestAnimationFrame(() => {
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }

    function activateMegaTab(mega, index) {
        const tabs = mega.querySelectorAll('.nav-dropdown-mega-tab');
        const panels = mega.querySelectorAll('.nav-dropdown-mega-panel');
        tabs.forEach((t, i) => {
            const active = i === index;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach((p, i) => {
            const active = i === index;
            p.classList.toggle('is-active', active);
            if (active) p.removeAttribute('hidden');
            else p.setAttribute('hidden', '');
        });
        if (!desktopMega.matches) {
            mega.classList.add('nav-dropdown-mega--flyout-open');
            clearMegaPanelAlign(mega);
            const backBtn = mega.querySelector('.nav-dropdown-mega-back');
            scrollMegaIntoDrawer(backBtn || panels[index] || mega);
        } else {
            alignMegaPanelToTab(mega, index);
        }
    }

    function syncDropdownMenuState(dropdown) {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const menu = dropdown.querySelector('.nav-dropdown-menu');
        const isActive = dropdown.classList.contains('active');
        if (toggle) toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        if (!menu) return;
        menu.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        if ('inert' in menu) menu.inert = !isActive;
        menu.querySelectorAll('a.nav-dropdown-item, button.nav-dropdown-mega-tab, button.nav-dropdown-mega-back').forEach((el) => {
            if (!isActive) el.setAttribute('tabindex', '-1');
            else el.removeAttribute('tabindex');
        });
    }

    function setDropdownActive(dropdown, active) {
        if (active) dropdown.classList.add('active');
        else {
            dropdown.classList.remove('active');
            resetMegaNav(dropdown.querySelector('.nav-dropdown-mega'));
        }
        syncDropdownMenuState(dropdown);
    }

    function closeAllDropdowns() {
        navDropdowns.forEach((dropdown) => setDropdownActive(dropdown, false));
    }

    navDropdowns.forEach((dropdown) => syncDropdownMenuState(dropdown));

    document.addEventListener('click', (e) => {
        const blocked = e.target.closest('.nav-dropdown-item, .nav-dropdown-mega-tab, .nav-dropdown-mega-back');
        if (blocked && !blocked.closest('.nav-dropdown.active')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    document.querySelectorAll('.nav-dropdown-mega').forEach((mega) => {
        const dropdown = mega.closest('.nav-dropdown');
        const tabs = mega.querySelectorAll('.nav-dropdown-mega-tab');

        tabs.forEach((tab, index) => {
            tab.addEventListener('mouseenter', () => {
                if (!desktopMega.matches) return;
                const parentDropdown = mega.closest('.nav-dropdown');
                if (!parentDropdown || !parentDropdown.classList.contains('active')) return;
                activateMegaTab(mega, index);
            });
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                activateMegaTab(mega, index);
            });
        });

        if (dropdown) {
            dropdown.addEventListener('mouseleave', () => {
                if (!desktopMega.matches) return;
                if (!dropdown.classList.contains('active')) resetMegaNav(mega);
            });
        }

        const backBtn = mega.querySelector('.nav-dropdown-mega-back');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mega.classList.remove('nav-dropdown-mega--flyout-open');
                scrollMegaIntoDrawer(mega.querySelector('.nav-dropdown-mega-nav') || mega);
            });
        }
    });

    navDropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const menu = dropdown.querySelector('.nav-dropdown-menu');
        
        if (toggle && menu) {
            const desktopHover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)');
            let closeTimer = null;

            function clearCloseTimer() {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }
            }

            function openDesktopDropdown() {
                if (!desktopHover.matches) return;
                clearCloseTimer();
                navDropdowns.forEach((d) => {
                    if (d !== dropdown) {
                        if (d._klNavCloseTimer) {
                            clearTimeout(d._klNavCloseTimer);
                            d._klNavCloseTimer = null;
                        }
                        setDropdownActive(d, false);
                    }
                });
                setDropdownActive(dropdown, true);
            }

            function scheduleCloseDesktopDropdown() {
                if (!desktopHover.matches) return;
                clearCloseTimer();
                // Grace period so diagonal travel from toggle → submenu does not kill the menu.
                closeTimer = setTimeout(() => {
                    closeTimer = null;
                    if (!dropdown.matches(':hover')) {
                        setDropdownActive(dropdown, false);
                    }
                }, 220);
                dropdown._klNavCloseTimer = closeTimer;
            }

            // Desktop: open on toggle hover; stay open over toggle + menu (incl. gap bridge)
            toggle.addEventListener('mouseenter', openDesktopDropdown);
            menu.addEventListener('mouseenter', () => {
                if (!desktopHover.matches) return;
                clearCloseTimer();
                setDropdownActive(dropdown, true);
            });
            dropdown.addEventListener('mouseenter', () => {
                if (!desktopHover.matches) return;
                clearCloseTimer();
            });
            dropdown.addEventListener('mouseleave', scheduleCloseDesktopDropdown);

            // Touch: toggle open/closed (touchend only adds when closed — fixed to full toggle)
            let toggleTouchedAt = 0;
            toggle.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTouchedAt = Date.now();
                clearCloseTimer();
                navDropdowns.forEach((d) => {
                    if (d !== dropdown) setDropdownActive(d, false);
                });
                setDropdownActive(dropdown, !dropdown.classList.contains('active'));
            });

            // Mouse click fallback for non-hover devices (e.g. keyboard navigation)
            toggle.addEventListener('click', (e) => {
                const href = toggle.getAttribute('href') || '';
                if (href === '#' || href.startsWith('#')) {
                    e.preventDefault();
                }
                if (desktopHover.matches) return; // handled by hover
                if (Date.now() - toggleTouchedAt < 450) return; // avoid double-toggle after touch
                e.stopPropagation();
                clearCloseTimer();
                navDropdowns.forEach((d) => {
                    if (d !== dropdown) setDropdownActive(d, false);
                });
                setDropdownActive(dropdown, !dropdown.classList.contains('active'));
            });
            
            // Close dropdown when clicking a dropdown item
            const items = dropdown.querySelectorAll('.nav-dropdown-item');
            items.forEach(item => {
                item.addEventListener('click', () => {
                    clearCloseTimer();
                    closeAllDropdowns();
                    // Close mobile menu if open
                    if (navMenu && hamburger && navMenuOverlay) {
                        setTimeout(() => {
                            closeNavigationUI();
                        }, 150);
                    }
                });
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            closeAllDropdowns();
        }
    });

    // Close menu when clicking a nav link — only while the mobile drawer is open
    navLinks.forEach((link, index) => {
        link.style.transitionDelay = `${index * 0.05}s`;
        
        link.addEventListener('click', (e) => {
            if (link.classList.contains('nav-dropdown-toggle')) return;

            const menuIsOpen = navMenu && navMenu.classList.contains('active');
            if (!menuIsOpen) return;

            const href = link.getAttribute('href') || '';
            const shouldForceNavigate = link.id !== 'nav-home'
                && href.startsWith('/')
                && !href.includes('#');
            let navigationTarget = null;

            if (shouldForceNavigate) {
                const targetUrl = new URL(href, window.location.origin);
                const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
                const targetPath = targetUrl.pathname.replace(/\/+$/, '') || '/';

                if (targetUrl.origin === window.location.origin && targetPath !== currentPath) {
                    navigationTarget = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
                    e.preventDefault();
                }
            }

            link.style.transform = 'translateX(4px) scale(0.95)';
            
            setTimeout(() => {
                closeNavigationUI();
                setTimeout(() => {
                    link.style.transform = '';
                }, 200);

                if (navigationTarget) {
                    window.location.assign(navigationTarget);
                }
            }, 150);
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });

    // Handle window resize - close menu if screen gets larger
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu && navMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });

    // Navbar scroll effect — transparent over hero, semi-opaque after scroll
    if (navbar && navbar.dataset.scrollBound !== '1') {
        navbar.dataset.scrollBound = '1';

        const heroSection = document.querySelector('#hero');
        const scrollThreshold = heroSection ? 100 : 24;

        const updateNavbarScrollState = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            navbar.classList.toggle('scrolled', scrollTop > scrollThreshold);
            scheduleFitDesktopNavLinks();
        };

        updateNavbarScrollState();
        window.addEventListener('scroll', updateNavbarScrollState, { passive: true });
        window.addEventListener('resize', updateNavbarScrollState, { passive: true });
    }

    scheduleFitDesktopNavLinks();
    window.addEventListener('resize', scheduleFitDesktopNavLinks, { passive: true });

    if (navbar && typeof ResizeObserver !== 'undefined' && navbar.dataset.navFitObserved !== '1') {
        navbar.dataset.navFitObserved = '1';
        const navFitObserver = new ResizeObserver(scheduleFitDesktopNavLinks);
        navFitObserver.observe(navbar);
        const navActions = document.querySelector('.nav-actions');
        const navBrand = document.querySelector('.nav-brand');
        if (navActions) navFitObserver.observe(navActions);
        if (navBrand) navFitObserver.observe(navBrand);
    }

    // Home navigation handlers - trigger landing mode
    const logoHomeLink = document.getElementById('logo-home');
    const brandTitleLink = document.querySelector('.nav-brand-title-link');
    const mobileLogoHomeLink = document.getElementById('mobile-logo-home');
    
    function triggerLandingMode(e) {
        e.preventDefault();
        closeNavigationUI();

        const heroSection = document.querySelector('#hero');
        if (!heroSection) {
            window.location.href = '/';
            return;
        }

        isInLandingMode = false;
        document.body.classList.remove('landing-mode');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    [logoHomeLink, brandTitleLink, mobileLogoHomeLink].filter(Boolean).forEach((link) => {
        link.addEventListener('click', triggerLandingMode);
    });

    // CTA button handlers - exit landing mode and navigate
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = button.getAttribute('href');
            
            // If in landing mode, exit it and navigate
            if (isInLandingMode && targetId && targetId.startsWith('#')) {
                e.preventDefault();
                
                // Close mobile menu if open
                closeNavigationUI();
                
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    // Exit landing mode manually
                    isInLandingMode = false;
                    
                    const heroSection = document.querySelector('#hero');
                    if (heroSection) {
                        heroSection.style.transition = 'opacity 0.8s ease-out';
                        heroSection.style.opacity = '0';
                        
                        setTimeout(() => {
                            heroSection.style.display = 'none';
                            heroSection.style.pointerEvents = 'none';
                            document.body.classList.remove('landing-mode');
                            document.body.style.overflow = '';
                            document.body.style.position = '';
                            document.body.style.width = '';
                            document.body.style.height = '';
                            document.body.style.top = '';
                            document.body.style.left = '';
                            
                            // Scroll to target section
                            const offsetTop = targetSection.offsetTop - 100;
                            window.scrollTo({
                                top: offsetTop,
                                behavior: 'smooth'
                            });
                            
                            console.log('CTA button exited landing mode, navigated to:', targetId);
                        }, 800);
                    }
                    
                    // Remove scroll prevention
                    document.removeEventListener('touchmove', function(e) { if (isInLandingMode) e.preventDefault(); }, { passive: false });
                    document.removeEventListener('keydown', function(e) { 
                        if (isInLandingMode) {
                            const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
                            if (scrollKeys.includes(e.keyCode)) {
                                e.preventDefault();
                                return false;
                            }
                        }
                    });
                }
            }
            // If not in landing mode, let normal navigation handle it
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            // Check if it's an external link, clean URL path, or starts with http
            if (targetId.includes('.html') || targetId.startsWith('http') || !targetId.startsWith('#')) {
                // Allow normal navigation for page links and external links
                return;
            }
            
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Force exit landing mode when clicking nav links
                if (isInLandingMode) {
                    // Manually exit landing mode without auto-scrolling to about
                    isInLandingMode = false;
                    scrollActionCount = 0;
                    // Mobile now uses same scrollActionCount as desktop
                    
                    if (document.querySelector('.hero')) {
                        const heroSection = document.querySelector('.hero');
                        heroSection.style.transition = 'opacity 0.8s ease-out';
                        heroSection.style.opacity = '0';
                        
                        setTimeout(() => {
                            heroSection.style.display = 'none';
                            heroSection.style.pointerEvents = 'none';
                            document.body.classList.remove('landing-mode');
                            document.body.style.overflow = '';
                            document.body.style.position = '';
                            document.body.style.width = '';
                            document.body.style.height = '';
                            document.body.style.top = '';
                            document.body.style.left = '';
                            
                            // Scroll to the clicked target instead of about section
                            const offsetTop = targetSection.offsetTop - 80;
                            window.scrollTo({
                                top: offsetTop,
                                behavior: 'smooth'
                            });
                        }, 800);
                    }
                    
                    // Remove scroll prevention
                    document.removeEventListener('touchmove', function(e) { if (isInLandingMode) e.preventDefault(); }, { passive: false });
                    document.removeEventListener('keydown', function(e) { 
                        if (isInLandingMode) {
                            const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
                            if (scrollKeys.includes(e.keyCode)) {
                                e.preventDefault();
                                return false;
                            }
                        }
                    });
                } else {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Scroll Effects and Animations
function initScrollEffects() {
    // Advanced scroll-based animations
    window.addEventListener('scroll', debounce(handleAdvancedScroll, 10));
}

// Advanced scroll handler
function handleAdvancedScroll() {
    const scrolled = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Parallax effect for project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
            const scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
            const yOffset = (scrollPercent - 0.5) * 50;
            card.style.transform = `translateY(${yOffset}px)`;
        }
    });
    
    // Professional items 3D effect
    const professionalItems = document.querySelectorAll('.professional-item');
    professionalItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
            const scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
            const rotateX = (scrollPercent - 0.5) * 10;
            const translateZ = scrollPercent * 20;
            item.style.transform = `translateZ(${translateZ}px) rotateX(${rotateX}deg)`;
        }
    });
}

// Project Filtering
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter projects
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Video Player
function initVideoPlayer() {
    const videoItems = document.querySelectorAll('.video-item');
    const mainVideo = document.getElementById('main-video');

    if (!mainVideo) {
        return;
    }

    videoItems.forEach(item => {
        item.addEventListener('click', () => {
            const videoSrc = item.getAttribute('data-src');
            const posterImg = item.querySelector('img');
            const posterSrc = posterImg ? posterImg.src : null;
            
            // Update active state
            videoItems.forEach(vi => vi.classList.remove('active'));
            item.classList.add('active');
            
            // Change video source and poster
            if (videoSrc) {
                // Update poster to show the related logo while loading
                if (posterSrc) {
                    mainVideo.poster = posterSrc;
                }
                
                // Find the source element and update it
                const sourceElement = mainVideo.querySelector('source');
                if (sourceElement) {
                    sourceElement.src = videoSrc;
                } else {
                    // If no source element, create one
                    const newSource = document.createElement('source');
                    newSource.src = videoSrc;
                    newSource.type = 'video/mp4';
                    mainVideo.appendChild(newSource);
                }
                
                // Also set the main video src as fallback
                mainVideo.src = videoSrc;
                
                // Reload the video element to pick up new source
                mainVideo.load();
                
                // Add event listener for when video can play
                const handleCanPlay = () => {
                    // Wait 1.5 seconds to display the logo, then auto-play
                    setTimeout(() => {
                        mainVideo.play().catch(error => {
                            console.log('Autoplay prevented by browser:', error);
                            // Fallback: show play button or user interaction required message
                        });
                    }, 1500);
                    mainVideo.removeEventListener('canplay', handleCanPlay);
                };
                
                mainVideo.addEventListener('canplay', handleCanPlay);
                
                console.log('Video source changed to:', videoSrc);
                console.log('Poster updated to:', posterSrc);
                console.log('Will auto-play after 1.5 second delay');
            }
        });
    });

    // Add some debug logging
    console.log('Video player initialized with', videoItems.length, 'video items');
    console.log('Main video element:', mainVideo);
}

function initGoogleReviewsCarousel() {
    const carousels = document.querySelectorAll('[data-review-carousel]');
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
        const track = carousel.querySelector('.review-carousel-track');
        const prevBtn = carousel.querySelector('.review-carousel-btn.prev');
        const nextBtn = carousel.querySelector('.review-carousel-btn.next');
        const showcase = carousel.closest('.google-reviews-showcase');
        const dotsContainer = showcase ? showcase.querySelector('.review-carousel-dots') : null;
        const summaryEl = showcase ? showcase.querySelector('.google-reviews-summary') : null;
        const filterButtons = showcase ? Array.from(showcase.querySelectorAll('[data-review-filter]')) : [];

        if (!track || !prevBtn || !nextBtn || !dotsContainer || !showcase) return;

        const seedEl = showcase.querySelector('#google-reviews-seed');
        let cards = [];
        let currentFilter = 'all';
        let currentIndex = 0;
        let allReviews = [];
        let filteredReviews = [];

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const getInitial = (name) => {
            const clean = String(name || '').trim();
            return clean ? clean.charAt(0).toUpperCase() : '?';
        };

        const formatStars = (count) => {
            const stars = Math.max(1, Math.min(5, Number(count) || 5));
            return '★'.repeat(stars);
        };

        const hasOwnerReply = (review) => {
            if (typeof review.replied === 'boolean') return review.replied;
            return !!(review.ownerReply && review.ownerReply.text);
        };

        const reviewCardMarkup = (review) => {
            const fullText = String(review.text || '').trim();

            return `<article class="review-card" data-review-replied="${hasOwnerReply(review) ? 'true' : 'false'}"><div class="review-card-header"><div class="review-avatar" style="background:${escapeHtml(review.avatarColor || '#1d4ed8')};">${escapeHtml(getInitial(review.name))}</div><div class="review-card-identity"><div class="review-name">${escapeHtml(review.name)}</div><div class="review-meta">${escapeHtml(review.meta || '')}</div></div></div><div class="review-stars" role="img" aria-label="${escapeHtml(String(Number(review.stars) || 5))} stars">${formatStars(review.stars)}</div><p class="review-text"${fullText ? ` title="${escapeHtml(fullText)}"` : ''}>${escapeHtml(fullText)}</p><div class="review-date">${escapeHtml(review.date || '')}</div></article>`;
        };

        const applySummary = (payload) => {
            if (!summaryEl) return;
            const rating = Number(payload.ratingValue || 5).toFixed(1);
            const count = Number(payload.reviewCount || allReviews.length || 0);
            summaryEl.textContent = `${rating} · ${count} reviews`;
            if (typeof window.klApplyGbpRatingPayload === 'function') {
                window.klApplyGbpRatingPayload({
                    ratingValue: Number(rating),
                    reviewCount: count,
                    key: 'knight-logics'
                });
            }
        };

        const reviewFilterPanel = showcase.querySelector('#review-filter-panel');

        const updateFilterButtons = () => {
            let activeTabId = 'review-filter-tab-all';
            filterButtons.forEach((button) => {
                const isActive = button.getAttribute('data-review-filter') === currentFilter;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                button.setAttribute('tabindex', isActive ? '0' : '-1');
                if (isActive && button.id) {
                    activeTabId = button.id;
                }
            });
            if (reviewFilterPanel) {
                reviewFilterPanel.setAttribute('aria-labelledby', activeTabId);
            }
        };

        const visibleCount = () => {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        };

        const pageCount = () => Math.max(1, Math.ceil(cards.length / visibleCount()));
        const maxIndex = () => Math.max(0, cards.length - visibleCount());
        const activePage = () => Math.floor(currentIndex / visibleCount());

        const cardSpan = () => {
            if (!cards.length) return 0;
            const styles = window.getComputedStyle(track);
            const gap = parseFloat(styles.columnGap || styles.gap || '0');
            return cards[0].getBoundingClientRect().width + gap;
        };

        const updateButtons = () => {
            const singlePage = pageCount() <= 1 || cards.length === 0;
            prevBtn.disabled = singlePage || currentIndex <= 0;
            nextBtn.disabled = singlePage || currentIndex >= maxIndex();
        };

        const equalizeReviewCardHeights = () => {
            if (!cards.length) return;
            cards.forEach((card) => {
                card.style.minHeight = '';
            });
            const maxHeight = cards.reduce((max, card) => Math.max(max, card.offsetHeight), 0);
            if (maxHeight > 0) {
                cards.forEach((card) => {
                    card.style.minHeight = `${maxHeight}px`;
                });
            }
        };

        const update = () => {
            currentIndex = Math.max(0, Math.min(currentIndex, maxIndex()));
            track.style.transform = `translateX(-${currentIndex * cardSpan()}px)`;

            dotsContainer.querySelectorAll('.review-carousel-dot').forEach((dot, index) => {
                const isActive = index === activePage();
                dot.classList.toggle('active', isActive);
                if (isActive) {
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.removeAttribute('aria-current');
                }
            });

            updateButtons();
            window.requestAnimationFrame(equalizeReviewCardHeights);
        };

        const applyFilter = (filterKey) => {
            currentFilter = filterKey;

            if (filterKey === 'replied') {
                filteredReviews = allReviews.filter((review) => hasOwnerReply(review));
            } else if (filterKey === 'unreplied') {
                filteredReviews = allReviews.filter((review) => !hasOwnerReply(review));
            } else {
                filteredReviews = allReviews.slice();
            }

            if (!filteredReviews.length) {
                track.innerHTML = '<article class="review-card"><p class="review-text">No reviews in this filter yet.</p></article>';
                cards = Array.from(track.querySelectorAll('.review-card'));
                currentIndex = 0;
                carousel.classList.add('single-review');
                buildDots();
                update();
                updateFilterButtons();
                return;
            }

            track.innerHTML = filteredReviews.map((review) => reviewCardMarkup(review)).join('');
            cards = Array.from(track.querySelectorAll('.review-card'));
            currentIndex = 0;
            carousel.classList.toggle('single-review', cards.length === 1);
            buildDots();
            update();
            updateFilterButtons();
        };

        const parseSeedPayload = () => {
            if (!seedEl) return null;
            try {
                return JSON.parse(seedEl.textContent || '{}');
            } catch (error) {
                console.warn('Google review seed parse failed:', error);
                return null;
            }
        };

        const loadReviews = async () => {
            let payload = null;
            try {
                const response = await fetch(`./data/google-reviews.json?v=20260709gbp1`, { cache: 'no-store' });
                if (response.ok) {
                    payload = await response.json();
                }
            } catch (error) {
                console.warn('Google review feed fetch failed, using seed data:', error);
            }

            if (!payload) {
                payload = parseSeedPayload();
            }

            if (!payload || !Array.isArray(payload.reviews)) {
                payload = { ratingValue: 5, reviewCount: 0, reviews: [] };
            }

            allReviews = payload.reviews.slice();
            applySummary(payload);
            applyFilter('all');
        };

        const buildDots = () => {
            dotsContainer.innerHTML = '';
            const totalPages = pageCount();

            for (let index = 0; index < totalPages; index += 1) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = `review-carousel-dot${index === 0 ? ' active' : ''}`;
                dot.setAttribute('aria-label', `Go to review page ${index + 1}`);
                if (index === 0) {
                    dot.setAttribute('aria-current', 'true');
                }
                dot.addEventListener('click', () => {
                    currentIndex = index * visibleCount();
                    update();
                });
                dotsContainer.appendChild(dot);
            }
        };

        prevBtn.addEventListener('click', () => {
            currentIndex -= 1;
            update();
        });

        nextBtn.addEventListener('click', () => {
            currentIndex += 1;
            update();
        });

        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const filterKey = button.getAttribute('data-review-filter') || 'all';
                applyFilter(filterKey);
            });
        });

        const tablist = showcase.querySelector('[role="tablist"]');
        if (tablist && filterButtons.length) {
            tablist.addEventListener('keydown', (event) => {
                const currentIndex = filterButtons.findIndex(
                    (button) => button.getAttribute('aria-selected') === 'true'
                );
                if (currentIndex < 0) return;

                let nextIndex = currentIndex;
                if (event.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % filterButtons.length;
                } else if (event.key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + filterButtons.length) % filterButtons.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = filterButtons.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                filterButtons[nextIndex].click();
                filterButtons[nextIndex].focus();
            });
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                buildDots();
                update();
            }, 140);
        });

        loadReviews();
    });
}

function formatGbpStars(ratingValue) {
    const rating = Math.max(0, Math.min(5, Number(ratingValue) || 0));
    const filled = Math.max(0, Math.min(5, Math.round(rating)));
    return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

function applyGbpRatingToNode(node, ratingValue, reviewCount) {
    if (!node) return;
    const rating = Number(ratingValue);
    const count = Number(reviewCount);
    if (!Number.isFinite(rating) || !Number.isFinite(count) || count < 0) return;

    const ratingText = rating.toFixed(1);
    const reviewLabel = count === 1 ? '1 Google review' : `${count} Google reviews`;
    const stars = formatGbpStars(rating);
    const label = `${ratingText} out of 5 stars, ${reviewLabel}`;

    if (node.hasAttribute('data-gbp-map-rating') || node.classList.contains('kl-map-rating')) {
        node.textContent = `${stars} ${ratingText} · ${reviewLabel}`;
        node.setAttribute('aria-label', label);
        return;
    }

    node.innerHTML = `${stars} <span>${ratingText} — ${reviewLabel}</span>`;
    node.setAttribute('aria-label', label);
    node.style.color = '#fbbc04';
}

window.klApplyGbpRatingPayload = function klApplyGbpRatingPayload(payload) {
    if (!payload) return;
    const ratingValue = payload.ratingValue;
    const reviewCount = payload.reviewCount;
    const key = payload.key || 'knight-logics';

    document.querySelectorAll(`[data-gbp-map-rating][data-gbp-key="${key}"], .kl-map-rating[data-gbp-key="${key}"]`).forEach((node) => {
        applyGbpRatingToNode(node, ratingValue, reviewCount);
    });

    document.querySelectorAll(`.cs-gbp-inline[data-gbp-key="${key}"] [data-gbp-stars]`).forEach((node) => {
        applyGbpRatingToNode(node, ratingValue, reviewCount);
    });
};

async function initGbpDynamicRatings() {
    const targets = document.querySelectorAll('[data-gbp-stars], [data-gbp-map-rating], .kl-map-rating[data-gbp-key]');
    if (!targets.length) return;

    let payload = null;
    try {
        const response = await fetch(`/data/gbp-ratings.json?v=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) payload = await response.json();
    } catch (error) {
        console.warn('GBP ratings feed fetch failed:', error);
    }

    if (!payload || !payload.byKey) {
        // Homepage map can still hydrate from the Knight Logics reviews feed.
        try {
            const response = await fetch(`/data/google-reviews.json?v=${Date.now()}`, { cache: 'no-store' });
            if (response.ok) {
                const reviewsPayload = await response.json();
                window.klApplyGbpRatingPayload({
                    key: 'knight-logics',
                    ratingValue: reviewsPayload.ratingValue,
                    reviewCount: reviewsPayload.reviewCount
                });
            }
        } catch (error) {
            console.warn('GBP fallback reviews feed fetch failed:', error);
        }
        return;
    }

    Object.keys(payload.byKey).forEach((key) => {
        const entry = payload.byKey[key];
        if (!entry || entry.status === 'error' || entry.status === 'missing-location-id') return;
        if (entry.ratingValue == null || entry.reviewCount == null) return;
        if (Number(entry.reviewCount) <= 0 && entry.status !== 'live') return;
        window.klApplyGbpRatingPayload({
            key,
            ratingValue: entry.ratingValue,
            reviewCount: entry.reviewCount
        });
    });
}

// Skill Bars Animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target;
                const width = skillBar.getAttribute('data-width');
                setTimeout(() => {
                    skillBar.style.width = width;
                }, 200);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => skillObserver.observe(bar));
}

// General Animations
function initAnimations() {
    // Add fade-in class to elements that should animate
    const elementsToAnimate = [
        '.section-header',
        '.about-content',
        '.service-card',
        '.solution-card',
        '.professional-item',
        '.project-card',
        '.skill-category',
        '.video-player-container',
        '.contact-content'
    ];

    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            el.classList.add('fade-in');
            el.style.transitionDelay = `${index * 0.1}s`;
        });
    });

    // Set up intersection observer for the newly added elements
    setupIntersectionObserver();
    
    // Immediately make service cards visible for debugging
    setTimeout(() => {
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.add('visible');
        });
    }, 100);
}

// Case Study Image Lightbox
function initCaseStudyLightbox() {
    const csImages = document.querySelectorAll(
        '.cs-rich-card img, .cs-perf-card img, .cs-search-img img, .cs-preview-card img'
    );
    if (!csImages.length) return;

    if (!document.getElementById('cs-lightbox')) {
        const overlay = document.createElement('div');
        overlay.id = 'cs-lightbox';
        overlay.className = 'cs-lightbox-overlay';
        overlay.innerHTML = '<button class="cs-lightbox-close" aria-label="Close">&times;</button><img src="" alt="">';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function() { overlay.classList.remove('active'); });
        overlay.querySelector('.cs-lightbox-close').addEventListener('click', function(e) {
            e.stopPropagation(); overlay.classList.remove('active');
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') overlay.classList.remove('active');
        });
    }

    const overlay = document.getElementById('cs-lightbox');
    const overlayImg = overlay.querySelector('img');
    csImages.forEach(function(img) {
        img.classList.add('cs-lightbox-trigger');
        img.addEventListener('click', function() {
            overlayImg.src = img.src;
            overlayImg.alt = img.alt;
            overlay.classList.add('active');
        });
    });
}

// Intersection Observer Setup
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special handling for section headers
                if (entry.target.classList.contains('section-header')) {
                    // Animate the text reveal elements inside
                    const textReveals = entry.target.querySelectorAll('.text-reveal');
                    textReveals.forEach((el, index) => {
                        setTimeout(() => {
                            el.classList.add('animate');
                        }, index * 200);
                    });
                }
                
                // Special handling for staggered items
                if (entry.target.classList.contains('stagger-item')) {
                    const staggerItems = entry.target.parentElement.querySelectorAll('.stagger-item');
                    staggerItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('visible');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation - get fresh list including dynamically added fade-in classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .section-header, .stagger-item');
    animatedElements.forEach(el => observer.observe(el));
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Parallax Effect for Hero Section
window.addEventListener('scroll', debounce(() => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    
    if (heroBackground) {
        const speed = scrolled * 0.5;
        heroBackground.style.transform = `translateY(${speed}px)`;
    }
}, 10));

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function initSiteChatWidgetOnInteraction() {
    const events = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
    const handler = () => {
        events.forEach(e => document.removeEventListener(e, handler));
        initSiteChatWidget();
    };
    events.forEach(e => document.addEventListener(e, handler, { once: true, passive: true }));
}

function initSiteChatWidget() {
    if (document.querySelector('script[data-kl-chat="tidio"]')) return;

    const forceTidioCollapsed = () => {
        const collapseViaDom = () => {
            const minimizeButton = document.querySelector('button[aria-label="Minimize chat widget"], button[aria-label="Close chat widget"], button[aria-label="Minimize"]');
            if (minimizeButton) {
                minimizeButton.click();
                return true;
            }
            return false;
        };

        const collapseViaApi = () => {
            const api = window.tidioChatApi;
            if (!api) return false;

            if (typeof api.close === 'function') {
                api.close();
                return true;
            }

            if (typeof api.hide === 'function') {
                api.hide();
                return true;
            }

            return false;
        };

        let attempts = 0;
        const maxAttempts = 20;
        const intervalMs = 500;
        const collapseInterval = window.setInterval(() => {
            attempts += 1;
            const collapsed = collapseViaApi() || collapseViaDom();

            if (collapsed || attempts >= maxAttempts) {
                window.clearInterval(collapseInterval);
            }
        }, intervalMs);
    };

    const script = document.createElement('script');
    script.src = 'https://code.tidio.co/rmlhzyory69fi9cbvxvlfy9hwlt4v6kf.js';
    script.async = true;
    script.dataset.klChat = 'tidio';
    script.addEventListener('load', forceTidioCollapsed);
    document.body.appendChild(script);
}

function suppressDefaultTidioLauncher() {
    // no-op — using stock Tidio widget
}

function _suppressDefaultTidioLauncher_unused() {
    const shadowObserverRoots = new WeakSet();
    const shadowStyleRoots = new WeakSet();

    const hideElement = (el) => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
        el.setAttribute('aria-hidden', 'true');
    };

    const shadowCss = `
        [data-testid="widgetButton"],
        [data-testid="widgetButtonBody"],
        #button,
        #button-body,
        [aria-label="Minimize"],
        button[aria-label="Open chat widget"],
        button[aria-label="Minimize chat widget"],
        button[aria-label="Close chat widget"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
        }
    `;

    const getSearchRoots = () => {
        const roots = [document];
        const queue = [document.documentElement];

        while (queue.length) {
            const current = queue.shift();
            if (!current || !current.querySelectorAll) continue;

            current.querySelectorAll('*').forEach((el) => {
                if (el.shadowRoot) {
                    roots.push(el.shadowRoot);
                    queue.push(el.shadowRoot);
                }
            });
        }

        return roots;
    };

    const ensureShadowStyle = (root) => {
        if (!(root instanceof ShadowRoot) || shadowStyleRoots.has(root)) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = shadowCss;
        root.appendChild(style);
        shadowStyleRoots.add(root);
    };

    const observeShadowRoot = (root, hideLaunchers) => {
        if (!(root instanceof ShadowRoot) || shadowObserverRoots.has(root)) {
            return;
        }

        const observer = new MutationObserver(hideLaunchers);
        observer.observe(root, { childList: true, subtree: true, attributes: true });
        shadowObserverRoots.add(root);
    };

    const shouldHideButton = (button) => {
        if (!button || button.id === 'kl-chat-launcher') {
            return false;
        }

        const label = [
            button.getAttribute('aria-label') || '',
            button.getAttribute('title') || '',
            button.textContent || ''
        ].join(' ').trim().toLowerCase();

        const ancestry = [];
        let current = button;
        while (current && current !== document.body) {
            if (current.id) ancestry.push(current.id.toLowerCase());
            if (typeof current.className === 'string' && current.className) {
                ancestry.push(current.className.toLowerCase());
            }
            current = current.parentElement;
        }

        const ancestryText = ancestry.join(' ');
        if (ancestryText.includes('tidio')) {
            return true;
        }

        if (
            label.includes('chat with us') ||
            label.includes('chat widget') ||
            label.includes('minimize chat') ||
            label.includes('close chat') ||
            label.includes('open chat widget')
        ) {
            return true;
        }

        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        return style.position === 'fixed'
            && rect.width > 0
            && rect.height > 0
            && rect.left > window.innerWidth - 180
            && rect.top > window.innerHeight - 260
            && (label.includes('chat') || label.includes('close') || label.includes('message') || ancestryText.includes('widget'));
    };

    const hideLaunchers = () => {
        const searchRoots = getSearchRoots();
        const ariaSelectors = [
            '[data-testid="widgetButton"]',
            '[data-testid="widgetButtonBody"]',
            '#button',
            '#button-body',
            '[aria-label="Minimize"]',
            'button[aria-label="Open chat widget"]',
            'button[aria-label="Minimize chat widget"]',
            'button[aria-label="Close chat widget"]',
            '#tidio-chat button',
            '[id^="tidio-"] button',
            '[id*="tidio"] button',
            '[class*="tidio"] button'
        ];

        searchRoots.forEach((root) => {
            ensureShadowStyle(root);
            observeShadowRoot(root, hideLaunchers);

            ariaSelectors.forEach((selector) => {
                root.querySelectorAll(selector).forEach((el) => {
                    hideElement(el);
                });
            });
        });

        searchRoots.forEach((root) => {
            root.querySelectorAll('button, [role="button"]').forEach((button) => {
                if (shouldHideButton(button)) {
                    hideElement(button);
                }
            });
        });

        const tidioApi = window.tidioChatApi;
        if (!window.__klChatUserOpened && tidioApi && typeof tidioApi.hide === 'function') {
            tidioApi.hide();
        }
    };

    hideLaunchers();

    if (!document.body) return;
    const observer = new MutationObserver(hideLaunchers);
    observer.observe(document.body, { childList: true, subtree: true });

    let attempts = 0;
    const hideInterval = setInterval(() => {
        hideLaunchers();
        attempts += 1;
        if (attempts >= 20) {
            clearInterval(hideInterval);
        }
    }, 500);
}

function initChatLauncher(config) {
    if (document.getElementById('kl-chat-launcher')) return;

    const chatIconMarkup = `
        <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
            <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95.1 57.1 131.1c-2.6 21.2-10.2 44.4-25.8 67.3c-4.3 6.3-4.7 14.5-1.2 21.2c3.6 6.8 10.5 11 18.2 11c53.5 0 94.8-20.1 122.7-40.8c26.9 8.1 55.6 12.2 85 12.2c141.4 0 256-93.1 256-208S397.4 32 256 32z"/>
        </svg>
    `;
    const closeIconMarkup = `
        <svg viewBox="0 0 384 512" aria-hidden="true" focusable="false">
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3l105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
        </svg>
    `;

    const setLauncherState = (isOpen) => {
        window.__klChatIsOpen = isOpen;
        launcher.style.display = isOpen ? 'none' : '';
        launcher.setAttribute('aria-label', 'Open chat');
        launcher.innerHTML = chatIconMarkup;
        if (isOpen) {
            document.body.classList.add('kl-chat-open');
        } else {
            document.body.classList.remove('kl-chat-open');
        }
    };

    const revealTidioContainers = () => {};

    const hideTidioContainers = () => {};

    const style = document.createElement('style');
    style.id = 'kl-chat-launcher-style';
    style.textContent = `
        #kl-chat-launcher {
            position: fixed;
            right: 22px;
            bottom: 22px;
            width: 58px;
            height: 58px;
            border: 0;
            border-radius: 999px;
            background: linear-gradient(135deg, #64ffda, #4ecdc4);
            color: #0a0a0a;
            cursor: pointer;
            z-index: 2147483000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12px 32px rgba(10, 35, 90, 0.45);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        #kl-chat-launcher:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 38px rgba(78, 205, 196, 0.45);
        }
        #kl-chat-launcher svg {
            width: 26px;
            height: 26px;
            fill: currentColor;
        }
        body:not(.kl-chat-open) [data-testid="widgetButton"],
        body:not(.kl-chat-open) [data-testid="widgetButtonBody"],
        body:not(.kl-chat-open) button[aria-label="Open chat widget"],
        body:not(.kl-chat-open) [aria-label="Minimize"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
        }
        @media (max-width: 768px) {
            #kl-chat-launcher {
                right: 16px;
                bottom: 160px;
                width: 54px;
                height: 54px;
            }
        }
    `;
    document.head.appendChild(style);

    const launcher = document.createElement('button');
    launcher.id = 'kl-chat-launcher';
    launcher.type = 'button';
    setLauncherState(false);

    const closeChat = () => {
        const api = window.tidioChatApi;
        if (api) {
            if (typeof api.close === 'function') {
                api.close();
            }
            if (typeof api.popUpHide === 'function') {
                api.popUpHide();
            }
            if (typeof api.hide === 'function') {
                api.hide();
            }
            if (typeof api.display === 'function') {
                api.display(false);
            }
            if (typeof api.chatDisplay === 'function') {
                api.chatDisplay(false);
            }
        }

        hideTidioContainers();
        setLauncherState(false);
    };

    const registerTidioCloseListener = () => {
        if (window.__klTidioCloseListenerRegistered) return;
        const api = window.tidioChatApi;
        if (api && typeof api.on === 'function') {
            window.__klTidioCloseListenerRegistered = true;
            api.on('close', () => {
                setLauncherState(false);
            });
        }
    };

    const openChat = () => {
        window.__klChatUserOpened = true;
        revealTidioContainers();
        setLauncherState(true);
        registerTidioCloseListener();

        const api = window.tidioChatApi;

        if (api) {
            if (typeof api.show === 'function') {
                api.show();
            }

            if (typeof api.popUpOpen === 'function') {
                api.popUpOpen();
                return;
            }

            if (typeof api.open === 'function') {
                api.open();
                return;
            }

            if (typeof api.display === 'function') {
                api.display(true);
                return;
            }

            if (typeof api.chatDisplay === 'function') {
                api.chatDisplay(true);
                return;
            }
        }

        const existingScript = document.querySelector('script[data-kl-chat="tidio"]');
        if (!existingScript) {
            const publicKey = (config.tidioPublicKey || '').trim();
            if (!publicKey) return;
            const script = document.createElement('script');
            script.src = `https://code.tidio.co/${publicKey}.js`;
            script.async = true;
            script.dataset.klChat = 'tidio';
            document.body.appendChild(script);
        }

        setTimeout(() => {
            revealTidioContainers();
            if (window.tidioChatApi) {
                registerTidioCloseListener();
                if (typeof window.tidioChatApi.show === 'function') {
                    window.tidioChatApi.show();
                }
                if (typeof window.tidioChatApi.popUpOpen === 'function') {
                    window.tidioChatApi.popUpOpen();
                    return;
                }
                if (typeof window.tidioChatApi.open === 'function') {
                    window.tidioChatApi.open();
                    return;
                }
                if (typeof window.tidioChatApi.display === 'function') {
                    window.tidioChatApi.display(true);
                }
            }
        }, 900);
    };

    launcher.addEventListener('click', () => {
        if (config.provider === 'tidio') {
            if (window.__klChatIsOpen) {
                closeChat();
                return;
            }

            openChat();
        }
    });

    document.body.appendChild(launcher);
}

function initChatLauncher() {
    // no-op — using stock Tidio widget
}

// Add scroll to top button
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #64ffda;
        color: #0a0a0a;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(100, 255, 218, 0.3);
    `;
    
    document.body.appendChild(scrollButton);
    
    scrollButton.addEventListener('click', scrollToTop);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.transform = 'translateY(0)';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.transform = 'translateY(10px)';
        }
    });
}

// Scroll-to-top is intentionally disabled because live chat uses this corner.
const ENABLE_SCROLL_TO_TOP_BUTTON = false;
if (ENABLE_SCROLL_TO_TOP_BUTTON) {
    addScrollToTopButton();
}

// Typing Effect for Hero Title (Optional Enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Contact Form Handling (if you want to add a contact form later)
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Since this is a static GitHub Pages site, you could integrate with:
            // - Formspree
            // - Netlify Forms
            // - EmailJS
            // For now, just show a success message
            
            showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#64ffda' : '#ff6b6b'};
        color: ${type === 'success' ? '#0a0a0a' : '#ffffff'};
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Business Contact Form Handler
function initBusinessContactForm() {
    const forms = document.querySelectorAll('.consultation-form');
    if (!forms.length) return;

    const formatFieldLabel = (key) => key
        .replace(/^_+/, '')
        .replace(/([A-Z])/g, ' $1')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

    forms.forEach((form) => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.form-submit-btn');
            const btnText = submitBtn.querySelector('span');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            // Show loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'block';
            
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const businessName = data.businessName || 'Knight Logics Inquiry';
            const contactName = data.contactName || 'Not provided';
            const serviceType = data.serviceType || 'Not specified';
            const projectDetails = data.projectDetails || 'Not provided';
            const timeline = data.timeline || 'Not specified';
            const budget = data.budget || 'Not specified';
            const subject = data._subject || `New Consultation Request from ${businessName}`;
            const reservedKeys = new Set([
                '_subject',
                '_replyto',
                'businessName',
                'contactName',
                'email',
                'serviceType',
                'timeline',
                'budget',
                'projectDetails'
            ]);
            const extraFields = Object.entries(data)
                .filter(([key, value]) => !reservedKeys.has(key) && value)
                .map(([key, value]) => `${formatFieldLabel(key)}: ${value}`);
            
            try {
                // Send form data to Formspree
                const response = await fetch('https://formspree.io/f/xnnggyzp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...data,
                        businessName,
                        contactName,
                        email: data.email,
                        serviceType,
                        timeline,
                        budget,
                        projectDetails,
                        additionalDetails: extraFields.length ? extraFields.join('\n') : 'None provided',
                        _replyto: data.email,
                        _subject: subject
                    })
                });

                if (response.ok) {
                    showBusinessNotification('Thank you! Your consultation request has been sent successfully. We\'ll contact you within 24 hours.', 'success');
                    klNotifyLead('New KL Lead', 'Contact: ' + contactName + '\nEmail: ' + (data.email || '') + '\nService: ' + serviceType);
                    form.reset();
                } else {
                    throw new Error('Network response was not ok');
                }
                
            } catch (error) {
                console.error('Formspree submission error:', error);
                
                // Fallback to mailto if Formspree fails
                const emailSubject = subject;
                const emailBody = `
Business/Organization: ${businessName}
Contact Name: ${contactName}
Email: ${data.email}
Service Type: ${serviceType}
Timeline: ${timeline}
Budget: ${budget}

${extraFields.length ? `${extraFields.join('\n')}
` : ''}

Project Details:
${projectDetails}

---
This message was sent from the Knight Logics contact form on knightlogics.com
                `.trim();
                
                const mailtoLink = `mailto:nickknight488@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                window.location.href = mailtoLink;
                
                showBusinessNotification('Opening your email client as backup. Please send the email to complete your request.', 'info');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                btnText.style.display = 'block';
                btnLoading.style.display = 'none';
            }
        });
    });
}

function showBusinessNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `business-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#64ffda' : '#ff6b6b'};
        color: #0a0a0a;
        padding: 16px 24px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Initialize business contact form
initBusinessContactForm();

// Performance optimization: Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling for missing videos or images
function handleMediaErrors() {
    const videos = document.querySelectorAll('video');
    const images = document.querySelectorAll('img');
    
    videos.forEach(video => {
        video.addEventListener('error', (e) => {
            console.warn('Video failed to load:', video.src);
            video.style.display = 'none';
        });
    });
    
    images.forEach(img => {
        img.addEventListener('error', (e) => {
            console.warn('Image failed to load:', img.src);
            img.style.opacity = '0.5';
            img.alt = 'Image not available';
        });
    });
}

// Initialize error handling
handleMediaErrors();

// Mobile Read More functionality for About section
function initMobileReadMore() {
    const readMoreBtn = document.getElementById('about-read-more');
    const truncatedContent = document.querySelector('.mobile-truncated-content');
    const readMoreText = readMoreBtn?.querySelector('.read-more-text');
    const readLessText = readMoreBtn?.querySelector('.read-less-text');
    
    if (!readMoreBtn || !truncatedContent) return;
    
    readMoreBtn.addEventListener('click', function() {
        const isExpanded = truncatedContent.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            truncatedContent.classList.remove('expanded');
            readMoreBtn.classList.remove('expanded');
            readMoreText.style.display = 'inline';
            readLessText.style.display = 'none';
            
            // Scroll back to the About section header for better UX
            setTimeout(() => {
                document.querySelector('#about .section-header').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        } else {
            // Expand
            truncatedContent.classList.add('expanded');
            readMoreBtn.classList.add('expanded');
            readMoreText.style.display = 'none';
            readLessText.style.display = 'inline';
        }
    });
}

// Work Read More Toggle Function
function toggleWorkContent(button) {
    const workContent = button.closest('.work-content');
    const previewText = workContent.querySelector('.work-preview');
    const fullText = workContent.querySelector('.work-full');
    
    if (fullText.style.display === 'none') {
        // Show full content
        previewText.style.display = 'none';
        fullText.style.display = 'block';
        button.textContent = 'Read Less';
    } else {
        // Show preview content
        previewText.style.display = 'block';
        fullText.style.display = 'none';
        button.textContent = 'Read More';
    }
}

// Browser compatibility check
function checkBrowserSupport() {
    const isModernBrowser = 'IntersectionObserver' in window && 
                           'fetch' in window && 
                           'CSS' in window && 
                           CSS.supports('display', 'grid');
    
    if (!isModernBrowser) {
        console.warn('Some features may not work in this browser. Please update for the best experience.');
    }
}

checkBrowserSupport();

// Export functions for potential external use
window.portfolioFunctions = {
    scrollToTop,
    showNotification,
    typeWriter
};

// ── Interactive contact chips ──

function copyEmail(chip) {
    const email = chip.querySelector('.chip-email-addr').textContent.trim();
    const hint = chip.querySelector('.chip-copy-hint');
    const originalHint = hint ? (hint.dataset.originalHtml || hint.innerHTML) : '';

    if (hint && !hint.dataset.originalHtml) {
        hint.dataset.originalHtml = originalHint;
    }

    navigator.clipboard.writeText(email).then(() => {
        if (!hint) {
            return;
        }

        hint.textContent = 'Copied';
        hint.classList.add('copied');
        setTimeout(() => {
            hint.innerHTML = originalHint;
            hint.classList.remove('copied');
        }, 2000);
    });
}

function closePhoneMenus() {
    document.querySelectorAll('.contact-chip-phone.open').forEach(chip => {
        chip.classList.remove('open');
        chip.setAttribute('aria-expanded', 'false');
    });
}

function togglePhoneMenu(chip) {
    const isOpen = chip.classList.contains('open');

    closePhoneMenus();

    if (!isOpen) {
        chip.classList.add('open');
        chip.setAttribute('aria-expanded', 'true');
    }
}

function openMapModal() {
    const modal = document.getElementById('mapModal');
    if (!modal) {
        return;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const dialog = modal.querySelector('.chip-map-inner');
    if (dialog) {
        dialog.focus();
    }
}

function closeMapModal(e) {
    const modal = document.getElementById('mapModal');
    if (!modal) {
        return;
    }

    const shouldClose = !e
        || e.target === e.currentTarget
        || (e.currentTarget && e.currentTarget.classList.contains('chip-map-close'));

    if (shouldClose) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

document.querySelectorAll('.work-read-more').forEach(button => {
    button.addEventListener('click', () => toggleWorkContent(button));
});

const contactEmailChip = document.getElementById('contactEmailChip');
if (contactEmailChip) {
    contactEmailChip.addEventListener('click', () => copyEmail(contactEmailChip));
}

const contactPhoneChip = document.getElementById('contactPhoneChip');
if (contactPhoneChip) {
    contactPhoneChip.addEventListener('click', () => togglePhoneMenu(contactPhoneChip));
    contactPhoneChip.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePhoneMenu(contactPhoneChip);
        }
    });

    contactPhoneChip.querySelectorAll('.chip-phone-menu a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    });
}

const serviceAreaChip = document.getElementById('serviceAreaChip');
if (serviceAreaChip) {
    serviceAreaChip.addEventListener('click', openMapModal);
}

const mapModal = document.getElementById('mapModal');
if (mapModal) {
    mapModal.addEventListener('click', closeMapModal);
}

document.querySelectorAll('.chip-map-close').forEach(button => {
    button.addEventListener('click', closeMapModal);
});

// Close phone menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.contact-chip-phone')) {
        closePhoneMenus();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePhoneMenus();

        if (mapModal && mapModal.classList.contains('open')) {
            closeMapModal();
        }
    }
});

// ============================================================
// MOBILE BOTTOM SHEET DRAWER
// ============================================================
(function() {
    const CTABar      = document.getElementById('mobileCTABar');
    const CTABtn      = document.getElementById('mobileCTABtn');
    const backdrop    = document.getElementById('mobileSheetBackdrop');
    const sheet       = document.getElementById('mobileSheet');
    const closeBtn    = document.getElementById('mobileSheetClose');

    if (!CTABtn || !sheet) return;

    function openSheet() {
        sheet.classList.add('is-open');
        backdrop.classList.add('is-open');
        CTABar.classList.add('sheet-open');
        CTABtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        // Focus first input after animation
        setTimeout(function() {
            var first = sheet.querySelector('input, select, textarea');
            if (first) first.focus();
        }, 340);
    }

    function closeSheet() {
        sheet.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        CTABar.classList.remove('sheet-open');
        CTABtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    CTABtn.addEventListener('click', openSheet);
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    // Swipe down to close
    var touchStartY = 0;
    sheet.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener('touchend', function(e) {
        var delta = e.changedTouches[0].clientY - touchStartY;
        if (delta > 60 && sheet.scrollTop === 0) closeSheet();
    }, { passive: true });

    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sheet.classList.contains('is-open')) closeSheet();
    });

    // Wire up form submission for the mobile sheet form
    var mobileForm = document.getElementById('mobileSheetForm');
    if (mobileForm) {
        mobileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = mobileForm.querySelector('.form-submit-btn');
            var label = btn.querySelector('span');
            var loading = btn.querySelector('.btn-loading');
            btn.disabled = true;
            if (label) label.style.display = 'none';
            if (loading) loading.style.display = 'block';

            fetch(mobileForm.action, {
                method: 'POST',
                body: new FormData(mobileForm),
                headers: { 'Accept': 'application/json' }
            }).then(function(r) {
                if (r.ok) {
                    var mName = (document.getElementById('mobileContactName') || {}).value || 'Unknown';
                    var mEmail = (document.getElementById('mobileEmail') || {}).value || '';
                    klNotifyLead('KL Mobile Form', 'Contact: ' + mName + '\nEmail: ' + mEmail);
                    mobileForm.innerHTML = '<div class="form-success-message" style="text-align:center;padding:2rem 0;"><p style="color:#64ffda;font-size:1.1rem;font-weight:700;">Request sent!</p><p style="color:rgba(255,255,255,0.7);margin-top:0.5rem;">We\'ll be in touch shortly.</p></div>';
                    setTimeout(closeSheet, 2200);
                } else {
                    btn.disabled = false;
                    if (label) label.style.display = '';
                    if (loading) loading.style.display = 'none';
                    alert('Something went wrong. Please try again or call (813) 773-5553.');
                }
            }).catch(function() {
                btn.disabled = false;
                if (label) label.style.display = '';
                if (loading) loading.style.display = 'none';
                alert('Network error. Please try again or call (813) 773-5553.');
            });
        });
    }
})();

// PWA Install Banner — intercepts native prompt and shows custom dismissible banner
(function initPWABanner() {
    const STORAGE_KEY = 'kl_pwa_dismissed';
    let deferredPrompt = null;
    let bannerEl = null;

    function buildBanner() {
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.setAttribute('role', 'complementary');
        banner.setAttribute('aria-label', 'Install Knight Logics app');
        banner.innerHTML = `
            <img class="pwa-install-icon" src="./images/KnightLogicsLogo2.png" alt="Knight Logics" width="40" height="40">
            <div class="pwa-install-text">
                <strong>Knight Logics</strong>
                <span>Add to your home screen</span>
            </div>
            <button class="pwa-install-btn" aria-label="Install app">Install</button>
            <button class="pwa-dismiss-btn" aria-label="Dismiss">&times;</button>
        `;

        banner.querySelector('.pwa-install-btn').addEventListener('click', () => {
            hideBanner();
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
            }
        });

        banner.querySelector('.pwa-dismiss-btn').addEventListener('click', () => {
            hideBanner(true);
        });

        document.body.appendChild(banner);
        return banner;
    }

    function showBanner() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        if (!bannerEl) bannerEl = buildBanner();
        // Small delay so the CSS transition fires
        setTimeout(() => {
            if (!bannerEl) return;
            bannerEl.classList.add('pwa-visible');
            document.body.classList.add('kl-pwa-banner-visible');
        }, 50);
    }

    function hideBanner(persist) {
        document.body.classList.remove('kl-pwa-banner-visible');
        if (bannerEl) {
            bannerEl.classList.remove('pwa-visible');
            setTimeout(() => {
                if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
                bannerEl = null;
            }, 450);
        }
        if (persist) localStorage.setItem(STORAGE_KEY, '1');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // suppress native banner
        deferredPrompt = e;
        // Show after 4s - give the user time to settle on the page
        setTimeout(showBanner, 4000);
    });

    // iOS does not fire beforeinstallprompt - skip (Safari handles its own sheet)
}());

const KL_PAGE_SCRIPTS_VER = '20260712proof1';

function loadPageScript(src, testFn) {
    if (typeof testFn === 'function' && testFn()) return Promise.resolve();
    return new Promise((resolve) => {
        const existing = document.querySelector(`script[data-kl-page-script="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = `${src}?v=${KL_PAGE_SCRIPTS_VER}`;
        script.defer = true;
        script.dataset.klPageScript = src;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}

function initPageFeatureScripts() {
    const jobs = [];
    if (document.querySelector('[data-gbp-showcase]')) {
        jobs.push(loadPageScript('/gbp-showcase.js', () => typeof window.klInitGbpShowcase === 'function').then(() => {
            if (typeof window.klInitGbpShowcase === 'function') window.klInitGbpShowcase();
        }));
    }
    if (document.querySelector('[data-referral-demo]')) {
        jobs.push(loadPageScript('/referral-demo.js'));
    }
    if (document.querySelector('[data-crm-outreach-demo]')) {
        jobs.push(loadPageScript('/crm-outreach-demo.js'));
    }
    return Promise.all(jobs);
}

function initPricingStickyNav() {
    const hero = document.querySelector('.pricing-hero, .pricing-hero-inner');
    const pillsWrap = document.querySelector('.pricing-hero .pricing-nav-pills');
    if (!pillsWrap || document.querySelector('.pricing-sticky-nav')) return;

    const sticky = document.createElement('div');
    sticky.className = 'pricing-sticky-nav';
    const inner = document.createElement('div');
    inner.className = 'container';
    const clone = pillsWrap.cloneNode(true);
    inner.appendChild(clone);
    sticky.appendChild(inner);
    pillsWrap.parentNode.insertBefore(sticky, pillsWrap.parentNode.children[pillsWrap.parentNode.children.length > 1 ? 1 : 0]?.nextSibling || null);

    const chips = document.createElement('div');
    chips.className = 'pricing-package-selector';
    chips.setAttribute('role', 'tablist');
    chips.setAttribute('aria-label', 'Package category');
    const categories = [
        { id: 'all', label: 'All packages' },
        { id: 'websites', label: 'Website', anchor: '#websites' },
        { id: 'stores', label: 'Stores', anchor: '#ecommerce' },
        { id: 'monthly', label: 'Monthly', anchor: '#monthly' },
        { id: 'growth', label: 'Growth', anchor: '#growth' },
        { id: 'addons', label: 'Extras', anchor: '#addons' },
        { id: 'programs', label: 'Programs', anchor: '#referral-systems' }
    ];
    const sectionMap = {
        websites: ['#websites'],
        stores: ['#ecommerce'],
        monthly: ['#monthly'],
        growth: ['#growth'],
        addons: ['#addons'],
        programs: ['#referral-systems']
    };

    categories.forEach((cat, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pricing-package-chip' + (i === 0 ? ' is-active' : '');
        btn.textContent = cat.label;
        btn.dataset.pricingFilter = cat.id;
        if (cat.anchor) btn.dataset.pricingAnchor = cat.anchor;
        chips.appendChild(btn);
    });
    inner.appendChild(chips);

    function applyFilter(id) {
        chips.querySelectorAll('.pricing-package-chip').forEach((b) => {
            b.classList.toggle('is-active', b.dataset.pricingFilter === id);
        });
        const allowed = sectionMap[id];
        document.querySelectorAll('.pricing-section[id]').forEach((sec) => {
            if (id === 'all') {
                sec.classList.remove('is-filtered-out');
                return;
            }
            const hash = '#' + sec.id;
            sec.classList.toggle('is-filtered-out', !allowed || !allowed.includes(hash));
        });
    }

    chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.pricing-package-chip');
        if (!btn) return;
        const id = btn.dataset.pricingFilter || 'all';
        applyFilter(id);
        if (btn.dataset.pricingAnchor) {
            const target = document.querySelector(btn.dataset.pricingAnchor);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    clone.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

function initServiceSidebarForms() {
    document.querySelectorAll('[data-svc-sidebar-form]').forEach((mount) => {
        if (mount.dataset.sidebarInit === '1') return;
        mount.dataset.sidebarInit = '1';

        const service = mount.dataset.serviceLabel || 'Website / SEO';
        const market = mount.dataset.marketLabel || 'Tampa Bay';
        const form = document.createElement('form');
        form.className = 'svc-sidebar-form-inner';
        form.action = 'https://formspree.io/f/xpwzgkqr';
        form.method = 'POST';
        form.innerHTML = `
            <h3>Request a free audit</h3>
            <p>Short form — we reply within 24 hours with next steps for ${service} in ${market}.</p>
            <div class="form-group"><label for="sb-name">Business name</label><input id="sb-name" name="businessName" required></div>
            <div class="form-group"><label for="sb-url">Website or GBP URL</label><input id="sb-url" name="websiteUrl" type="url" placeholder="https://"></div>
            <div class="form-group"><label for="sb-email">Email</label><input id="sb-email" name="email" type="email" required></div>
            <div class="form-group"><label for="sb-problem">Primary problem</label><textarea id="sb-problem" name="primaryProblem" placeholder="Rankings, leads, GBP, site redesign…"></textarea></div>
            <input type="hidden" name="leadSource" value="Service page sidebar">
            <input type="hidden" name="requestedService" value="${service}">
            <input type="hidden" name="market" value="${market}">
            <button type="submit" class="btn-primary">Send audit request</button>`;
        mount.appendChild(form);
    });
}

function initCityLandingFormSidebar() {
    const formShell = document.querySelector('.city-hero-layout .city-hero-form-shell');
    const articleContainer = document.querySelector('article .container');
    if (!formShell || !articleContainer || articleContainer.dataset.citySidebarInit === '1') return;

    articleContainer.dataset.citySidebarInit = '1';

    const heroLayout = document.querySelector('.city-hero-layout');
    if (heroLayout) heroLayout.classList.add('city-hero-layout--solo');

    const main = document.createElement('div');
    main.className = 'city-article-main';
    while (articleContainer.firstChild) {
        main.appendChild(articleContainer.firstChild);
    }

    const sidebar = document.createElement('aside');
    sidebar.className = 'city-article-sidebar';
    sidebar.setAttribute('aria-label', formShell.getAttribute('aria-label') || 'Contact Knight Logics');
    sidebar.appendChild(formShell);

    articleContainer.classList.add('city-article-layout');
    articleContainer.appendChild(main);
    articleContainer.appendChild(sidebar);
}
