const VER = '20260724start3';
const { pickHeroPanels, getHeroFocus, pickMobileHeroImage } = require('./growth-content-media');
const { tradeNetworkForSlug } = require('./growth-trade-network');
const { renderStructuredDataScripts } = require('./growth-schema');
const { trimMeta } = require('./seo-keywords');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHead(p, opts = {}) {
  const ogImage = p.ogImage
    || (p.heroImage?.src
      ? (p.heroImage.src.startsWith('http') ? p.heroImage.src : `https://knightlogics.com${p.heroImage.src}`)
      : 'https://knightlogics.com/images/KnightLogicsLogo2.png');
  const canonical = `https://knightlogics.com/${p.slug}`;
  const title = opts.caseStudy ? `${p.title} Case Study | Knight Logics` : `${p.title} | Knight Logics`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="preload" href="/header.html?v=${VER}" as="fetch" crossorigin="anonymous">
    <link rel="preload" href="/footer.html?v=${VER}" as="fetch" crossorigin="anonymous">
    <script defer src="/script.js?v=${VER}"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(trimMeta(p.meta))}">
    ${p.seoTerms?.length ? `<meta name="keywords" content="${esc(p.seoTerms.join(', '))}">` : ''}
    <meta name="author" content="Nicholas Knight">
    <meta property="og:type" content="${opts.caseStudy ? 'article' : 'website'}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(trimMeta(p.meta))}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="Knight Logics">
    <meta property="og:image" content="${ogImage}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(trimMeta(p.meta))}">
    <title>${esc(title)}</title>
    <link rel="canonical" href="${canonical}">
    <link rel="stylesheet" href="/style.css?v=${VER}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-VX36QR7HJW');</script>
    ${renderStructuredDataScripts(p, opts)}
</head>`;
}

function renderBreadcrumb(items) {
  const parts = items.map((item, i) => {
    if (i === items.length - 1) return `<span>${item.label}</span>`;
    return `<a href="${item.href}">${item.label}</a><span>/</span>`;
  }).join('');
  return `<nav class="kl-breadcrumb" aria-label="Breadcrumb">${parts}</nav>`;
}

function renderStats(stats) {
  if (!stats || !stats.length) return '';
  return `<div class="kl-growth-stats fade-in">${stats.map((s) => `
                <div class="kl-growth-stat">
                    <span class="kl-growth-stat-value">${s.value}</span>
                    <span class="kl-growth-stat-label">${s.label}</span>
                </div>`).join('')}
            </div>`;
}

function renderFeatures(features, title = 'What this includes') {
  if (!features || !features.length) return '';
  const linked = features.some((f) => f.href);
  const gridClass = linked ? ' kl-growth-features--linked' : '';
  const cards = features.map((f) => {
    const cta = f.href
      ? `<span class="kl-growth-feature-cta">${f.linkLabel || 'Learn more'} <i class="fas fa-arrow-right" aria-hidden="true"></i></span>`
      : '';
    const inner = `
                    <div class="kl-growth-feature-icon" aria-hidden="true"><i class="fas ${f.icon || 'fa-check'}"></i></div>
                    ${f.label ? `<p class="kl-growth-feature-label">${f.label}</p>` : ''}
                    <h3>${f.title}</h3>
                    <p>${f.text}</p>
                    ${cta}`;
    if (f.href) {
      return `
                <a href="${f.href}" class="kl-growth-feature kl-growth-feature--link fade-in">
                    ${inner}
                </a>`;
    }
    return `
                <article class="kl-growth-feature fade-in">
                    ${inner}
                </article>`;
  }).join('');
  return `<section class="kl-growth-section">
        <div class="container">
            <div class="section-header fade-in">
                <h2>${title}</h2>
                ${featuresIntro(title)}
            </div>
            <div class="kl-growth-features${gridClass}">${cards}
            </div>
        </div>
    </section>`;
}

function featuresIntro(title) {
  if (title === 'Case study breakdown') return '';
  return '<p>Built from live Knight Logics workflows — not generic agency checklists.</p>';
}

function renderSplit(block) {
  if (!block) return '';
  const bullets = block.bullets && block.bullets.length
    ? `<ul class="kl-growth-list">${block.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : '';
  const paras = Array.isArray(block.paragraphs) && block.paragraphs.length
    ? block.paragraphs.map((p) => `<p>${p}</p>`).join('\n                    ')
    : `<p>${block.text || ''}</p>`;
  const reverse = block.align === 'right' ? ' kl-growth-split--reverse' : '';
  const sectionAlt = block.alt === false ? '' : ' kl-growth-section--alt';
  return `<section class="kl-growth-section${sectionAlt}">
        <div class="container">
            <div class="kl-growth-split${reverse} fade-in">
                <div class="kl-growth-split-copy">
                    <span class="kl-growth-kicker">${block.kicker || 'The problem'}</span>
                    <h2>${block.title}</h2>
                    ${paras}
                    ${bullets}
                </div>
                <div class="kl-growth-split-media">
                    ${renderMediaItem(block.media, true)}
                </div>
            </div>
        </div>
    </section>`;
}

