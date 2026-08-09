# KnightLogics.com Main Site Master

Last updated: 2026-07-10

This is the single current operating document for `E:\KnightLogics-Growth-System\MainSite`.

The old separate MainSite Markdown files were consolidated on 2026-05-30. Their exact contents are preserved in `docs/archive/legacy-main-site-docs-2026-05-30.md`.

## Source Of Truth

- Authoritative local worktree: `E:\KnightLogics-Growth-System\MainSite`
- Branch: `main`
- GitHub remote: `https://github.com/Knight-Logics/Nicholas-Knight-Development-Portfolio.git`
- Live site: `https://knightlogics.com`
- Vercel project: `knight-logics-checkout`
- Vercel project id: `prj_sHEs7MJlcpGO2gsYtnBES85EBd2h`
- Production trigger: push `origin/main` from this folder
- Canonical host: `https://knightlogics.com`; `www.knightlogics.com` redirects to apex at the Vercel domain layer

Removed confusion sources:

- `C:\Users\nknig\Downloads\KnightLogics-clean-sync`
- `C:\Users\nknig\Downloads\KnightLogics-clean-sync.zip`
- `E:\KnightLogics-Growth-System\_mainsite_deploy_20260529b`
- stale Vercel project `_mainsite_deploy_20260529b`

The old deploy-worktree patch remains outside MainSite at:

`E:\KnightLogics-Growth-System\_mainsite_deploy_20260529b_dirty_before_removal.patch`

## Current Live Baseline

Most recent verified performance commit:

`48e29fc fix: optimize landing hero performance`

Most recent documentation consolidation commit before this file:

`d021536 docs: consolidate main site operating instructions`

Current live cache versions:

- `style.css?v=20260530perf1`
- `script.js?v=20260530perf1`
- `images/CircuitBrush3.webp?v=20260530perf1`
- `images/CircuitBrush3-mobile.webp?v=20260530perf1`
- `images/website-hero-mobile-optimized.webp?v=20260530hero1`

Live Lighthouse mobile after the performance deploy:

- Performance: `91`
- Accessibility: `100`
- Best Practices: `100`
- SEO: `100`
- FCP: `1.5s`
- LCP: `3.5s`
- TBT: `0ms`
- CLS: `0.036`
- Speed Index: `2.2s`
- Image delivery savings: `0 bytes`

Live Playwright checks passed:

- `412px` desktop-width viewport loads the mobile door asset and exits the landing hero on mouse-wheel scroll.
- `1366px` desktop viewport loads the optimized desktop door asset and exits the landing hero on mouse-wheel scroll.
- The landing doors stay pinned to the left and right edges and fill the hero viewport.

## Current Docs

Active MainSite Markdown is intentionally small:

- `AGENTS.md` - agent instructions for this worktree.
- `README.md` - short human entry point.
- `docs/MAIN-SITE-MASTER.md` - this current master document.
- `docs/archive/legacy-main-site-docs-2026-05-30.md` - exact historical archive of the old MainSite root docs.

Other Markdown under subfolders may belong to demo apps, image folders, or historical audit output. They are not the current operating plan.

## Legacy Docs Consolidated

The following files were consolidated into this master plus the archive:

- `KNIGHTLOGICS-SITE-AUDIT-LOG.md`
- `LAUNCH_QA_CHECKLIST.md`
- `KNIGHT-LOGICS-AUTHORITY-PLAN.md`
- `KNIGHT-LOGICS-PACKAGE-HANDOFF.md`
- `NEW_CHAT_KICKOFF.md`
- `WEB_OPTIMIZATION_REFERENCE.md`
- `URL-Structure-Optimization.md`
- `STRATEGY_AND_OPTIMIZATION_AUDIT.md`
- `SEO-Optimization-Plan.md`
- the previous long `README.md`

Use the archive only for full historical wording. Use this master for current decisions.

## Non-Markdown Artifacts That Matter

Active configuration:

- `vercel.json` - Vercel redirects, rewrites, headers, noindex rules, asset cache rules.
- `.vercel/project.json` - local Vercel project binding. Do not commit secrets from `.vercel`.
- `package.json` - scripts and dependencies.
- `package-lock.json` - dependency lock state.
- `serve.json` - local clean-URL static server behavior.
- `manifest.json` - PWA/site manifest.
- `robots.txt` - crawl rules and sitemap pointer.
- `sitemap.xml` - public sitemap.
- `llms.txt` and `llms-full.txt` - AI/search-facing site summaries.
- `security.txt` and `humans.txt` - public metadata.
- `stripe/knightlogics-catalog-map.json` and `.csv` - package/catalog mapping.
- `images/referral-qrcodes/manifest.csv` - referral QR inventory.

