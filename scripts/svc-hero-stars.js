/**
 * Green particle stars for inner-page heroes — same ambient layer as the
 * landing hero (hero-experiment.js drawStars), without the Asteroids game.
 */
(function initSvcHeroStars() {
    const GREEN = '#64ffda';
    const GREEN_RGB = '100, 255, 218';
    const LINK_DIST = 132;
    const MOUSE_LINK_DIST = 180;
    const MOUSE_REPEL = 13000;
    const MOUSE_REPEL_R = 114;
    const CTA_STARS_SELECTORS = '.cs-cta-section, .svc-cta-section, .profile-cta-section, .svc-cta-band';

    function starCount(w, h) {
        const area = w * Math.max(h, 220);
        const byArea = Math.round(area / 5200);
        const byWidth = Math.round(w / 7);
        // Ultrawide hero+actions bands need denser nodes so the lower half
        // still reads as the same constellation field.
        return Math.max(96, Math.min(360, Math.max(byArea, byWidth)));
    }

    function heroWidth(hero) {
        const rect = hero.getBoundingClientRect();
        const w = Math.round(rect.width || hero.offsetWidth || 0);
        if (w > 0) return w;
        return Math.round(document.documentElement.clientWidth || window.innerWidth || 1);
    }

    function resolveActionsBar(hero) {
        const next = hero.nextElementSibling;
        return next && next.classList.contains('kl-hero-actions-bar') ? next : null;
    }

    function ensureStarsZone(hero) {
        if (!hero) return null;
        let zone = hero.closest('.kl-stars-hero-zone');
        if (zone) return zone;

        const actionsBar = resolveActionsBar(hero);
        zone = document.createElement('div');
        zone.className = 'kl-stars-hero-zone';
        hero.parentNode.insertBefore(zone, hero);
        zone.appendChild(hero);
        if (actionsBar) zone.appendChild(actionsBar);
        return zone;
    }

    function injectStarsMarkup(host) {
        if (!host || host.querySelector(':scope > .svc-hero-stars')) return;
        host.insertAdjacentHTML('afterbegin', `
            <div class="svc-hero-stars" aria-hidden="true">
                <div class="svc-hero-stars__bg"></div>
                <canvas class="svc-hero-stars__canvas"></canvas>
            </div>`);
    }

    function mountStars(wrap, zone, hero) {
        if (!wrap || !zone || !hero) return;
        if (wrap.dataset.starsInit === '1') {
            if (typeof wrap._klStarsResize === 'function') wrap._klStarsResize();
            return;
        }
        const canvas = wrap.querySelector('.svc-hero-stars__canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0;
        let H = 0;
        let stars = [];
        let raf = 0;
        let running = true;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mouse = { x: -1, y: -1 };
        const smoothMouse = { x: -1, y: -1 };
        let actionsBar = resolveActionsBar(hero);
        let observedBar = null;

        wrap.dataset.starsInit = '1';

        function getZoneRect() {
            const rect = zone.getBoundingClientRect();
            return {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            };
        }

        function pointerInZone(clientX, clientY) {
            const z = getZoneRect();
            return clientX >= z.left
                && clientX <= z.left + z.width
                && clientY >= z.top
                && clientY <= z.top + z.height;
        }

        function clientToCanvas(clientX, clientY) {
            const z = getZoneRect();
            return {
                x: clientX - z.left,
                y: clientY - z.top,
            };
        }

        function onPointerLeave() {
            mouse.x = -1;
            mouse.y = -1;
        }

        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => resize())
            : null;

        function bindActionsBar() {
            // Prefer the bar already inside the zone (after wrap), then sibling.
            actionsBar = zone.querySelector('.kl-hero-actions-bar') || resolveActionsBar(hero);
            if (actionsBar && actionsBar.parentElement !== zone) {
                zone.appendChild(actionsBar);
            }
            if (actionsBar === observedBar) return;
            if (observedBar) {
                observedBar.removeEventListener('mouseleave', onPointerLeave);
                if (ro) {
                    try { ro.unobserve(observedBar); } catch (_) { /* ignore */ }
                }
            }
            observedBar = actionsBar;
            if (actionsBar) {
                actionsBar.addEventListener('mouseleave', onPointerLeave);
                if (ro) ro.observe(actionsBar);
            }
        }

        function resize() {
            bindActionsBar();
            const w = Math.max(1, Math.round(zone.getBoundingClientRect().width || heroWidth(hero)));
            const h = Math.max(
                1,
                Math.round(zone.getBoundingClientRect().height || (hero.offsetHeight + (actionsBar ? actionsBar.offsetHeight : 0)))
            );
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = w;
            H = h;
            wrap.style.width = '100%';
            wrap.style.height = '100%';
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildStars();
            if (reduced) drawStatic();
            else if (!raf && !document.hidden) raf = requestAnimationFrame(draw);
        }

        function buildStars() {
            stars = [];
            const n = reduced ? Math.min(48, starCount(W, H)) : starCount(W, H);
            for (let i = 0; i < n; i++) {
                const hx = Math.random() * W;
                const hy = Math.random() * H;
                stars.push({
                    x: hx,
                    y: hy,
                    hx,
                    hy,
                    vx: 0,
                    vy: 0,
                    r: 0.9 + Math.random() * 2.1,
                    twinkle: Math.random() * Math.PI * 2,
                });
            }
        }

        function smoothPointer() {
            if (mouse.x < 0) {
                smoothMouse.x = -1;
                smoothMouse.y = -1;
                return;
            }
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.18;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.18;
        }

        function updateStars(now) {
            const mx = smoothMouse.x;
            const my = smoothMouse.y;
            const driftX = reduced ? 0.04 : 0.18;
            const driftY = reduced ? 0.03 : 0.14;
            const t = now || 0;

            stars.forEach((p) => {
                p.vx += (p.hx - p.x) * 0.004;
                p.vy += (p.hy - p.y) * 0.004;
                if (!reduced && mx >= 0) {
                    const dx = p.x - mx;
                    const dy = p.y - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < MOUSE_REPEL) {
                        const d = Math.sqrt(d2) || 1;
                        const f = ((MOUSE_REPEL_R - d) / MOUSE_REPEL_R) * 2.2;
                        p.vx += (dx / d) * f;
                        p.vy += (dy / d) * f;
                    }
                }
                p.vx *= 0.9;
                p.vy *= 0.9;
                p.x += p.vx + Math.sin(t * 0.0004 + p.hy) * driftX;
                p.y += p.vy + Math.cos(t * 0.0005 + p.hx) * driftY;
            });
        }

        function drawCursorGlow(mx, my) {
            if (mx < 0) return;
            const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 96);
            glow.addColorStop(0, `rgba(${GREEN_RGB}, 0.14)`);
            glow.addColorStop(0.45, `rgba(${GREEN_RGB}, 0.05)`);
            glow.addColorStop(1, `rgba(${GREEN_RGB}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(mx, my, 96, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawLinks(mx, my) {
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const a = stars[i];
                    const b = stars[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d > LINK_DIST) continue;
                    const alpha = (1 - d / LINK_DIST) * 0.22;
                    ctx.strokeStyle = `rgba(${GREEN_RGB}, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            if (mx >= 0) {
                for (let i = 0; i < stars.length; i += 2) {
                    const p = stars[i];
                    const d = Math.hypot(p.x - mx, p.y - my);
                    if (d < MOUSE_LINK_DIST) {
                        ctx.strokeStyle = `rgba(${GREEN_RGB}, ${(1 - d / MOUSE_LINK_DIST) * 0.48})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mx, my);
                        ctx.stroke();
                    }
                }
            }
        }

        function drawDots(now) {
            const t = now || 0;
            stars.forEach((p) => {
                const pulse = reduced ? 1 : 0.88 + Math.sin(t * 0.002 + p.twinkle) * 0.12;
                ctx.fillStyle = `rgba(${GREEN_RGB}, ${0.42 * pulse})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = GREEN;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.shadowBlur = 0;
        }

        function drawFrame(now) {
            ctx.clearRect(0, 0, W, H);
            smoothPointer();
            if (!reduced) updateStars(now);
            drawCursorGlow(smoothMouse.x, smoothMouse.y);
            drawLinks(smoothMouse.x, smoothMouse.y);
            drawDots(now);
        }

        function drawStatic() {
            drawFrame(0);
        }

        function draw(now) {
            if (!running) return;
            drawFrame(now);
            raf = requestAnimationFrame(draw);
        }

        function onPointerMove(e) {
            if (!pointerInZone(e.clientX, e.clientY)) {
                if (mouse.x >= 0) {
                    mouse.x = -1;
                    mouse.y = -1;
                }
                return;
            }
            const pos = clientToCanvas(e.clientX, e.clientY);
            mouse.x = pos.x;
            mouse.y = pos.y;
        }

        document.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('blur', onPointerLeave);
        hero.addEventListener('mouseleave', onPointerLeave);

        resize();
        if (!reduced) raf = requestAnimationFrame(draw);
        else drawStatic();

        if (ro) {
            ro.observe(zone);
            ro.observe(hero);
            bindActionsBar();
        } else {
            window.addEventListener('resize', resize);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(raf);
                raf = 0;
            } else if (!reduced) {
                running = true;
                resize();
                raf = requestAnimationFrame(draw);
            }
        });

        wrap._klStarsResize = resize;
    }

    function findHeroInner(section) {
        const selectors = [
            '.svc-hero-inner',
            '.cs-hero-inner',
            '.profile-hero-inner',
            '.contact-page-hero-inner',
            '.ed-hero-copy',
            '.container > div',
        ];
        for (let i = 0; i < selectors.length; i++) {
            const node = section.querySelector(selectors[i]);
            if (node) return node;
        }
        return section.querySelector('.container');
    }

    function setupHeroStars(hero) {
        if (!hero) return;
        if (hero.classList.contains('pixelforge-hero')
            || hero.classList.contains('videoforge-hero')
            || hero.classList.contains('displayplus-hero')
            || hero.querySelector('.pixelforge-hero-grid, .videoforge-hero-layout, .displayplus-hero-layout')) {
            return;
        }
        const zone = ensureStarsZone(hero);
        // Move any legacy in-hero stars layer up into the shared zone.
        const legacy = hero.querySelector(':scope > .svc-hero-stars');
        if (legacy && legacy.parentElement !== zone) {
            zone.insertBefore(legacy, zone.firstChild);
        }
        injectStarsMarkup(zone);
        mountStars(zone.querySelector(':scope > .svc-hero-stars'), zone, hero);
    }

    function upgradeToStarsHero(section) {
        if (!section || section.dataset.starsUpgraded === '1') return;
        if (section.classList.contains('pixelforge-hero')
            || section.classList.contains('videoforge-hero')
            || section.classList.contains('displayplus-hero')
            || section.querySelector('.pixelforge-hero-grid, .videoforge-hero-layout, .displayplus-hero-layout')) {
            return;
        }
        section.dataset.starsUpgraded = '1';
        section.classList.add('svc-hero', 'svc-hero--stars');
        section.classList.remove(
            'svc-hero--panels',
            'pricing-hero',
            'profile-hero',
            'cs-hero',
            'automation-hero',
            'referral-hero',
            'ed-hero'
        );
        section.removeAttribute('style');

        section.querySelectorAll('.hero-panels, .svc-hero-overlay').forEach((el) => el.remove());

        const inner = findHeroInner(section);
        if (inner && !inner.classList.contains('svc-hero-inner')) {
            inner.classList.add('svc-hero-inner', 'fade-in');
        }

        setupHeroStars(section);
    }

    function setupSurfaceStars(surface) {
        if (!surface || surface.dataset.starsSurfaceInit === '1') return;
        surface.dataset.starsSurfaceInit = '1';
        surface.classList.add('kl-stars-surface');
        injectStarsMarkup(surface);
        mountStars(surface.querySelector(':scope > .svc-hero-stars'), surface, surface);
    }

    function initCtaStars() {
        document.querySelectorAll(CTA_STARS_SELECTORS).forEach((surface) => setupSurfaceStars(surface));
    }

    function refreshCtaStars() {
        document.querySelectorAll(CTA_STARS_SELECTORS).forEach((surface) => {
            const wrap = surface.querySelector(':scope > .svc-hero-stars');
            if (wrap && typeof wrap._klStarsResize === 'function') wrap._klStarsResize();
            else setupSurfaceStars(surface);
        });
    }

    function initAll() {
        document.querySelectorAll('.svc-hero--stars').forEach((hero) => setupHeroStars(hero));
        initCtaStars();
    }

    function refreshAll() {
        document.querySelectorAll('.svc-hero--stars').forEach((hero) => {
            const zone = hero.closest('.kl-stars-hero-zone') || ensureStarsZone(hero);
            const wrap = zone.querySelector(':scope > .svc-hero-stars');
            if (wrap && typeof wrap._klStarsResize === 'function') wrap._klStarsResize();
            else setupHeroStars(hero);
        });
        refreshCtaStars();
    }

    window.klUpgradeHeroToStars = upgradeToStarsHero;
    window.klInitSvcHeroStars = initAll;
    window.klInitCtaStars = initCtaStars;
    window.klRefreshSvcHeroStars = refreshAll;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(initAll));
    } else {
        requestAnimationFrame(initAll);
    }
})();