function renderMediaItem(m, single = false) {
  if (!m) return '';
  if (m.type === 'media-needed') {
    const page = esc(m.page || '');
    const brief = esc(m.brief || m.alt || 'Capture needed');
    const specs = esc(m.specs || 'Screenshot · 1600×900');
    const aspect = esc(m.aspect || '16:9');
    return `<div class="kl-growth-media${single ? ' kl-growth-media--solo' : ''}">
            <figure class="kl-media-needed" data-media-needed="true" data-asset-type="${esc(m.assetType || 'screenshot')}" data-aspect="${aspect}" data-page="${page}" data-brief="${brief}">
                <div class="kl-media-needed__frame" aria-hidden="true"></div>
                <figcaption><strong>Media needed:</strong> ${brief}<span class="kl-media-needed__specs">${specs}</span></figcaption>
            </figure>
            ${m.title && !single ? `<div class="kl-growth-media-caption"><h3>${esc(m.title)}</h3><p>${m.text || ''}</p></div>` : ''}
        </div>`;
  }
  if (m.type === 'video') {
    const label = esc(m.title || m.alt || 'Demo video');
    const poster = m.poster ? ` poster="${m.poster}"` : '';
    const controls = m.controls ? ' controls' : ' autoplay muted loop';
    return `<div class="kl-growth-media${single ? ' kl-growth-media--solo' : ''}">
            <video${controls} playsinline preload="metadata"${poster} aria-label="${label}">
                <source src="${m.src}" type="video/mp4">
                ${m.vtt ? `<track kind="captions" srclang="en" label="English captions" src="${m.vtt}" default>` : ''}
            </video>
            ${m.title && !single ? `<div class="kl-growth-media-caption"><h3>${m.title}</h3><p>${m.text || ''}</p></div>` : ''}
        </div>`;
  }
  return `<div class="kl-growth-media${single ? ' kl-growth-media--solo' : ''}">
            <img src="${m.src}" alt="${esc(m.alt || m.title || '')}" loading="lazy" decoding="async"${m.width ? ` width="${m.width}"` : ''}${m.height ? ` height="${m.height}"` : ''}>
            ${m.title && !single ? `<div class="kl-growth-media-caption"><h3>${m.title}</h3><p>${m.text || ''}</p></div>` : ''}
        </div>`;
}

function mediaSrc(m) {
  return m && m.src ? String(m.src).split('?')[0] : '';
}

/** Every media src already claimed by the walkthrough (primary, proofs, audits). */
function collectWalkthroughSrcs(w) {
  const used = new Set();
  if (!w) return used;
  if (w.primary) used.add(mediaSrc(w.primary));
  for (const p of w.proofs || []) {
    const src = mediaSrc(p);
    if (src) used.add(src);
  }
  for (const a of w.audits || []) {
    const src = mediaSrc(a);
    if (src) used.add(src);
  }
  return used;
}

/** Drop mediaBlocks that repeat any earlier page media. Mutates `used`. */
function dedupeMediaBlocks(blocks, used) {
  if (!blocks || !blocks.length) return [];
  return blocks.filter((b) => {
    const src = mediaSrc(b.media);
    if (!src) return true;
    if (used.has(src)) return false;
    used.add(src);
    return true;
  });
}