Audit and generated artifacts:

- `_sf_audit/**` - Screaming Frog crawl exports. Historical/reference, not current instructions.
- `_seo_audit/**` - point-in-time SEO audit artifacts.
- `_lh*.json`, `.lighthouse*.json`, `knightlogics*.json`, and similar large Lighthouse JSON outputs - generated reports. Read only when reproducing a specific audit.
- `.qa-matrix/**`, `test-results/**`, `__shots/**`, and local server logs - generated QA output.
- `node_modules/**` and `.venv/**` - dependencies. Their Markdown, JSON, TXT, CSV, and license files are not project strategy docs.

## Search And IDE Hygiene

If VS Code search shows dozens of Markdown files, first check whether results are from dependencies or generated artifacts.

Exclude these from broad searches:

- `node_modules`
- `.venv`
- `.git`
- `.qa-matrix`
- `test-results`
- `playwright-report`
- `_sf_audit`
- `_seo_audit`
- `__shots`
- `*.log`
- `_lh*.json`
- `.lighthouse*.json`

The workspace file and local `.vscode/settings.json` should keep these hidden from normal search.


## Current Case Study / Network Priority (2026-07-10)

Roof Monsters is live on `https://roofmonsters.co` and is now an official network anchor:

- Nav: Industries ? Roofing shows `RM reference` (alongside KG / ST / FW)
- Homepage proof strip + mosaic lead with Roof Monsters
- Hand-crafted case study: `case-study-roof-monsters.html` (skipped by `scripts/generate-growth-all.js`)
- Media: `images/roof-monsters-rebuild.mp4`, `images/showcase/roof-monsters-*`, copies also in `images/added-media/` for social proof pipeline

Service-company proof order preference: Roof Monsters ? Screen Team ? Knight Group ? Faith Works, then starter/e-commerce examples.
## Development Protocol

1. Run `git status -sb`.
2. Identify unrelated dirty files before editing.
3. Stage only intentional files. Do not use `git add .` in this worktree.
4. Use local preview before frontend commits.
5. Validate visual changes with browser automation and screenshot inspection.
6. For JavaScript changes, run `node --check script.js`.
7. For performance changes, run Lighthouse locally or live.
8. Push only focused commits from `main`.
9. Verify the live Vercel deployment with cache-busted HTML and asset-header checks.

## Local Runbook

Start local preview:

```powershell
cd E:\KnightLogics-Growth-System\MainSite
npm run dev
```

QA scripts:

```powershell
npm run qa:screenshots
npm run qa:screenshots:services
npm run qa:screenshots:client-demo
npm run qa:lighthouse
```

If those scripts are unavailable or dirty in the current worktree, use direct Playwright/Lighthouse checks and record the exact command in the work summary.

## Hero And Parallax Rules

- `CircuitBrush3` is the intentional transparent door overlay.
- The center transparency is intentional.
- Doors must fill the landing hero and stay pinned to the left and right screen edges.
- Do not remove the parallax/animation sequence unless explicitly requested.
- Mobile and tablet widths should use `CircuitBrush3-mobile.webp`.
- Desktop widths should use optimized `CircuitBrush3.webp`.
- Check computed CSS and network requests. File contents alone are not enough.
- If production looks stale, compare:
  - live HTML query strings
  - computed `.parallax-bg-far` and `.parallax-bg-near` URLs
  - live asset sizes and cache headers

## Knight Command Cloud Ops

