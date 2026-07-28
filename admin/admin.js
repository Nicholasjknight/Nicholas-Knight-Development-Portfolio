(function () {
    'use strict';

    var SITE = window.location.origin;
    var SESSION_KEY = 'kl_admin_session';
    var SECRET_KEY = 'kl_admin_secret';
    var ROLE_KEY = 'kl_admin_role';
    var LOG_MAX = 250;

    var AGENCY_MODULES = ['outreach', 'email', 'social-ops', 'social-poster', 'access'];

    var MODULES = {
        overview: { label: 'Command Center', panel: 'panel-overview' },
        referrals: { label: 'Referrals', panel: 'panel-referrals', embed: '/referral-dashboard?embed=1' },
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
    ];

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
        } else if (moduleId === 'access') {
            refreshAccessPanel();
        }
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
        if (wrap) {
            wrap.classList.add('open');
            wrap.style.display = 'flex';
            wrap.querySelector('[data-embed-title]').textContent = 'Connecting to cloud ops…';
            wrap.querySelector('[data-embed-detail]').textContent = help || 'Loading remote Outreach stack.';
        }
        frame.onload = function () {
            pushOpsAuthToFrame(frame, embedUrl);
            if (wrap) {
                wrap.classList.remove('open');
                wrap.style.display = 'none';
            }
            log('info', 'Cloud ops iframe loaded', { url: embedUrl });
        };
        frame.onerror = function () {
            if (wrap) {
                wrap.classList.add('open');
                wrap.querySelector('[data-embed-title]').textContent = 'Cloud ops unreachable';
                wrap.querySelector('[data-embed-detail]').textContent =
                    (help || '') + ' Confirm tunnel + local services on this PC, then refresh.';
            }
            log('warn', 'Cloud ops iframe error', { url: embedUrl });
        };
        if (frame.dataset.loaded !== embedUrl) {
            frame.src = embedUrl;
            frame.dataset.loaded = embedUrl;
        } else {
            pushOpsAuthToFrame(frame, embedUrl);
            if (wrap) {
                wrap.classList.remove('open');
                wrap.style.display = 'none';
            }
        }
        setTimeout(function () { pushOpsAuthToFrame(frame, embedUrl); }, 800);
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
            cards.push(
                '<div class="kc-card">' +
                '<span class="kc-status ' + remoteStatusClass + '">' + (mod.status || 'cloud') + '</span>' +
                '<strong>' + mod.label + ' (cloud)</strong>' +
                '<p>' + mod.detail + '</p>' +
                '<a class="kc-btn kc-btn-ghost" href="' + mod.url + '" target="_blank" rel="noopener">Open ↗</a></div>'
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
                '<a class="kc-btn kc-btn-ghost" href="' + mod.url + '" target="_blank" rel="noopener">Open ↗</a></div>'
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
            setActiveModule('overview');
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
        setActiveModule('overview');
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

        document.querySelectorAll('[data-open-local]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var url = btn.getAttribute('data-open-local');
                window.open(url, '_blank', 'noopener');
            });
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