/** Drop proof-grid cards whose image already appeared earlier. Mutates `used`. */
function dedupeProofGrid(proofs, used) {
  if (!proofs || !proofs.length) return [];
  return proofs.filter((p) => {
    const src = p && p.image ? String(p.image).split('?')[0] : '';
    if (!src) return true;
    if (used.has(src)) return false;
    used.add(src);
    return true;
  });
}

/** Context without a media src that already appeared in the walkthrough. */
function dedupeContext(ctx, used) {
  if (!ctx) return ctx;
  if (!ctx.media) return ctx;
  const src = mediaSrc(ctx.media);
  if (src && used.has(src)) {
    const { media, ...rest } = ctx;
    return rest;
  }
  if (src) used.add(src);
  return ctx;
}

/** Single proof band — omit if its image already appeared. */
function dedupeProof(proof, used) {
  if (!proof || !proof.image) return proof;
  const src = String(proof.image).split('?')[0];
  if (used.has(src)) return null;
  used.add(src);
  return proof;
}

function uniqueBySrc(items, used) {
  if (!items || !items.length) return [];
  const out = [];
  for (const item of items) {
    const src = mediaSrc(item);
    if (!src || used.has(src)) continue;
    used.add(src);
    out.push(item);
  }
  return out;
}

function renderWalkthrough(w) {
  if (!w || !w.primary) return '';
  const title = w.title || 'Walkthrough &amp; proof';
  const intro = w.intro || 'See the system in motion — then the stills that show how operators and customers experience it.';
  const primary = w.primary;
  const used = new Set([mediaSrc(primary)]);
  const proofs = uniqueBySrc(w.proofs || [], used);
  const audits = uniqueBySrc(w.audits || [], used);
  const isVideo = primary.type === 'video';
  const featureLayout = w.layout === 'feature' || (!isVideo && proofs.length <= 1 && (w.stats || []).length);

  let mediaGrid;
  if (featureLayout || w.layout === 'feature') {
    const stats = w.stats || [];
    const side = proofs[0];
    mediaGrid = `<div class="cs-feature-media fade-in">
                <figure class="cs-feature-hero">
                    <img src="${primary.src}" alt="${esc(primary.alt || primary.title || '')}" loading="eager" decoding="async"${primary.width ? ` width="${primary.width}"` : ''}${primary.height ? ` height="${primary.height}"` : ''}>
                    ${primary.caption || w.primaryCaption ? `<figcaption>${primary.caption || w.primaryCaption}</figcaption>` : ''}
                </figure>
                <aside class="cs-feature-aside">
                    ${side ? `<figure class="cs-proof-card">
                        <img src="${side.src}" alt="${esc(side.alt || '')}" loading="lazy" decoding="async"${side.width ? ` width="${side.width}"` : ''}${side.height ? ` height="${side.height}"` : ''}>
                        ${side.caption ? `<figcaption>${side.caption}</figcaption>` : ''}
                    </figure>` : ''}
                    ${stats.length ? `<div class="cs-feature-stats">${stats.map((s) => `
                        <div><strong>${s.value}</strong><span>${s.label}</span></div>`).join('')}
                    </div>` : ''}
                </aside>
            </div>`;
  } else if (isVideo) {
    const proofStack = proofs.length
      ? `<div class="cs-proof-stack">${proofs.map((p) => `
                    <figure class="cs-proof-card">
                        <img src="${p.src}" alt="${esc(p.alt || '')}" loading="lazy" decoding="async"${p.width ? ` width="${p.width}"` : ''}${p.height ? ` height="${p.height}"` : ''}>
                        ${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}
                    </figure>`).join('')}
                </div>`
      : '';
    const label = esc(primary.title || primary.alt || 'Walkthrough video');
    const poster = primary.poster ? ` poster="${primary.poster}"` : '';
    const controls = primary.controls === false ? ' autoplay muted loop' : ' controls';
    mediaGrid = `<div class="cs-media-grid fade-in">
                <figure class="cs-video-shell">
                    <video${controls} playsinline preload="metadata"${poster} aria-label="${label}">
                        <source src="${primary.src}" type="video/mp4">
                        ${primary.vtt ? `<track kind="captions" srclang="en" label="English captions" src="${primary.vtt}" default>` : ''}
                    </video>
                </figure>
                ${proofStack}
            </div>`;
  } else {
    const cards = [
      {
        src: primary.src,
        alt: primary.alt || primary.title || '',
        caption: primary.caption || w.primaryCaption || 'Primary build proof from the client workspace.',
        width: primary.width,
        height: primary.height
      },
      ...proofs
    ];
    mediaGrid = `<div class="cs-media-grid cs-media-grid--stills fade-in">${cards.map((p, i) => `
                <figure class="cs-proof-card">
                    <img src="${p.src}" alt="${esc(p.alt || '')}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"${p.width ? ` width="${p.width}"` : ''}${p.height ? ` height="${p.height}"` : ''}>
                    ${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}
                </figure>`).join('')}
            </div>`;
  }

  const auditGrid = audits.length
    ? `<div class="cs-audit-grid fade-in">${audits.map((a) => `
                <article class="cs-audit-card">
                    <img src="${a.src}" alt="${esc(a.alt || a.title || '')}" loading="lazy" decoding="async">
                    <div><strong>${a.title}</strong><span>${a.text || ''}</span></div>
                </article>`).join('')}
            </div>`
    : '';

  const cta = w.ctaHref
    ? `<div class="svc-cta-row" style="margin-top:1.5rem;justify-content:center;">
                <a href="${w.ctaHref}" class="btn-primary">${w.ctaLabel || 'Book a Free Consultation'}</a>
                ${w.ctaSecondaryHref ? `<a href="${w.ctaSecondaryHref}" class="btn-secondary">${w.ctaSecondaryLabel || 'Related service'}</a>` : ''}
            </div>`
    : '';

  return `<section class="kl-growth-section">
        <div class="container">
            <div class="section-header fade-in">
                <h2>${title}</h2>
                <p>${intro}</p>
            </div>
            ${mediaGrid}
            ${auditGrid}
            ${cta}
        </div>
    </section>`;
}