- `/admin` uses `https://ops.knightlogics.com` for Outreach CRM and `https://mail.knightlogics.com` for Email Agent by default.
- Social Ops and Social Poster default to `https://social.knightlogics.com` and `https://poster.knightlogics.com` in both the admin shell (`TUNNEL_FALLBACK`) and `/api/admin` health probes (`KL_SOCIAL_*_URL` overrides still win when set).
- Vercel environment URL values can override those defaults, but blank values do not disable the known production tunnel hostnames on HTTPS.
- Server-side preflight probes the tunnel origin anonymously (no ops token). HTTP 401/403 on the probe still counts as host-up because browser embeds authenticate separately.
- On HTTPS Command Center, local `127.0.0.1` probe cards are suppressed when cloud tunnel modules are configured — mixed-content local probes are not the embed path.
- Keep-alive: Task Scheduler `KnightCommandStackWatchdog` / `KnightCommandStackAtLogon` run `CRM/OutreachEngine/scripts/ensure-knight-command-stack.ps1` (Email :5100, Outreach :5050, Social :8500/:8501, cloudflared). `KnightSocialServicesWatchdog` remains a second Social-only guard.
- Local ports `5050`, `5100`, `8500`, and `8501` are development fallbacks. On **HTTPS** live admin, the shell prefers cloud tunnel URLs.
- **What runs where:** Referrals (Neon + Vercel APIs) work from any device with no PC dependency. Outreach, Email, Social Ops, and Social Poster run on **this computer** and are exposed through Cloudflare Tunnel — remote tabs work when the PC is on and tunnel + services are running. See `CRM/OutreachEngine/deploy/cloudflare-tunnel/README.md`.
- **Social Poster restore reference:** `Social/Social-Media-Manager/docs/social-poster-master.md`
- **Social Ops restore reference:** `Social/Social-Media-Manager/docs/social-ops-master.md`

## PixelForge Production Billing

- Public desktop builds use `POST /api/pixelforge-license`; Stripe and database secrets remain in Vercel only.
- `api/_lib/pixelforge-billing.js` owns the server plans, 8-credit new-device trial, account balance, render reservations, idempotent Stripe session crediting, and privacy-limited event records.
- Render billing is reservation-based: `reserve` deducts atomically, `commit` finalizes a valid output, and `release` returns the exact trial/paid split after cancellation or failure.
- Stripe package metadata uses `app=pixelforge_ai`; `api/stripe-webhook.js` credits completed sessions even when the desktop app closes before confirmation.
- Current server-authoritative packages are 12 credits / $5, 30 / $10, and 72 / $20. Legacy v1.0.20 plan IDs remain accepted but are no longer advertised, so installed clients keep working without receiving a different amount than they display. The desktop app cannot override server amounts.
- A one-time `pro_lifetime` entitlement is implemented but remains disabled until `PIXELFORGE_PRO_LIFETIME_PRICE_CENTS` is deliberately set. Do not invent or deploy a price without an explicit business decision.
- As certified on 2026-08-09, Vercel Preview and Production are connected to the dedicated free-plan `pixelforge-billing` Neon Postgres resource through `KL_DATABASE_URL`. The live database reservation test passes, and the test-mode Stripe purchase smoke completes a hosted Checkout, verifies the signed webhook through the production handler, grants the selected plan exactly once, and removes its temporary database account and Stripe customer.
- Anonymous diagnostics exclude media, file paths, computer names, raw machine identifiers, and email. The app sends an app-scoped device hash plus coarse render/profile outcomes and supports `V11B_DISABLE_ANONYMOUS_DIAGNOSTICS=1`.
- Main smoke check: `npm run test:pixelforge-billing`.
- Non-charging Stripe page smoke: set `PIXELFORGE_CHECKOUT_SMOKE_URL` to a newly created Checkout URL, then run `npm run test:pixelforge-checkout`. It verifies the product, amount, and payment form without submitting payment.
- Desktop release `v1.0.21` adds a taskbar-aware single-screen layout, an automatic one-time NVIDIA setup offer on compatible RTX systems, an all-in-one NVIDIA edition, clearer best-overall/highest-fidelity/fastest labels, revised credit packs, and a checkout startup fix. It retains six core engines, target-driven output, three cached crop previews, Smooth 60 FPS, bounded-memory processing, high-bit precision routing, checkpoint/resume, a single final encode, NVENC, and professional media preservation. Public release: `https://github.com/Knight-Logics/v11b-upscaling-app/releases/tag/v1.0.21`.
- Product-page regression check: `node scripts/pixelforge-page-smoke.mjs http://127.0.0.1:4183/pixelforge-ai.html`; it validates desktop/mobile overflow, release links, visible version, trial/target-driven copy, and SoftwareApplication schema.

## Security Baseline

- `vercel.json` enforces CSP, HSTS, `nosniff`, clickjacking protection, strict referrer policy, restricted browser permissions, and COOP for the site.
- `POST /api/pixelforge-license` and `POST /api/autovid-license` accept native desktop requests with no browser `Origin`, allow the production/loopback origins, and reject all other browser origins without a wildcard CORS response.
- `.env.production` is explicitly ignored and must never be committed. Production credentials remain in Vercel; developer-only local credentials stay in ignored local files or the sensitive credential registry.
- Run `npm run test:license-cors`, `npm run test:pixelforge-billing`, and `npm run test:security-render -- http://127.0.0.1:4199 <output-dir>` after security-header or licensing changes.
- The 2026-07-15 local render smoke verified the homepage, PixelForge page, enforced CSP, YouTube embed, same-origin assets, and trusted/untrusted/native CORS cases.

