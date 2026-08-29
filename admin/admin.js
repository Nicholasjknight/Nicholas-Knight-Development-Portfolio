(function () {
    'use strict';

    var SITE = window.location.origin;
    var SESSION_KEY = 'kl_admin_session';
    var SECRET_KEY = 'kl_admin_secret';
    var ROLE_KEY = 'kl_admin_role';
    var LOG_MAX = 250;

    var AGENCY_MODULES = ['books', 'outreach', 'email', 'social-ops', 'social-poster', 'access'];

    var MODULES = {
        overview: { label: 'Command Center', panel: 'panel-overview' },
        referrals: { label: 'Referrals', panel: 'panel-referrals', embed: '/referral-dashboard?embed=1' },
        books: { label: 'Books', panel: 'panel-books' },
        outreach: {
            label: 'Outreach CRM',
            panel: 'panel-outreach',
            localUrl: 'http://127.0.0.1:5050/?embed=1&module=outreach',
            help: 'Run OutreachEngine: cd CRM\\OutreachEngine && python app.py',
        },
        email: {
            label: 'Email Agent',
            panel: 'panel-email',
            localUrl: 'http://127.0.0.1:5100/?embed=1',
            help: 'Started automatically from Knight Command when reachable, or run Email-Agent\\web.py',
        },
        'social-ops': {
            label: 'Social Ops',
            panel: 'panel-social-ops',
            localUrl: 'http://127.0.0.1:8500/?embed=true',
            help: 'Run Social-Media-Manager\\run_social_services_hidden.ps1',
        },
        'social-poster': {
            label: 'Social Poster',
            panel: 'panel-social-poster',
            localUrl: 'http://127.0.0.1:8501/?embed=true',
            help: 'Run Social-Media-Manager\\run_social_services_hidden.ps1',
        },
        logs: { label: 'Logs', panel: 'panel-logs' },
        access: { label: 'Access', panel: 'panel-access', masterOnly: true },
    };

    var REMOTE_MODULE_MAP = {
        outreach: 'outreach',
        email: 'email',
        'social-ops': 'social_ops',
        'social-poster': 'social_poster',
    };

    var LOCAL_OPS_ORIGINS = [
        'http://127.0.0.1:5050',
        'http://127.0.0.1:5100',
        'http://127.0.0.1:8500',
        'http://127.0.0.1:8501',
        'http://localhost:5050',
        'http://localhost:5100',
        'http://localhost:8500',
        'http://localhost:8501',
    ];

    var CLOUD_OPS_ORIGINS = [
        'https://ops.knightlogics.com',
        'https://mail.knightlogics.com',
        'https://social.knightlogics.com',
        'https://poster.knightlogics.com',
    ];

    var HANDSHAKE_MODULES = { email: true, outreach: true };
    var pendingReady = {};
    var OPS_READY_WAIT_MS = 12000;
    var OPS_IFRAME_FALLBACK_MS = 1500;

    var state = {
        token: '',
        secret: '',
        role: '',
        activeModule: 'overview',
        logs: [],
        health: null,
        localProbe: {},
        remoteModules: {},
        opsOrigins: [],
        opsEmbedUrls: {},
        embedReady: {},
    };

    function $(id) { return document.getElementById(id); }

    function log(level, message, detail) {
        var entry = {
            ts: new Date().toISOString(),
            level: level,
            message: message,
            detail: detail || null,
        };
        state.logs.unshift(entry);
        if (state.logs.length > LOG_MAX) {
            state.logs.length = LOG_MAX;
        }
        var prefix = '[Knight Command]';
        if (level === 'error') console.error(prefix, message, detail || '');
        else if (level === 'warn') console.warn(prefix, message, detail || '');
        else console.log(prefix, message, detail || '');
        renderLogs();
    }

    function knightlogicsOpsOrigin(origin) {
        try {
            var host = new URL(origin).hostname.toLowerCase();
            return host === 'knightlogics.com' || host.endsWith('.knightlogics.com');
        } catch (err) {
            return false;
        }
    }

    function opsHandshakeOriginOk(origin, extraUrl) {
        if (!origin) return false;
        if (CLOUD_OPS_ORIGINS.indexOf(origin) >= 0) return true;
        if (LOCAL_OPS_ORIGINS.indexOf(origin) >= 0) return true;
        if (state.opsOrigins.indexOf(origin) >= 0) return true;
        if (knightlogicsOpsOrigin(origin)) return true;
        var urls = extraUrl ? [extraUrl] : [];
        Object.keys(state.opsEmbedUrls || {}).forEach(function (key) {
            if (state.opsEmbedUrls[key]) urls.push(state.opsEmbedUrls[key]);
        });
        for (var i = 0; i < urls.length; i++) {
            try {
                if (new URL(urls[i]).origin === origin) return true;
            } catch (err) { /* ignore */ }
        }
        return false;
    }

    function pingOpsReady(frame, embedUrl) {
        if (!frame || !frame.contentWindow || !frame.contentWindow.postMessage) return;
        var target = '*';
        try {
            if (embedUrl) target = new URL(embedUrl).origin;
        } catch (err) { /* keep * */ }
        try {
            frame.contentWindow.postMessage({ type: 'kl-ops-ping' }, target);
        } catch (err) {
            try { frame.contentWindow.postMessage({ type: 'kl-ops-ping' }, '*'); } catch (err2) { /* ignore */ }
        }
    }

    function saveSession(token, role) {
        state.token = token;
        state.role = role || '';
        sessionStorage.setItem(SESSION_KEY, token);
        try { localStorage.setItem(SESSION_KEY, token); } catch (err) { /* private mode */ }
        if (role) {
            sessionStorage.setItem(ROLE_KEY, role);
            try { localStorage.setItem(ROLE_KEY, role); } catch (err) { /* private mode */ }
        }
    }

    function loadSessionRole() {
        return sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY) || '';
    }

    function clearSession() {
        state.token = '';
        state.secret = '';
        state.role = '';
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SECRET_KEY);
        sessionStorage.removeItem(ROLE_KEY);
        try {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(SECRET_KEY); // legacy cleanup if an older build wrote it
        } catch (err) { /* private mode */ }
    }

    function applyRoleUi() {
        var isMaster = state.role === 'master';
        var badge = $('role-badge');
        if (badge) {
            badge.hidden = !state.role;
            badge.textContent = isMaster ? 'Master' : 'Owner';
            badge.className = 'kc-role-badge ' + (isMaster ? 'master' : 'owner');
        }
        var accessTab = $('tab-access');
        if (accessTab) accessTab.hidden = !isMaster;
        AGENCY_MODULES.forEach(function (moduleId) {
            var tab = document.querySelector('.kc-tab[data-module="' + moduleId + '"]');
            if (tab) tab.hidden = !isMaster;
        });
    }

    function canOpenModule(moduleId) {
        if (state.role === 'master') return true;
        return AGENCY_MODULES.indexOf(moduleId) < 0;
    }

    async function apiPost(path, body) {
        var payload = Object.assign({}, body || {});
        if (state.token && !payload.token && !payload.secret) {
            payload.token = state.token;
        }
        log('info', 'API POST ' + path, payload.token ? { token: '(session)' } : undefined);
        var response = await fetch(SITE + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        var data = {};
        try {
            data = await response.json();
        } catch (err) {
            if (response.status === 404 && path.indexOf('/api/') === 0) {
                data = {
                    error: 'API route not found. Run `npm run dev:full` (Vercel dev on port 4199), not plain static serve.',
                };
            } else {
                data = { error: 'Non-JSON response (' + response.status + ')' };
            }
        }
        if (!response.ok) {
            log('error', path + ' failed', { status: response.status, data: data });
            throw new Error((data && data.error) || ('HTTP ' + response.status));
        }
        log('info', path + ' OK');
        return data;
    }

    function showAuth(show) {
        $('auth-gate').style.display = show ? 'flex' : 'none';
        $('kc-shell').classList.toggle('open', !show);
    }

    function renderLogs() {
        var list = $('log-list');
        if (!list) return;
        if (!state.logs.length) {
            list.innerHTML = '<li><span class="ts">—</span>No log entries yet.</li>';
            return;
        }
        list.innerHTML = state.logs.map(function (entry) {
            var detail = entry.detail ? ' — ' + JSON.stringify(entry.detail) : '';
            return '<li><span class="ts">' + entry.ts + '</span>' +
                '<span class="lvl-' + entry.level + '">[' + entry.level.toUpperCase() + ']</span> ' +
                entry.message + detail + '</li>';
        }).join('');
    }

    function applyRemoteModulesFromHealth(health) {
        state.remoteModules = (health && health.remoteModules) || {};
        state.opsOrigins = [];
        Object.keys(state.remoteModules).forEach(function (key) {
            var mod = state.remoteModules[key];
            if (mod && mod.origin && state.opsOrigins.indexOf(mod.origin) < 0) {
                state.opsOrigins.push(mod.origin);
            }
        });
        updateOverviewIntro(health);
        updateQuickOpenLinks();
    }

    var TUNNEL_FALLBACK = {
        outreach: 'https://ops.knightlogics.com/?embed=1&module=outreach',
        email: 'https://mail.knightlogics.com/?embed=1',
        'social-ops': 'https://social.knightlogics.com/?embed=true',
        'social-poster': 'https://poster.knightlogics.com/?embed=true',
    };

    function isMixedContentLocal(url) {
        return window.location.protocol === 'https:' &&
            /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(String(url || ''));
    }

    function isLocalServiceUrl(url) {
        return /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(String(url || ''));
    }

    function isUsableRemote(remote) {
        return !!(remote && remote.url && remote.status !== 'error');
    }

    function resolveModuleUrl(moduleId) {
        var remoteKey = REMOTE_MODULE_MAP[moduleId];
        var remote = remoteKey && state.remoteModules[remoteKey];
        var cfg = MODULES[moduleId];
        var localUrl = (cfg && cfg.localUrl) || (cfg && cfg.embed) || '';
        // HTTPS admin cannot iframe http://127.0.0.1 — use cloud tunnel when configured.
        if (isUsableRemote(remote)) return remote.url;
        if (window.location.protocol === 'https:' && TUNNEL_FALLBACK[moduleId]) {
            return TUNNEL_FALLBACK[moduleId];
        }
        if (localUrl && !isMixedContentLocal(localUrl)) return localUrl;
        if (remote && remote.url) return remote.url;
        return localUrl;
    }

    function isRemoteModule(moduleId) {
        var remoteKey = REMOTE_MODULE_MAP[moduleId];
        var remote = remoteKey && state.remoteModules[remoteKey];
        if (isUsableRemote(remote)) return true;
        var cfg = MODULES[moduleId];
        var localUrl = (cfg && cfg.localUrl) || '';
        if (window.location.protocol === 'https:' && (TUNNEL_FALLBACK[moduleId] || (remote && remote.url))) return true;
        if (isMixedContentLocal(localUrl) && remote && remote.url) return true;
        return false;
    }

    function updateOverviewIntro(health) {
        var intro = $('overview-intro');
        if (!intro) return;
        var hasRemote = Object.keys(state.remoteModules).some(function (key) {
            return isUsableRemote(state.remoteModules[key]);
        });
        if (hasRemote) {
            intro.innerHTML = '<strong>Referrals</strong> runs in the cloud. ' +
                '<strong>Outreach, Email, and Social</strong> use your configured cloud ops host when available — works from any device. ' +
                'If cloud ops is offline, start local services on this PC as fallback.';
        } else {
            intro.innerHTML = '<strong>Referrals</strong> runs in the cloud. ' +
                '<strong>Outreach, Email, Social Ops, and Social Poster</strong> use local services on this computer (<code>127.0.0.1</code>) unless cloud ops URLs are configured on Vercel.';
        }
    }

    function updateQuickOpenLinks() {
        document.querySelectorAll('[data-open-module]').forEach(function (btn) {
            var moduleId = btn.getAttribute('data-open-module');
            var url = resolveModuleUrl(moduleId);
            if (url) btn.setAttribute('data-open-local', url);
        });
    }

    function updateHash(moduleId) {
        try {
            var next = (moduleId && moduleId !== 'overview') ? ('#' + moduleId) : window.location.pathname + window.location.search;
            history.replaceState(null, '', next);
        } catch (err) { /* ignore */ }
    }

    function moduleFromHash() {
        var hashModule = (window.location.hash || '').replace(/^#\/?/, '').trim();
        return MODULES[hashModule] ? hashModule : 'overview';
    }

    function remountModule(moduleId) {
        var cfg = MODULES[moduleId];
        if (!cfg || !cfg.panel) return;
        var prefix = cfg.panel.replace('panel-', '');
        var frame = $(prefix + '-frame');
        if (!frame) return;
        if (pendingReady[prefix]) {
            try { pendingReady[prefix](false); } catch (err) {}
            delete pendingReady[prefix];
        }
        state.embedReady[prefix] = false;
        frame.dataset.opsReady = '';
        frame.dataset.loaded = '';
        frame.removeAttribute('src');
        frame.src = 'about:blank';
    }

    function setActiveModule(moduleId) {
        if (!MODULES[moduleId]) return;
        if (!canOpenModule(moduleId)) {
            moduleId = 'overview';
        }
        state.activeModule = moduleId;
        document.querySelectorAll('.kc-tab').forEach(function (tab) {
            tab.classList.toggle('active', tab.dataset.module === moduleId);
        });
        document.querySelectorAll('.kc-panel').forEach(function (panel) {
            panel.classList.remove('open');
        });
        var cfg = MODULES[moduleId];
        var panel = $(cfg.panel);
        if (panel) panel.classList.add('open');

        if (cfg.embed) {
            mountEmbed(cfg.panel.replace('panel-', ''), cfg.embed);
        } else if (cfg.localUrl) {
            var prefix = cfg.panel.replace('panel-', '');
            var url = resolveModuleUrl(moduleId);
            if (isRemoteModule(moduleId)) {
                mountOpsEmbed(prefix, url, cfg.help || '');
            } else {
                mountLocalEmbed(prefix, url, cfg.help || '');
            }
        } else if (moduleId === 'overview') {
            refreshOverview();
        } else if (moduleId === 'books') {
            refreshBooksPanel();
        } else if (moduleId === 'access') {
            refreshAccessPanel();
        }
        updateHash(moduleId);
    }

    function syncAuthToEmbedStorage() {
        if (state.secret) sessionStorage.setItem(SECRET_KEY, state.secret);
        if (state.token) {
            sessionStorage.setItem(SESSION_KEY, state.token);
            try { localStorage.setItem(SESSION_KEY, state.token); } catch (err) { /* private mode */ }
        }
        if (state.role) {
            sessionStorage.setItem(ROLE_KEY, state.role);
            try { localStorage.setItem(ROLE_KEY, state.role); } catch (err) { /* private mode */ }
        }
    }

    function mountEmbed(prefix, src) {
        var frame = $(prefix + '-frame');
        if (!frame) return;
        syncAuthToEmbedStorage();

        if (prefix === 'referrals') {
            mountReferralsEmbed(frame, src);
            return;
        }

        if (frame.dataset.loaded !== src) {
            frame.src = src;
            frame.dataset.loaded = src;
            log('info', 'Embed loaded', { src: src });
        }
    }

    function buildReferralsEmbedSrc(src) {
        var nextSrc = src.indexOf('?') >= 0 ? src + '&from=admin' : src + '?from=admin';
        // Hash handoff: not sent to the server, survives sessionStorage iframe partition quirks.
        // Token only — never put the raw master/owner password in the URL.
        if (state.token) {
            var hashParts = ['kl_admin_token=' + encodeURIComponent(state.token)];
            if (state.role) hashParts.push('kl_admin_role=' + encodeURIComponent(state.role));
            nextSrc += '#' + hashParts.join('&');
        }
        return nextSrc;
    }

    function pushAdminAuthToReferrals(target) {
        if (!state.token && !state.secret) return;
        var win = target || (($('referrals-frame') || {}).contentWindow);
        if (!win || !win.postMessage) return;
        try {
            win.postMessage({
                type: 'kl-admin-auth',
                token: state.token,
                secret: state.secret,
                role: state.role,
            }, window.location.origin);
        } catch (err) {
            log('warn', 'Referrals iframe postMessage failed', { error: String(err.message) });
        }
    }

    function mountReferralsEmbed(frame, src) {
        var wrap = frame.parentElement;
        var fallback = $('referrals-fallback');
        if (!fallback && wrap) {
            fallback = document.createElement('div');
            fallback.id = 'referrals-fallback';
            fallback.className = 'kc-referrals-fallback';
            fallback.innerHTML =
                '<div class="kc-card" style="max-width:560px;margin:40px auto;text-align:center;padding:28px;">' +
                '<h2 style="margin-bottom:8px;">Referral CRM</h2>' +
                '<p style="color:var(--muted);margin-bottom:18px;">If the embedded view stays blank, open Referral CRM directly. Your admin session will carry over.</p>' +
                '<a class="kc-btn kc-btn-primary" href="/referral-dashboard?embed=1&from=admin">Open Referral CRM</a>' +
                '</div>';
            wrap.appendChild(fallback);
        }

        function hideFallback() {
            if (fallback) fallback.style.display = 'none';
            frame.style.display = 'block';
        }

        function showFallback() {
            if (fallback) fallback.style.display = 'block';
            frame.style.display = 'none';
        }

        frame.onload = function () {
            try {
                pushAdminAuthToReferrals(frame.contentWindow);
                // Retry — child listener can miss the first postMessage on slow parses.
                setTimeout(function () { pushAdminAuthToReferrals(frame.contentWindow); }, 250);
                setTimeout(function () { pushAdminAuthToReferrals(frame.contentWindow); }, 1000);
                hideFallback();
                log('info', 'Referrals iframe loaded');
            } catch (err) {
                showFallback();
                log('warn', 'Referrals iframe postMessage failed', { error: String(err.message) });
            }
        };

        frame.onerror = function () {
            showFallback();
            log('warn', 'Referrals iframe error');
        };

        var nextSrc = buildReferralsEmbedSrc(src);
        // Compare without hash so a refreshed token still reloads the embed.
        var loadedBase = (frame.dataset.loaded || '').split('#')[0];
        var nextBase = nextSrc.split('#')[0];
        if (loadedBase !== nextBase || !frame.getAttribute('src') || frame.getAttribute('src') === 'about:blank') {
            showFallback();
            frame.src = nextSrc;
            frame.dataset.loaded = nextBase;
            log('info', 'Referrals embed loading', { src: nextBase });
            setTimeout(function () {
                if (frame.style.display === 'none') return;
                try {
                    var doc = frame.contentDocument;
                    if (!doc || !doc.body || !doc.body.innerHTML) showFallback();
                } catch (err) {
                    showFallback();
                }
            }, 4000);
        } else {
            // Already mounted — re-push session (e.g. tab revisit after parent login).
            pushAdminAuthToReferrals(frame.contentWindow);
            hideFallback();
        }
    }

    window.addEventListener('message', function (event) {
        if (!event.data) return;

        if (event.data.type === 'kl-ops-ready' || event.data.type === 'kl-ops-error') {
            if (!opsHandshakeOriginOk(event.origin, state.opsEmbedUrls[event.data.module] || state.opsEmbedUrls.email)) {
                log('warn', 'Rejected ops handshake origin', {
                    origin: event.origin,
                    type: event.data.type,
                    module: event.data.module || '',
                });
                return;
            }
            var readyPrefix = event.data.module === 'email_agent' ? 'email' : event.data.module;
            log('info', 'Ops handshake received', {
                type: event.data.type,
                module: readyPrefix,
                origin: event.origin,
                pending: typeof pendingReady[readyPrefix] === 'function',
            });
            state.embedReady[readyPrefix] = event.data.type === 'kl-ops-ready';
            var readyFrame = $(readyPrefix + '-frame');
            if (readyFrame) readyFrame.dataset.opsReady = event.data.type === 'kl-ops-ready' ? '1' : '';
            if (typeof pendingReady[readyPrefix] === 'function') {
                pendingReady[readyPrefix](event.data.type === 'kl-ops-ready');
                delete pendingReady[readyPrefix];
            } else if (event.data.type === 'kl-ops-ready') {
                var lateWrap = $('embed-status-' + readyPrefix);
                if (lateWrap) {
                    lateWrap.classList.remove('open');
                    lateWrap.style.display = 'none';
                }
                log('info', 'Late ops ready hid overlay after timeout', { module: readyPrefix });
            }
            if (event.data.type === 'kl-ops-error') {
                var errorWrap = $('embed-status-' + readyPrefix);
                if (errorWrap) {
                    errorWrap.classList.add('open');
                    errorWrap.style.display = 'flex';
                    errorWrap.querySelector('[data-embed-title]').textContent = 'Module failed to load';
                    errorWrap.querySelector('[data-embed-detail]').textContent =
                        String(event.data.error || 'The embedded service returned an error.').slice(0, 300);
                }
                log('warn', 'Cloud ops module reported a load error', {
                    module: readyPrefix,
                    error: String(event.data.error || ''),
                });
            }
            return;
        }

        if (event.data.type === 'kl-ops-auth-request') {
            var opsAllowed = state.opsOrigins.indexOf(event.origin) >= 0
                || LOCAL_OPS_ORIGINS.indexOf(event.origin) >= 0;
            if (!opsAllowed) return;
            if (!state.secret && !state.token) return;
            if (event.source && event.source.postMessage) {
                event.source.postMessage({
                    type: 'kl-ops-auth',
                    token: state.token,
                    secret: state.secret,
                    role: state.role,
                }, event.origin);
            }
            return;
        }

        if (event.origin !== window.location.origin) return;
        if (event.data.type !== 'kl-admin-auth-request') return;
        if (!state.token && !state.secret) return;
        if (event.source && event.source.postMessage) {
            event.source.postMessage({
                type: 'kl-admin-auth',
                token: state.token,
                secret: state.secret,
                role: state.role,
            }, event.origin);
            return;
        }
        pushAdminAuthToReferrals();
    });

    function pushOpsAuthToFrame(frame, localUrl) {
        if (!frame || !frame.contentWindow) return;
        var origins = state.opsOrigins.slice();
        if (localUrl) {
            try {
                var localOrigin = new URL(localUrl).origin;
                if (origins.indexOf(localOrigin) < 0) origins.push(localOrigin);
            } catch (err) {
                log('warn', 'Could not parse local ops URL', { url: localUrl });
            }
        }
        LOCAL_OPS_ORIGINS.forEach(function (origin) {
            if (origins.indexOf(origin) < 0) origins.push(origin);
        });
        origins.forEach(function (origin) {
            try {
                frame.contentWindow.postMessage({
                    type: 'kl-ops-auth',
                    token: state.token,
                    secret: state.secret,
                    role: state.role,
                }, origin);
            } catch (err) {
                log('warn', 'Ops auth postMessage failed', { origin: origin, error: String(err.message) });
            }
        });
    }

    async function mountOpsEmbed(prefix, url, help) {
        var wrap = $('embed-status-' + prefix);
        var frame = $(prefix + '-frame');
        if (!frame) return;
        var embedUrl = withOpsToken(url);
        var showOverlay = function (title, detail) {
            if (!wrap) return;
            wrap.classList.add('open');
            wrap.style.display = 'flex';
            wrap.querySelector('[data-embed-title]').textContent = title;
            wrap.querySelector('[data-embed-detail]').textContent = detail;
        };
        var hideOverlay = function () {
            if (!wrap) return;
            wrap.classList.remove('open');
            wrap.style.display = 'none';
        };
        showOverlay('Connecting to cloud ops…', help || 'Loading inside this tab — it will not open a new window.');
        state.opsEmbedUrls[prefix] = embedUrl;

        if (typeof pendingReady[prefix] === 'function') {
            try { pendingReady[prefix](false); } catch (err) {}
            delete pendingReady[prefix];
        }

        var needsHandshake = !!HANDSHAKE_MODULES[prefix];
        var alreadyReady = needsHandshake &&
            frame.dataset.loaded === embedUrl &&
            (frame.dataset.opsReady === '1' || state.embedReady[prefix]);
        if (alreadyReady) {
            hideOverlay();
            pushOpsAuthToFrame(frame, embedUrl);
            pingOpsReady(frame, embedUrl);
            log('info', 'Ops embed already ready — overlay skipped', { prefix: prefix, url: embedUrl });
            return;
        }

        var readyTimer = null;
        var loadFallbackTimer = null;
        if (needsHandshake) {
            readyTimer = window.setTimeout(function () {
                log('warn', 'Ops handshake slow', { prefix: prefix, url: embedUrl, iframeLoaded: frame.dataset.loaded === embedUrl });
                // Keep pendingReady so a late kl-ops-ready still hides the overlay.
                if (frame.dataset.loaded === embedUrl || (frame.src && frame.src !== 'about:blank')) {
                    hideOverlay();
                    state.embedReady[prefix] = true;
                    frame.dataset.opsReady = '1';
                    log('info', 'Hiding overlay after timeout because iframe already loaded', { prefix: prefix });
                } else {
                    showOverlay(
                        'Still connecting…',
                        'The module is taking longer than usual. Retry stays in this tab — the inbox behind this screen may already be usable.'
                    );
                }
            }, OPS_READY_WAIT_MS);
            pendingReady[prefix] = function (ok) {
                if (readyTimer) window.clearTimeout(readyTimer);
                if (loadFallbackTimer) window.clearTimeout(loadFallbackTimer);
                state.embedReady[prefix] = !!ok;
                frame.dataset.opsReady = ok ? '1' : '';
                if (ok) hideOverlay();
            };
        }

        frame.onload = function () {
            pushOpsAuthToFrame(frame, embedUrl);
            pingOpsReady(frame, embedUrl);
            if (!needsHandshake) hideOverlay();
            log('info', 'Cloud ops iframe loaded', { url: embedUrl });
            if (needsHandshake) {
                loadFallbackTimer = window.setTimeout(function () {
                    if (typeof pendingReady[prefix] === 'function' && frame.dataset.opsReady !== '1') {
                        log('info', 'Assuming ops module usable after iframe load', { prefix: prefix });
                        pendingReady[prefix](true);
                        delete pendingReady[prefix];
                    }
                }, OPS_IFRAME_FALLBACK_MS);
            }
        };
        frame.onerror = function () {
            frame.dataset.loaded = '';
            frame.dataset.opsReady = '';
            state.embedReady[prefix] = false;
            if (readyTimer) window.clearTimeout(readyTimer);
            if (loadFallbackTimer) window.clearTimeout(loadFallbackTimer);
            delete pendingReady[prefix];
            showOverlay(
                'Cloud ops unreachable',
                (help || '') + ' Confirm this PC is on and the tunnel is running, then retry in this tab.'
            );
            log('warn', 'Cloud ops iframe error', { url: embedUrl });
        };
        if (frame.dataset.loaded !== embedUrl) {
            frame.src = embedUrl;
            frame.dataset.loaded = embedUrl;
        } else {
            pushOpsAuthToFrame(frame, embedUrl);
            pingOpsReady(frame, embedUrl);
            if (!needsHandshake) hideOverlay();
        }
        setTimeout(function () { pushOpsAuthToFrame(frame, embedUrl); pingOpsReady(frame, embedUrl); }, 800);
    }

    function withOpsToken(url) {
        if (!state.secret) return url;
        try {
            var parsed = new URL(url);
            var host = parsed.hostname;
            var port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
            var isLocalOps = (host === '127.0.0.1' || host === 'localhost') &&
                (port === '5050' || port === '5100');
            var isCloudOps = host === 'ops.knightlogics.com' ||
                host === 'mail.knightlogics.com' ||
                host === 'social.knightlogics.com' ||
                host === 'poster.knightlogics.com';
            if (!isLocalOps && !isCloudOps) return url;
            // Streamlit hosts ignore kl_ops_token; only Flask ops need it.
            if (host === 'social.knightlogics.com' || host === 'poster.knightlogics.com') return url;
            if (!parsed.searchParams.get('kl_ops_token')) {
                parsed.searchParams.set('kl_ops_token', state.secret);
            }
            return parsed.toString();
        } catch (err) {
            return url;
        }
    }

    function withLocalOpsToken(url) {
        return withOpsToken(url);
    }

    async function mountLocalEmbed(prefix, url, help) {
        var wrap = $('embed-status-' + prefix);
        var frame = $(prefix + '-frame');
        if (!frame) return;
        var embedUrl = withLocalOpsToken(url);
        var serviceMap = {
            email: 'email_agent',
            'social-ops': 'social_ops',
            'social-poster': 'social_poster',
        };
        var serviceName = serviceMap[prefix];
        var needsLoad = frame.dataset.loaded !== embedUrl;
        var isLocalTarget = isLocalServiceUrl(embedUrl);

        if (isMixedContentLocal(url)) {
            if (wrap) {
                wrap.classList.add('open');
                wrap.style.display = 'flex';
                wrap.querySelector('[data-embed-title]').textContent = 'Local-only on this tab';
                wrap.querySelector('[data-embed-detail]').textContent =
                    'Knight Command is HTTPS, so the browser blocks embedding http://127.0.0.1. ' +
                    'Configure KL_SOCIAL_POSTER_URL on Vercel (poster.knightlogics.com) or open the app directly on this PC.';
            }
            frame.style.display = 'none';
            log('warn', 'Mixed content blocked local embed', { prefix: prefix, url: url });
            return;
        }

        var hideOverlay = function () {
            if (wrap) {
                wrap.classList.remove('open');
                wrap.style.display = 'none';
            }
        };
        var showOverlay = function (title, detail) {
            if (!wrap) return;
            wrap.classList.add('open');
            wrap.style.display = 'flex';
            wrap.querySelector('[data-embed-title]').textContent = title;
            wrap.querySelector('[data-embed-detail]').textContent = detail;
        };

        if (needsLoad) {
            showOverlay('Connecting to local service…', help || 'Service must run on this PC.');
        }
        frame.style.display = 'block';

        frame.onload = function () {
            hideOverlay();
            pushOpsAuthToFrame(frame, embedUrl);
            log('info', 'Local iframe loaded', { url: embedUrl });
        };
        frame.onerror = function () {
            showOverlay(
                'Local service unreachable',
                (help || '') + ' Open the URL directly if the embed stays blank.'
            );
            log('warn', 'Local iframe error', { url: url });
        };

        if (needsLoad) {
            frame.src = embedUrl;
            frame.dataset.loaded = embedUrl;
            setTimeout(hideOverlay, 2500);
        } else {
            hideOverlay();
            pushOpsAuthToFrame(frame, embedUrl);
            log('info', 'Local iframe reused', { url: embedUrl });
        }

        setTimeout(function () { pushOpsAuthToFrame(frame, embedUrl); }, 300);
        setTimeout(function () { pushOpsAuthToFrame(frame, embedUrl); }, 1200);
        setTimeout(function () { pushOpsAuthToFrame(frame, embedUrl); }, 3000);

        if (serviceName && isLocalTarget) {
            fetch('http://127.0.0.1:5050/api/services/ensure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: [serviceName], wait: false }),
            }).then(function (response) {
                return response.json().then(function (data) {
                    if (data && data.all_ok) hideOverlay();
                    log('info', 'Requested local service start (background)', { service: serviceName, data: data });
                });
            }).catch(function () {
                log('warn', 'Could not reach OutreachEngine on :5050 to auto-start service', { service: serviceName });
            });
        }
        if (prefix === 'outreach' && isLocalTarget) {
            fetch('http://127.0.0.1:5050/api/health', { method: 'GET' })
                .then(function (response) {
                    if (response.ok) hideOverlay();
                })
                .catch(function () {
                    showOverlay(
                        'Outreach CRM is not running',
                        'Start OutreachEngine: cd CRM\\OutreachEngine && python app.py'
                    );
                });
        }
        if (prefix === 'email' && isLocalTarget) {
            fetch('http://127.0.0.1:5100/api/health', { method: 'GET' })
                .then(function (response) {
                    if (response.ok) hideOverlay();
                })
                .catch(function () {
                    showOverlay(
                        'Email Agent is not running',
                        'Run Email-Agent\\web.py or npm run dev:stack from MainSite'
                    );
                });
        }
        if (isLocalTarget) probeLocal(embedUrl, prefix);
    }

    async function probeLocal(url, prefix) {
        var statusEl = $('local-status-' + prefix);
        if (statusEl) {
            statusEl.className = 'kc-status pending';
            statusEl.textContent = 'Checking…';
        }
        try {
            var controller = new AbortController();
            var timer = setTimeout(function () { controller.abort(); }, 2500);
            await fetch(url, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(timer);
            state.localProbe[prefix] = 'maybe';
            if (statusEl) {
                statusEl.className = 'kc-status warn';
                statusEl.textContent = 'Probe sent — confirm in iframe';
            }
            log('info', 'Local probe dispatched', { url: url });
        } catch (err) {
            state.localProbe[prefix] = 'fail';
            if (statusEl) {
                statusEl.className = 'kc-status err';
                statusEl.textContent = 'Not reachable from browser';
            }
            log('warn', 'Local probe failed (expected off-PC or service stopped)', { url: url, error: String(err) });
        }
    }

    async function refreshOverview() {
        var grid = $('overview-grid');
        if (grid) {
            grid.innerHTML = '<div class="kc-card"><h3>Status</h3><strong>Loading…</strong><p>Checking cloud modules.</p></div>';
        }
        refreshIncomeOverview().catch(function () {});
        try {
            var health = await apiPost('/api/admin', { action: 'health' });
            state.health = health;
            applyRemoteModulesFromHealth(health);
            renderOverview(health);
        } catch (err) {
            if (String(err.message).indexOf('expired') >= 0 || String(err.message).indexOf('Forbidden') >= 0) {
                logout(true);
                return;
            }
            if (grid) {
                grid.innerHTML = '<div class="kc-card"><span class="kc-status err">Error</span><strong>Health check failed</strong><p>' +
                    String(err.message) + '</p></div>';
            }
        }
    }

    function money(n) {
        return '$' + Number(n || 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    function escHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    var BIZ_LABELS = {
        kl: 'Knight Logics',
        kg: 'Knight Group',
        st: 'Screen Team',
        fw: 'Faith Works',
        rm: 'Roof Monsters',
    };

    async function fetchLocalOutreach(path) {
        if (window.location.protocol === 'https:') {
            throw new Error('Local Outreach probe blocked on HTTPS admin');
        }
        var response = await fetch('http://127.0.0.1:5050' + path, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok) {
            throw new Error((data && data.error) || ('Local Outreach HTTP ' + response.status));
        }
        data.source = 'local_outreach';
        return data;
    }

    async function fetchLocalRevenueScorecard() {
        return fetchLocalOutreach('/api/revenue-scorecard');
    }

    async function fetchClientBooks() {
        var data;
        try {
            data = await apiPost('/api/admin', { action: 'client-books' });
        } catch (cloudErr) {
            data = await fetchLocalOutreach('/api/client-books');
            log('warn', 'Client books used local Outreach fallback', {
                cloudError: String(cloudErr.message || cloudErr),
            });
        }
        state.clientBooks = data;
        return data;
    }

    function weekCardsHtml(period) {
        if (!period) return '';
        var lanes = [
            { key: 'st', title: 'Screen Team', sub: 'Chris', lane: period.st || {} },
            { key: 'fw', title: 'Faith Works', sub: 'Tyler', lane: period.fw || {} },
            { key: 'rm', title: 'Roof Monsters', sub: 'Stripe', lane: period.rm || {} },
            { key: 'combined', title: 'Combined clients', sub: 'ST + FW + RM', lane: period.combined_clients || {} },
        ];
        return '<div class="kc-week-block"><h3>' + escHtml(period.week_label) +
            (period.is_current ? ' · this week' : '') + '</h3>' +
            '<p class="kc-muted">' + Number((period.combined_clients && period.combined_clients.payments) || 0) +
            ' client payments · ' + money((period.combined_clients && period.combined_clients.received) || 0) + '</p>' +
            '<div class="kc-week-grid">' + lanes.map(function (item) {
                return '<div class="kc-week-card ' + item.key + '"><h4>' + item.title +
                    ' · ' + item.sub + '</h4><div class="amt">' + money(item.lane.received) +
                    '</div><div class="sub">' + Number(item.lane.payments || 0) + ' payments</div></div>';
            }).join('') + '</div></div>';
    }

    async function refreshIncomeOverview() {
        var meta = $('income-overview-meta');
        var summary = $('income-overview-summary');
        var body = $('income-overview-body');
        if (!body) return;
        if (meta) meta.textContent = 'Loading…';
        try {
            var data;
            try {
                data = await fetchClientBooks();
            } catch (booksErr) {
                try {
                    data = await apiPost('/api/admin', { action: 'revenue-scorecard' });
                } catch (cloudErr) {
                    data = await fetchLocalRevenueScorecard();
                    log('warn', 'Income overview used local Outreach fallback', {
                        cloudError: String(cloudErr.message || cloudErr),
                        booksError: String(booksErr.message || booksErr),
                    });
                }
            }
            renderIncomeOverview(data);
        } catch (err) {
            if (meta) meta.textContent = 'Unavailable';
            if (summary) summary.innerHTML = '';
            body.innerHTML = '<p class="kc-income-foot">Income ledger unavailable: ' +
                escHtml(err.message || err) +
                '. Start OutreachEngine (:5050) + tunnel, then refresh.</p>';
            log('warn', 'Income overview failed', { error: String(err.message || err) });
        }
    }

    function renderIncomeOverview(data) {
        var meta = $('income-overview-meta');
        var summary = $('income-overview-summary');
        var body = $('income-overview-body');
        var weeksEl = $('income-overview-weeks');
        if (!body) return;

        var totals = data.payment_totals || data.totals || {};
        var lanes = data.lanes || {};
        var byBiz = data.by_business || {};
        var order = data.attention_order || Object.keys(BIZ_LABELS);
        var allocated = totals.revenue_allocated != null ? totals.revenue_allocated : totals.revenue;
        var zelleIn = Number(totals.zelle_inbound || 0) + Number(totals.manual || 0);
        var kgOps = (data.compensation_estimates &&
            data.compensation_estimates.kg_ops_estimate_on_recorded_kg_revenue) || 0;
        var stamp = String(data.generated_at || '').replace('T', ' ').slice(0, 19) || 'now';
        if (meta) {
            meta.textContent = 'Updated ' + stamp +
                (data.source === 'local_outreach' ? ' · local' : ' · ops');
        }

        if (summary) {
            var cards = [
                { label: 'ST + FW + RM', value: data.client_total, cls: 'gold' },
                { label: 'Allocated', value: allocated, cls: '' },
                { label: 'Stripe', value: totals.stripe_receipts, cls: '' },
                { label: 'Zelle / manual', value: zelleIn, cls: 'gold' },
                { label: 'Unallocated', value: totals.revenue_unallocated, cls: 'warn' },
                { label: 'KG ops ~25%', value: kgOps, cls: 'gold' },
            ];
            summary.innerHTML = cards.map(function (card) {
                return '<div class="kc-income-metric"><div class="lbl">' + card.label +
                    '</div><div class="val ' + card.cls + '">' + money(card.value) + '</div></div>';
            }).join('');
        }

        if (weeksEl) {
            var current = (data.periods || []).find(function (p) { return p.is_current; }) ||
                (data.periods || [])[0];
            weeksEl.innerHTML = current ? weekCardsHtml(current) : '';
        }

        var rows = order.map(function (bid) {
            var lane = lanes[bid] || byBiz[bid] || {};
            var income = lane.revenue_attributed != null ? lane.revenue_attributed : lane.revenue;
            var channels = Object.keys(lane.revenue_by_channel || lane.by_channel || {}).map(function (key) {
                return key + ': ' + money((lane.revenue_by_channel || lane.by_channel)[key]);
            }).join(' · ') || '—';
            return '<tr>' +
                '<td class="biz">' + escHtml(BIZ_LABELS[bid] || bid) + '</td>' +
                '<td class="amt">' + money(income) + '</td>' +
                '<td>' + Number(lane.payment_count || lane.payments || 0) + '</td>' +
                '<td class="ch">' + escHtml(channels) + '</td>' +
                '</tr>';
        }).join('');

        var unallocN = Number(totals.unallocated_count || (data.unallocated_payments || []).length || 0);
        var reviewN = Number(totals.needs_review_count || (data.needs_review || []).length || 0);
        var smsMissing = (data.sms_payment_mentions && data.sms_payment_mentions.without_amount) || [];
        body.innerHTML =
            '<table class="kc-income-table"><thead><tr>' +
            '<th>Business</th><th>Income</th><th>Payments</th><th>Channels</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="kc-income-foot">Sources: Stripe receipts in the three mailboxes · Regions/FNB Zelle · Venmo/PayPal/Cash App alerts · manual Books entries. ' +
            'Outbound Zelle (Vince / Stefan) excluded. Use the Books tab to log Chris/Tyler Zelle that never hit email.' +
            (unallocN || reviewN ? (' · ' + unallocN + ' unallocated / ' + reviewN + ' need review.') : '') +
            (smsMissing.length ? (' · ' + smsMissing.length + ' SMS payment mention(s) need amounts.') : '') +
            '</div>';
    }

    async function refreshBooksPanel() {
        var weeksEl = $('books-weeks');
        if (!weeksEl) return;
        weeksEl.innerHTML = '<p class="kc-muted">Loading ledger…</p>';
        try {
            await fetch('http://127.0.0.1:5050/api/email-agent/sync', { method: 'POST' }).catch(function () {});
            var data = await fetchClientBooks();
            renderBooksPanel(data);
        } catch (err) {
            weeksEl.innerHTML = '<p class="kc-income-foot">Could not load books: ' +
                escHtml(err.message || err) + '</p>';
        }
    }

    function renderBooksPanel(data) {
        var summary = $('books-summary');
        var weeksEl = $('books-weeks');
        var biz = data.by_business || {};
        var totals = data.totals || {};
        if (summary) {
            summary.innerHTML = [
                { label: 'ST + FW + RM', value: data.client_total, cls: 'gold' },
                { label: 'Screen Team', value: biz.st && biz.st.revenue, cls: '' },
                { label: 'Faith Works', value: biz.fw && biz.fw.revenue, cls: '' },
                { label: 'Roof Monsters', value: biz.rm && biz.rm.revenue, cls: '' },
                { label: 'Unallocated', value: totals.revenue_unallocated, cls: 'warn' },
            ].map(function (card) {
                return '<div class="kc-income-metric"><div class="lbl">' + card.label +
                    '</div><div class="val ' + card.cls + '">' + money(card.value) + '</div></div>';
            }).join('');
        }
        if (!weeksEl) return;
        var periods = data.periods || [];
        if (!periods.length) {
            weeksEl.innerHTML = '<p class="kc-muted">No payments yet.</p>';
            return;
        }
        weeksEl.innerHTML = periods.map(function (period) {
            var rows = []
                .concat((period.st && period.st.rows) || [])
                .concat((period.fw && period.fw.rows) || [])
                .concat((period.rm && period.rm.rows) || [])
                .concat((period.kl && period.kl.rows) || [])
                .concat((period.kg && period.kg.rows) || [])
                .concat((period.unallocated && period.unallocated.rows) || []);
            rows.sort(function (a, b) {
                return String(b.paid_at || '').localeCompare(String(a.paid_at || ''));
            });
            var table = rows.length ? ('<table class="kc-income-table"><thead><tr>' +
                '<th>Date</th><th>Biz</th><th>Channel</th><th>Payer</th><th>Memo</th><th>Amount</th>' +
                '</tr></thead><tbody>' + rows.map(function (row) {
                    return '<tr><td>' + escHtml(String(row.paid_at || '').slice(0, 10)) +
                        '</td><td>' + escHtml(row.business_id || '') +
                        '</td><td>' + escHtml(row.channel || '') +
                        '</td><td>' + escHtml(row.payer || '') +
                        '</td><td class="ch">' + escHtml(row.memo || '') +
                        '</td><td class="amt">' + money(row.amount) + '</td></tr>';
                }).join('') + '</tbody></table>') : '<p class="kc-muted">No payments this week.</p>';
            return weekCardsHtml(period) + table;
        }).join('');
    }

    function renderOverview(health) {
        var grid = $('overview-grid');
        var notes = $('overview-notes');
        if (!grid) return;

        var cards = [];
        Object.keys(health.modules || {}).forEach(function (key) {
            var mod = health.modules[key];
            cards.push(
                '<div class="kc-card">' +
                '<span class="kc-status ' + (mod.status === 'ok' ? 'ok' : 'err') + '">' + mod.status + '</span>' +
                '<strong>' + mod.label + '</strong>' +
                '<p>' + mod.detail + '</p></div>'
            );
        });

        (health.remoteModules ? Object.keys(health.remoteModules) : []).forEach(function (key) {
            var mod = health.remoteModules[key];
            if (!mod || !mod.url) return;
            var remoteStatusClass = mod.status === 'ok' ? 'ok' : (mod.status === 'error' ? 'err' : 'warn');
            var openModuleId = null;
            Object.keys(REMOTE_MODULE_MAP).forEach(function (moduleId) {
                if (REMOTE_MODULE_MAP[moduleId] === key) openModuleId = moduleId;
            });
            cards.push(
                '<div class="kc-card">' +
                '<span class="kc-status ' + remoteStatusClass + '">' + (mod.status || 'cloud') + '</span>' +
                '<strong>' + mod.label + ' (cloud)</strong>' +
                '<p>' + mod.detail + '</p>' +
                (openModuleId
                    ? '<button type="button" class="kc-btn kc-btn-ghost" data-open-module="' + openModuleId + '">Open in this tab</button>'
                    : '') +
                '</div>'
            );
        });

        (health.localModules || []).forEach(function (mod) {
            var remoteKey = mod.moduleKey || mod.id;
            var remote = health.remoteModules && health.remoteModules[remoteKey];
            // HTTPS admin embeds cloud tunnels — do not surface local 127.0.0.1 probe
            // failures as "not reachable" when a cloud module (or tunnel fallback) exists.
            if (isUsableRemote(remote)) return;
            if (window.location.protocol === 'https:') {
                var fallbackId = null;
                Object.keys(REMOTE_MODULE_MAP).forEach(function (moduleId) {
                    if (REMOTE_MODULE_MAP[moduleId] === remoteKey) fallbackId = moduleId;
                });
                if (fallbackId && TUNNEL_FALLBACK[fallbackId]) return;
            }
            var probe = state.localProbe[mod.id.replace(/_/g, '-')] || 'pending';
            var statusClass = probe === 'maybe' ? 'warn' : (probe === 'fail' ? 'err' : 'pending');
            cards.push(
                '<div class="kc-card">' +
                '<span class="kc-status ' + statusClass + '" id="local-status-' + mod.id.replace(/_/g, '-') + '">local</span>' +
                '<strong>' + mod.label + '</strong>' +
                '<p>Port ' + mod.port + ' — ' + mod.url + '</p>' +
                '<button type="button" class="kc-btn kc-btn-ghost" data-open-module="' +
                (mod.id === 'email_agent' ? 'email' : (mod.id === 'knight_command' ? 'outreach' : mod.id.replace(/_/g, '-'))) +
                '">Open in this tab</button></div>'
            );
        });

        grid.innerHTML = cards.join('');

        if (notes && health.notes) {
            notes.innerHTML = health.notes.map(function (n) { return '<div class="kc-note">' + n + '</div>'; }).join('');
        }

        (health.localModules || []).forEach(function (mod) {
            var remoteKey = mod.moduleKey || mod.id;
            var remote = health.remoteModules && health.remoteModules[remoteKey];
            if (isUsableRemote(remote)) return;
            if (window.location.protocol === 'https:') {
                var fallbackId = null;
                Object.keys(REMOTE_MODULE_MAP).forEach(function (moduleId) {
                    if (REMOTE_MODULE_MAP[moduleId] === remoteKey) fallbackId = moduleId;
                });
                if (fallbackId && TUNNEL_FALLBACK[fallbackId]) return;
            }
            probeLocal(mod.url, mod.id.replace(/_/g, '-'));
        });
    }

    async function tryRestoreSession() {
        var token = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || '';
        if (!token) return false;
        state.token = token;
        state.secret = sessionStorage.getItem(SECRET_KEY) || '';
        state.role = loadSessionRole();
        try {
            var data = await apiPost('/api/admin', { action: 'verify', token: token });
            state.role = data.role || state.role;
            saveSession(state.token, state.role);
            applyRoleUi();
            showAuth(false);
            log('info', 'Session restored', { role: state.role });
            setActiveModule(moduleFromHash());
            refreshOverview().catch(function () {});
            return true;
        } catch (err) {
            clearSession();
            log('warn', 'Stored session invalid', { error: String(err.message) });
            return false;
        }
    }

    async function login(secret) {
        var data = await apiPost('/api/admin', { secret: secret });
        state.secret = secret;
        state.role = data.role || 'master';
        sessionStorage.setItem(SECRET_KEY, secret);
        saveSession(data.token, state.role);
        applyRoleUi();
        showAuth(false);
        log('info', 'Login successful', { expiresAt: data.expiresAt, role: state.role });
        setActiveModule(moduleFromHash());
        refreshOverview().catch(function () {});
    }

    async function loadForgotInfo() {
        try {
            var data = await fetch(SITE + '/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'forgot-info' }),
            }).then(function (r) { return r.json(); });
            var contact = data.contact || {};
            var copy = (contact.note || '') +
                ' Contact: ' + (contact.email || 'nknight@knightgroup.com') + '.';
            var forgotCopy = $('forgot-copy');
            if (forgotCopy) forgotCopy.textContent = copy;
            var accessCopy = $('access-forgot-copy');
            if (accessCopy) {
                accessCopy.textContent = copy + ' Master passwords are updated in the Vercel project environment variables.';
            }
        } catch (err) {
            log('warn', 'Forgot-info load failed', { error: String(err.message) });
        }
    }

    async function refreshAccessPanel() {
        if (state.role !== 'master') return;
        var statusEl = $('owner-status');
        try {
            var data = await apiPost('/api/admin', { action: 'owner-status' });
            if (statusEl) {
                statusEl.textContent = data.ownerConfigured
                    ? 'Owner password is configured.'
                    : 'No owner password yet — set one below before handing dashboard access to a site owner.';
            }
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Could not load owner status.';
        }
    }

    async function saveOwnerPassword(password) {
        var msg = $('owner-password-msg');
        await apiPost('/api/admin', {
            action: 'set-owner-password',
            newPassword: password,
        });
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = 'Owner password saved.';
            msg.style.color = 'var(--ok)';
        }
        refreshAccessPanel();
        log('info', 'Owner password updated');
    }

    function logout(silent) {
        clearSession();
        applyRoleUi();
        showAuth(true);
        document.querySelectorAll('.kc-panel iframe').forEach(function (frame) {
            frame.src = 'about:blank';
            frame.dataset.loaded = '';
        });
        if (!silent) log('info', 'Logged out');
    }

    function bindTabs() {
        document.querySelectorAll('.kc-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                setActiveModule(tab.dataset.module);
            });
        });
    }

    function bindAuth() {
        $('auth-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var secret = $('secret-input').value.trim();
            if (!secret) return;
            $('auth-error').style.display = 'none';
            login(secret).catch(function (err) {
                $('auth-error').textContent = err.message || 'Login failed';
                $('auth-error').style.display = 'block';
            });
        });
        $('logout-btn').addEventListener('click', function () { logout(false); });
        $('refresh-overview-btn').addEventListener('click', refreshOverview);
        var refreshBooks = $('refresh-books-btn');
        if (refreshBooks) refreshBooks.addEventListener('click', refreshBooksPanel);
        var booksForm = $('books-manual-form');
        if (booksForm) {
            var dateInput = booksForm.querySelector('input[name="paid_at"]');
            if (dateInput && !dateInput.value) {
                dateInput.valueAsDate = new Date();
            }
            booksForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var msg = $('books-manual-msg');
                var fd = new FormData(booksForm);
                var paid = fd.get('paid_at');
                apiPost('/api/admin', {
                    action: 'client-books-manual',
                    business_id: fd.get('business_id'),
                    channel: fd.get('channel'),
                    amount: Number(fd.get('amount')),
                    paid_at: paid ? paid + 'T12:00:00-04:00' : '',
                    payer: fd.get('payer'),
                    memo: fd.get('memo'),
                }).then(function (data) {
                    if (msg) msg.textContent = 'Saved.';
                    booksForm.reset();
                    if (dateInput) dateInput.valueAsDate = new Date();
                    state.clientBooks = data;
                    renderBooksPanel(data);
                    renderIncomeOverview(data);
                }).catch(function (err) {
                    if (window.location.protocol !== 'https:') {
                        fetch('http://127.0.0.1:5050/api/client-books/manual', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                business_id: fd.get('business_id'),
                                channel: fd.get('channel'),
                                amount: Number(fd.get('amount')),
                                paid_at: paid ? paid + 'T12:00:00-04:00' : '',
                                payer: fd.get('payer'),
                                memo: fd.get('memo'),
                            }),
                        }).then(function (r) { return r.json(); }).then(function (data) {
                            if (!data.ok) throw new Error(data.error || 'Save failed');
                            if (msg) msg.textContent = 'Saved locally.';
                            state.clientBooks = data;
                            renderBooksPanel(data);
                        }).catch(function (localErr) {
                            if (msg) msg.textContent = localErr.message || err.message || 'Save failed';
                        });
                        return;
                    }
                    if (msg) msg.textContent = err.message || 'Save failed';
                });
            });
        }
        $('forgot-toggle').addEventListener('click', function () {
            var panel = $('forgot-panel');
            if (!panel) return;
            panel.hidden = !panel.hidden;
        });
        $('owner-password-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var next = $('owner-password-input').value;
            var confirm = $('owner-password-confirm').value;
            var msg = $('owner-password-msg');
            if (next.length < 8) {
                if (msg) {
                    msg.style.display = 'block';
                    msg.style.color = 'var(--err)';
                    msg.textContent = 'Owner password must be at least 8 characters.';
                }
                return;
            }
            if (next !== confirm) {
                if (msg) {
                    msg.style.display = 'block';
                    msg.style.color = 'var(--err)';
                    msg.textContent = 'Passwords do not match.';
                }
                return;
            }
            saveOwnerPassword(next).catch(function (err) {
                if (msg) {
                    msg.style.display = 'block';
                    msg.style.color = 'var(--err)';
                    msg.textContent = err.message || 'Could not save owner password.';
                }
            });
        });
        $('clear-logs-btn').addEventListener('click', function () {
            state.logs = [];
            renderLogs();
            log('info', 'Log buffer cleared');
        });
        $('copy-logs-btn').addEventListener('click', function () {
            var text = state.logs.map(function (e) {
                return e.ts + ' [' + e.level + '] ' + e.message + (e.detail ? ' ' + JSON.stringify(e.detail) : '');
            }).join('\n');
            navigator.clipboard.writeText(text).then(function () {
                log('info', 'Logs copied to clipboard');
            }).catch(function (err) {
                log('error', 'Copy failed', { error: String(err) });
            });
        });

        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest
                ? e.target.closest('[data-open-module], [data-retry-module]')
                : null;
            if (!btn || !document.getElementById('kc-shell') || !document.getElementById('kc-shell').contains(btn)) {
                return;
            }
            var moduleId = btn.getAttribute('data-open-module') || btn.getAttribute('data-retry-module');
            if (!moduleId || !MODULES[moduleId]) return;
            e.preventDefault();
            if (btn.hasAttribute('data-retry-module')) remountModule(moduleId);
            setActiveModule(moduleId);
        });
    }

    bindTabs();
    bindAuth();
    renderLogs();
    loadForgotInfo();
    log('info', 'Knight Command shell initialized', { site: SITE });
    tryRestoreSession().then(function (ok) {
        if (!ok) showAuth(true);
    });
})();