function renderMediaBlocks(blocks) {
  if (!blocks || !blocks.length) return '';
  return blocks.map((b, i) => {
    const reverse = b.align === 'right' ? ' kl-growth-split--reverse' : '';
    return `<section class="kl-growth-section${i % 2 ? ' kl-growth-section--alt' : ''}">
        <div class="container">
            <div class="kl-growth-split${reverse} fade-in">
                <div class="kl-growth-split-copy">
                    ${b.kicker ? `<span class="kl-growth-kicker">${b.kicker}</span>` : ''}
                    <h2>${b.title}</h2>
                    <p>${b.text}</p>
                    ${b.bullets ? `<ul class="kl-growth-list">${b.bullets.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
                </div>
                <div class="kl-growth-split-media">${renderMediaItem(b.media, true)}</div>
            </div>
        </div>
    </section>`;
  }).join('\n');
}

function renderProcess(steps, title = 'How we build it') {
  if (!steps || !steps.length) return '';
  return `<section class="kl-growth-section">
        <div class="container">
            <div class="section-header fade-in">
                <h2>${title}</h2>
                <p>A clear path from intake to launch — scoped to what your team will actually use.</p>
            </div>
            <div class="kl-growth-process">${steps.map((s, i) => `
                <div class="kl-growth-step fade-in">
                    <span class="kl-growth-step-num">${i + 1}</span>
                    <div>
                        <h3>${s.title}</h3>
                        <p>${s.text}</p>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>`;
}

function renderIdealFor(items, title = 'Best fit for') {
  if (!items || !items.length) return '';
  return `<section class="kl-growth-section kl-growth-section--alt">
        <div class="container">
            <div class="section-header fade-in">
                <h2>${title}</h2>
            </div>
            <div class="kl-growth-ideal-grid">${items.map((item) => `
                <div class="kl-growth-ideal-card fade-in"><i class="fas fa-check-circle" aria-hidden="true"></i><p>${item}</p></div>`).join('')}
            </div>
        </div>
    </section>`;
}

function renderProof(proof) {
  if (!proof) return '';
  return `<section class="kl-growth-section">
        <div class="container">
            <div class="kl-growth-proof fade-in">
                <div class="kl-growth-proof-media">
                    <img src="${proof.image}" alt="${esc(proof.imageAlt || proof.title)}" loading="lazy" decoding="async">
                    ${proof.badge ? `<span class="kl-growth-proof-badge">${proof.badge}</span>` : ''}
                </div>
                <div class="kl-growth-proof-copy">
                    <span class="kl-growth-kicker">Proof</span>
                    <h2>${proof.title}</h2>
                    <p>${proof.text}</p>
                    <a href="${proof.href}" class="btn-secondary">${proof.linkLabel || 'View case study'}</a>
                </div>
            </div>
        </div>
    </section>`;
}

function renderFaq(faq) {
  if (!faq || !faq.length) return '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  return `<section class="kl-growth-section kl-growth-section--alt">
        <div class="container">
            <div class="section-header fade-in">
                <h2>Common questions</h2>
            </div>
            <div class="kl-growth-faq">${faq.map((f) => `
                <details class="kl-growth-faq-item fade-in">
                    <summary>${f.q}</summary>
                    <p>${f.a}</p>
                </details>`).join('')}
            </div>
        </div>
    </section>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function renderLinks(links, pricingNote) {
  if (!links || !links.length) return '';
  return `<section class="kl-growth-section kl-growth-section--compact">
        <div class="container">
            ${pricingNote ? `<p class="kl-growth-pricing-note fade-in">${pricingNote}</p>` : ''}
            <div class="kl-growth-links kl-growth-links--center fade-in">${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n                ')}</div>
        </div>
    </section>`;
}

function renderContext(ctx) {
  if (!ctx) return '';
  const paras = (ctx.paragraphs || []).map((p) => `<p>${p}</p>`).join('\n                ');
  const note = ctx.note ? `<p class="kl-growth-context-note">${ctx.note}</p>` : '';
  const title = ctx.title ? `<h2>${ctx.title}</h2>` : '';

  if (ctx.media) {
    return `<section class="kl-growth-section kl-growth-section--alt">
        <div class="container">
            <div class="kl-growth-split fade-in">
                <div class="kl-growth-split-copy">
                    ${ctx.kicker ? `<span class="kl-growth-kicker">${ctx.kicker}</span>` : ''}
                    ${title}
                    ${paras}
                    ${note}
                </div>
                <div class="kl-growth-split-media">
                    ${renderMediaItem(ctx.media, true)}
                </div>
            </div>
        </div>
    </section>`;
  }

  return `<section class="kl-growth-section kl-growth-section--compact${ctx.layout === 'wide' ? ' kl-growth-section--context-wide' : ''}">
        <div class="container">
            <div class="kl-growth-context${ctx.layout === 'wide' ? ' kl-growth-context--wide' : ''} fade-in">
                ${title}
                ${paras}
                ${note}
            </div>
        </div>
    </section>`;
}

function renderTradeNetwork(block) {
  if (!block) return '';
  const paras = (block.paragraphs || []).map((p) => `<p>${p}</p>`).join('\n                ');
  const bullets = block.bullets && block.bullets.length
    ? `<ul class="kl-growth-list">${block.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : '';
  const links = block.links && block.links.length
    ? `<div class="kl-growth-links kl-growth-links--inline">${block.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n                    ')}</div>` : '';
  const netImg = block.networkImage || {
    src: '/images/showcase/case-study-referral-network-mockup.webp',
    alt: 'Referral network dashboard with partner attribution',
    width: 1200,
    height: 675,
  };
  const w = netImg.width ? ` width="${netImg.width}"` : '';
  const h = netImg.height ? ` height="${netImg.height}"` : '';
  return `<section class="kl-growth-section kl-growth-section--alt kl-growth-section--network">
        <div class="container">
            <div class="kl-growth-split fade-in">
                <div class="kl-growth-split-copy">
                    <span class="kl-growth-kicker">Trade network</span>
                    <h2>${block.title}</h2>
                    ${paras}
                    ${bullets}
                    ${links}
                    <div class="svc-cta-row" style="margin-top:1.25rem;">
                        <a href="${block.ctaHref || '/book-consultation'}" class="btn-primary">${block.ctaLabel || 'Plan your trade lane'}</a>
                        <a href="/referral-network-systems" class="btn-secondary">How referrals work</a>
                    </div>
                </div>
                <div class="kl-growth-split-media">
                    <div class="kl-growth-media kl-growth-media--solo">
                        <img src="${netImg.src}" alt="${netImg.alt || ''}" loading="lazy" decoding="async"${w}${h}>
                    </div>
                </div>
            </div>
        </div>
    </section>`;
}

function renderDeliverables(items, intro, align) {
  if (!items || !items.length) return '';
  const subtitle = intro || 'What ships in this lane — configured for how your team sells and delivers work.';
  const centerClass = align === 'center' ? ' kl-growth-deliverables-wrap--center' : '';
  return `<section class="kl-growth-section kl-growth-section--alt">
        <div class="container${centerClass}">
            <div class="section-header fade-in">
                <h2>Typical deliverables</h2>
                <p>${subtitle}</p>
            </div>
            <div class="kl-growth-deliverables">${items.map((d) => `
                <article class="kl-growth-deliverable fade-in">
                    <h3>${d.title}</h3>
                    <ul class="kl-growth-list">${(d.items || []).map((i) => `<li>${i}</li>`).join('')}</ul>
                </article>`).join('')}
            </div>
        </div>
    </section>`;
}

function renderConnections(conn) {
  if (!conn) return '';
  const centerClass = conn.align === 'center' ? ' kl-growth-connection--center' : '';
  return `<section class="kl-growth-section">
        <div class="container">
            <div class="kl-growth-connection${centerClass} fade-in">
                <span class="kl-growth-kicker">${conn.kicker || 'How it connects'}</span>
                <h2>${conn.title}</h2>
                <p>${conn.text}</p>
                ${conn.bullets ? `<ul class="kl-growth-list">${conn.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
                ${conn.links ? `<div class="kl-growth-links">${conn.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</div>` : ''}
            </div>
        </div>
    </section>`;
}

function renderOutcomes(outcomes, intro) {
  if (!outcomes || !outcomes.length) return '';
  const subtitle = intro || 'Results operators can check in the tools they already open — not vanity traffic charts.';
  const rowClass = outcomes.length >= 5 ? ' kl-growth-outcomes--row' : '';
  return `<section class="kl-growth-section kl-growth-section--alt">
        <div class="container">
            <div class="section-header fade-in">
                <h2>Outcomes we design for</h2>
                <p>${subtitle}</p>
            </div>
            <div class="kl-growth-outcomes${rowClass}">${outcomes.map((o) => `
                <article class="kl-growth-outcome fade-in">
                    <h3>${o.title}</h3>
                    <p>${o.text}</p>
                </article>`).join('')}
            </div>
        </div>
    </section>`;
}

function renderProofGrid(proofs, intro) {
  if (!proofs || !proofs.length) return '';
  const subtitle = intro || 'Examples that belong to this lane — selected for relevance, not repeated across every page.';
  return `<section class="kl-growth-section">
        <div class="container">
            <div class="section-header fade-in">
                <h2>Related proof &amp; examples</h2>
                <p>${subtitle}</p>
            </div>
            <div class="kl-growth-proof-grid">${proofs.map((proof) => `
                <a class="kl-growth-proof-card fade-in" href="${proof.href}">
                    <img src="${proof.image}" alt="${esc(proof.imageAlt || proof.title)}" loading="lazy" decoding="async">
                    <div class="kl-growth-proof-card-copy">
                        ${proof.badge ? `<span class="kl-growth-proof-badge">${proof.badge}</span>` : ''}
                        <h3>${proof.title}</h3>
                        <p>${proof.text}</p>
                    </div>
                </a>`).join('')}
            </div>
        </div>
    </section>`;
}

function renderScopeNote(note) {
  if (!note) return '';
  return `<section class="kl-growth-section kl-growth-section--compact">
        <div class="container">
            <aside class="kl-growth-scope-note fade-in">
                <strong>Scope clarity:</strong> ${note}
            </aside>
        </div>
    </section>`;
}

function heroImgStyle(src, mobile = false) {
  return ` style="object-position: ${getHeroFocus(src, mobile)};"`;
}

function renderHeroStars() {
  return `<div class="svc-hero-stars" aria-hidden="true">
        <div class="svc-hero-stars__bg"></div>
        <canvas class="svc-hero-stars__canvas"></canvas>
    </div>`;
}

function renderHeroPanels(p) {
  const panels = pickHeroPanels(p.slug, p.heroImage?.src);
  const mobile = pickMobileHeroImage(panels, p.heroImage?.src);
  const positions = ['left', 'top', 'bottom', 'right'];

  const panelEls = positions.map((pos, i) => {
    const src = panels[i];
    const loading = i < 2 ? 'eager' : 'lazy';
    if (pos === 'bottom') {
      return `<div class="hero-panel hero-panel--${pos} hero-panel--photo">
            <img class="hero-panel-img--desktop" src="${src}" alt="" width="800" height="600" decoding="async" loading="${loading}"${heroImgStyle(src)}>
            <img class="hero-panel-img--mobile" src="${mobile}" alt="" width="800" height="600" decoding="async" loading="eager"${heroImgStyle(mobile, true)}>
        </div>`;
    }
    return `<div class="hero-panel hero-panel--${pos} hero-panel--photo"><img src="${src}" alt="" width="800" height="600" decoding="async" loading="${loading}"${heroImgStyle(src)}></div>`;
  }).join('\n        ');

  return `<div class="hero-panels" aria-hidden="true">
        ${panelEls}
    </div>
    <div class="svc-hero-overlay" aria-hidden="true"></div>`;
}

function renderHeroActionsBar(content) {
  if (!content || !content.trim()) return '';
  return `<section class="kl-hero-actions-bar">
        <div class="container fade-in">${content}</div>
    </section>`;
}

function renderCta(cta) {
  const title = cta?.title || 'Ready to plan your build?';
  const text = cta?.text || 'Tell us what is broken, what you are trying to grow, and what systems you already use.';
  return `<section class="svc-cta-band">
        <div class="container">
            <div class="svc-cta-band-inner fade-in">
                <h2>${title}</h2>
                <p>${text}</p>
                <a href="/book-consultation" class="btn-primary">Book a Free Consultation</a>
            </div>
        </div>
    </section>`;
}

function renderServicePage(p) {
  const crumbs = [{ href: '/', label: 'Home' }];
  if (p.parent) crumbs.push({ href: p.parent.href, label: p.parent.label });
  crumbs.push({ label: p.title });

  return `${renderHead(p)}
<body class="kl-growth-page kl-growth-page--pro page-${p.slug}">
    <div id="header-container"></div>

    <section class="svc-hero svc-hero--panels" aria-label="${esc(p.title)}">
        ${renderHeroPanels(p)}
        <div class="container">
            <div class="svc-hero-inner fade-in">
                ${renderBreadcrumb(crumbs)}
                <span class="svc-eyebrow"><i class="fas ${p.heroIcon || 'fa-layer-group'}"></i> ${p.eyebrow}</span>
                <h1>${p.h1}</h1>
                <p class="svc-hero-lead">${p.lead}</p>
                ${renderStats(p.stats)}
                <div class="svc-cta-row">
                    <a href="/book-consultation" class="btn-primary">Book a Consultation</a>
                    <a href="/website-growth-audit" class="btn-secondary">Free Growth Audit</a>
                </div>
            </div>
        </div>
    </section>

    ${renderContext(p.context)}
    ${renderTradeNetwork(p.tradeNetwork || tradeNetworkForSlug(p.slug))}
    ${renderSplit(p.problem)}
    ${renderSplit(p.followSplit)}
    ${renderSplit(p.referralSplit || p.commandSplit)}
    ${renderSplit(p.socialSplit)}
    ${renderSplit(p.dispatchSplit)}
    ${renderFeatures(p.features)}
    ${renderMediaBlocks(p.mediaBlocks)}
    ${renderDeliverables(p.deliverables, p.deliverablesIntro, p.deliverablesAlign)}
    ${renderConnections(p.connections)}
    ${renderProcess(p.process)}
    ${renderOutcomes(p.outcomes, p.outcomesIntro)}
    ${renderIdealFor(p.idealFor)}
    ${renderProof(p.proof)}
    ${renderProofGrid(p.proofGrid, p.proofsIntro)}
    ${renderFaq(p.faq)}
    ${renderLinks(p.links, p.pricingNote)}
    ${renderCta(p.cta)}

    <div id="footer-container"></div>
</body>
</html>`;
}

function renderCaseStudyMetrics(metrics) {
  if (!metrics || !metrics.length) return '';
  return `<div class="kl-growth-metrics fade-in">${metrics.map((m) => `
                    <div class="kl-growth-metric"><strong>${m.value}</strong><span>${m.label}</span></div>`).join('')}
                </div>`;
}

function renderStack(stack) {
  if (!stack || !stack.length) return '';
  return `<div class="cs-tech-stack kl-growth-stack-tags">${stack.map((t) => `<span class="cs-tag">${t}</span>`).join('\n                        ')}</div>`;
}

function renderCaseStudySections(sections) {
  return sections.map((s) => `
                <article class="kl-growth-story-block fade-in">
                    <h3>${s.title}</h3>
                    ${(s.paragraphs || []).map((para) => `<p>${para}</p>`).join('\n                    ')}
                    ${s.bullets ? `<ul class="kl-growth-list">${s.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
                </article>`).join('');
}

function renderCaseStudy(c) {
  const crumbs = [
    { href: '/', label: 'Home' },
    { href: '/case-studies', label: 'Case Studies' },
    { label: c.title }
  ];
  // One asset, one job — walkthrough claims first, then context / mediaBlocks / proof / proofGrid.
  const used = collectWalkthroughSrcs(c.walkthrough);
  const context = dedupeContext(c.context, used);
  const mediaBlocks = dedupeMediaBlocks(c.mediaBlocks, used);
  const proof = dedupeProof(c.proof, used);
  const proofGrid = dedupeProofGrid(c.proofGrid, used);
  const heroPrimary = `<a href="/book-consultation" class="btn-primary"><i class="fas fa-calendar-check"></i> Book a Free Consultation</a>`;
  const heroLive = c.liveUrl
    ? `<a href="${c.liveUrl}" class="btn-secondary" target="_blank" rel="noopener">View Live Project</a>`
    : `<a href="${c.serviceLink}" class="btn-secondary">${c.serviceLabel}</a>`;
  return `${renderHead(c, { caseStudy: true })}
<body class="kl-growth-page kl-growth-page--pro kl-case-study-page page-${c.slug}">
    <div id="header-container"></div>

    <section class="cs-hero" aria-label="${esc(c.title)} case study">
        <div class="container">
            <div class="cs-hero-inner fade-in">
                ${renderBreadcrumb(crumbs)}
                <div class="cs-type-badge"><i class="fas fa-clipboard-check"></i> ${c.badge}</div>
                <h1><span>${c.h1}</span></h1>
                <p class="cs-hero-sub">${c.lead}</p>
                <div class="cs-tech-stack">${c.tags.map((t) => `<span class="cs-tag">${t}</span>`).join('\n                    ')}</div>
                ${renderCaseStudyMetrics(c.metrics)}
                <div class="cs-hero-actions">
                    ${heroPrimary}
                    ${heroLive}
                    <a href="/case-studies" class="cs-btn-back"><i class="fas fa-arrow-left"></i> All Case Studies</a>
                </div>
            </div>
        </div>
    </section>

    ${renderWalkthrough(c.walkthrough)}
    ${renderContext(context)}
    <section class="kl-growth-section">
        <div class="container">
            <div class="section-header fade-in">
                <h2>Case study breakdown</h2>
                <p>${c.subhead}</p>
            </div>
            <div class="kl-growth-story">${renderCaseStudySections(c.sections)}</div>
            ${c.stack ? `<div class="fade-in"><h3 class="kl-growth-inline-heading">Tools &amp; stack</h3>${renderStack(c.stack)}</div>` : ''}
        </div>
    </section>

    ${renderMediaBlocks(mediaBlocks)}
    ${c.timeline ? renderProcess(c.timeline, 'Workflow snapshot') : ''}
    ${renderDeliverables(c.deliverables, c.deliverablesIntro)}
    ${renderOutcomes(c.outcomes, c.outcomesIntro)}
    ${renderConnections(c.connections)}
    ${renderFaq(c.faq)}
    ${renderScopeNote(c.scopeNote)}
    ${renderProof(proof)}
    ${renderProofGrid(proofGrid, c.proofsIntro)}
    ${renderLinks(c.links)}
    ${renderCta({ title: 'Want a similar system?', text: c.cta })}

    <div id="footer-container"></div>
</body>
</html>`;
}

module.exports = {
  VER,
  renderServicePage,
  renderCaseStudy,
  renderWalkthrough,
  renderFaq,
  esc
};