## Current Growth Priorities

Technical cleanup is no longer the main bottleneck unless a fresh audit finds a regression.

**GSC baseline (2026-07-10 audit):** 34,207 impressions / 139 clicks / 0.41% CTR / avg position 38.8. Synced under `gsc-audit/2026-07-10/` and `E:\Website Audit\GSC\runs\2026-07-10\knightlogics.com\` (legacy junction `E:\GSC Auditer` also resolves here).

**Shipped 2026-07-10 SEO pass (local; deploy when committed/pushed):**

1. CTR title/meta rewrites on GBP, VideoForge, Knight Group case study, contact, Nicholas Knight, service-websites, pricing, home.
2. GBP Tampa / Clearwater / Safety Harbor query coverage (on-page + FAQ schema).
3. City-page depth (St. Pete first) + Tampa/Clearwater/Safety Harbor/Palm Harbor/home-service title-meta refresh; sitemap lastmod bumped; video `uploadDate` / `publication_date` timezones fixed.
4. PixelForge secondary: PixForge variant capture, FAQ, soft bridge to `/service-desktop-apps` and consultation (not a competing product funnel).

Highest-value next work:

1. Search Console CTR improvements on pages already earning impressions.
2. Local service/city page improvements for Tampa, Clearwater, St. Petersburg, Safety Harbor, Palm Harbor, and nearby service-intent markets.
3. Proof paths from homepage, case studies, services, pricing, consultation, and free audit offers.
4. Conversion tracking for calls, forms, audits, booking, pricing starts, and checkout starts.
5. Off-site authority and citation work through high-trust local and B2B profiles.
6. Speed protection during visual upgrades.
7. After deploy: `node E:\Website Audit\GSC\tools\submit-indexing.mjs --failed` (quota ~10/day) and cache-bust live title checks. Visibility umbrella: `E:\Website Audit`.

## Authority Plan

Use consistent entity data:

- Business name: `Knight Logics`
- Founder: `Nicholas Knight`
- URL: `https://knightlogics.com/`
- Email: `support@knightlogics.com`
- Phone: `+1-813-773-5553`
- Base location: `Safety Harbor, FL 34695`
- Primary category: web design, local SEO, and business automation studio

Top authority priorities from the old authority plan:

1. Fix/confirm GoodFirms public NAP propagation.
2. Tighten Clutch and collect first legitimate review.
3. Create DesignRush profile.
4. Complete TechBehemoths registration.
5. Verify Bing Places business-profile status.
6. Verify or create Better Business Bureau profile.
7. Evaluate Tampa Bay, St. Petersburg, and Safety Harbor chamber opportunities.
8. Verify submitted directory listings: ChamberofCommerce.com, Hotfrog, Foursquare, EZlocal.

Full target tables and historical notes are preserved in the legacy archive.

## Package And Offer Notes

Current package/copy details are preserved in the archive from `KNIGHT-LOGICS-PACKAGE-HANDOFF.md`.

When editing package pages or CTAs, verify consistency across:

- homepage
- `pricing.html`
- `service-websites.html`
- `service-local-seo.html`
- `service-google-business-profile.html`
- `service-ai-automation.html`
- checkout/package data
- Stripe catalog mapping

## Clean URL Notes

Production uses clean extensionless URLs through Vercel rewrites and redirects.

Local clean URL behavior should be tested through the configured static server, not by opening raw HTML files directly.

Key files:

- `vercel.json`
- `serve.json`
- `sitemap.xml`
- canonical and Open Graph URLs in HTML
- JSON-LD URLs in HTML

## Documentation Policy

Do not create new standalone strategy Markdown in the MainSite root.

Use this pattern:

- Current state and decisions: update `docs/MAIN-SITE-MASTER.md`.
- Exact historical detail: append to `docs/archive/legacy-main-site-docs-2026-05-30.md` or create a new dated archive if the topic is large.
- Short entry/instructions: update `README.md` or `AGENTS.md`.
- Generated audit outputs: keep under `_sf_audit`, `_seo_audit`, `test-results`, or `.qa-matrix`, and do not treat them as operating docs.

If a new doc is unavoidable, add it under `docs/` and update this master.
