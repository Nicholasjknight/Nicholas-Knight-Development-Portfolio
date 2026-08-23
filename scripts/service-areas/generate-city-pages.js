/**
 * Generate web-designer-*.html pages from cities.json
 * Shared hero chrome (gradient + form) — unique city image lives in the article body.
 * Run: node scripts/service-areas/generate-city-pages.js
 *
 * Do not run this to refresh photos. It can wipe sales-door CTAs on live city
 * pages. Overwrite images/service-areas/{slug}.webp in place instead
 * (replace-city-images.js).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf8'));
const ALL_SLUGS = cities.map((c) => c.slug);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return esc(s).replace(/'/g, '&#39;');
}

/** Allow intentional <strong> in heroLead only */
function rich(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;strong&gt;/g, '<strong style="color:#e6f1ff;">')
    .replace(/&lt;\/strong&gt;/g, '</strong>');
}

function siblingLinks(city) {
  return (city.siblings || [])
    .map((slug) => {
      const sib = cities.find((c) => c.slug === slug);
      if (!sib) return '';
      return `<a href="/web-designer-${sib.slug}" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Web Designer ${esc(sib.name)}</a>`;
    })
    .filter(Boolean)
    .join('\n                ');
}

function crawlCityLinks() {
  return cities
    .map((c) => `<a href="/web-designer-${c.slug}">Web Designer ${esc(c.name)}</a>`)
    .join('\n        ');
}

function faqSchema(city) {
  return city.faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
}

function faqHtml(city) {
  return city.faqs
    .map(
      (f) => `<div style="padding:20px; background:rgba(255,255,255,.03); border-radius:6px;">
                    <h3 style="color:#e6f1ff; font-size:1.05rem; margin:0 0 8px;">${esc(f.q)}</h3>
                    <p style="margin:0;">${esc(f.a)}</p>
                </div>`
    )
    .join('\n                ');
}

function needsHtml(city) {
  return `<ul style="padding-left: 1.4em; margin-bottom: 24px;">
${city.needs
  .map(
    (n) => `                <li style="margin-bottom: 12px;"><strong>${esc(n.title)}</strong> &mdash; ${esc(n.text)}</li>`
  )
  .join('\n')}
            </ul>`;
}

function processHtml(city) {
  return city.processSteps
    .map(
      (s, i) => `<div style="display:flex; gap:16px; align-items:flex-start; padding:20px; background:rgba(100,255,218,.03); border:1px solid rgba(100,255,218,.1); border-radius:6px;">
                    <span style="color:#64ffda; font-size:1.3rem; font-weight:700; min-width:28px;">${i + 1}.</span>
                    <div><strong style="color:#e6f1ff; display:block; margin-bottom:4px;">${esc(s.title)}</strong> ${esc(s.text)}</div>
                </div>`
    )
    .join('\n                ');
}

function render(city) {
  const url = `https://knightlogics.com/web-designer-${city.slug}`;
  const imgAbs = `https://knightlogics.com${city.contentImage}`;
  const faqJson = JSON.stringify(faqSchema(city), null, 8).replace(/^/gm, '        ').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NQ3KH4JP');</script>
<!-- End Google Tag Manager -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="keywords" content="${escAttr(city.keywords)}">
    <title>${esc(city.title)}</title>
    <meta name="description" content="${escAttr(city.metaDescription)}">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${escAttr(city.ogTitle)}">
    <meta property="og:description" content="${escAttr(city.ogDescription)}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="https://knightlogics.com/images/added-media/kl-home-site.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="710">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escAttr(city.ogTitle)}">
    <meta name="twitter:description" content="${escAttr(city.ogDescription)}">
    <meta name="twitter:image" content="https://knightlogics.com/images/added-media/kl-home-site.webp">
    <link rel="icon" type="image/png" href="/images/KnightLogicsLogo2.webp" sizes="1024x1024">
    <link rel="apple-touch-icon" href="/images/KnightLogicsLogo2.webp">
    <link rel="manifest" href="/manifest.json">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": ${JSON.stringify(city.articleHeadline)},
        "description": ${JSON.stringify(city.articleDescription)},
        "url": "${url}",
        "datePublished": "2026-05-13",
        "dateModified": "2026-07-24",
        "image": {
            "@type": "ImageObject",
            "url": "${imgAbs}",
            "width": 1200,
            "height": 800
        },
        "author": {
            "@type": "Person",
            "name": "Nicholas Knight",
            "url": "https://knightlogics.com/nicholas-knight"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Knight Logics",
            "url": "https://knightlogics.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://knightlogics.com/images/KnightLogicsLogo2.webp",
                "width": 1024,
                "height": 1024
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${url}"
        }
    }
    </script>

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://knightlogics.com/"},
            {"@type": "ListItem", "position": 2, "name": "Custom Websites", "item": "https://knightlogics.com/service-websites"},
            {"@type": "ListItem", "position": 3, "name": "Web Designer ${esc(city.name)} FL", "item": "${url}"}
        ]
    }
    </script>

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": ${JSON.stringify(faqSchema(city), null, 8)}
    }
    </script>

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Custom Website Design & Local SEO — ${esc(city.name)}, FL",
        "serviceType": "Web Design and Local SEO",
        "description": ${JSON.stringify(city.articleDescription)},
        "url": "${url}",
        "areaServed": {
            "@type": "City",
            "name": ${JSON.stringify(city.name)},
            "containedInPlace": {"@type": "AdministrativeArea", "name": ${JSON.stringify(city.countyFull)}}
        },
        "provider": {
            "@type": ["LocalBusiness", "ProfessionalService"],
            "@id": "https://knightlogics.com/#organization",
            "name": "Knight Logics",
            "url": "https://knightlogics.com",
            "telephone": "+1-813-773-5553",
            "email": "support@knightlogics.com",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Safety Harbor",
                "addressRegion": "FL",
                "postalCode": "34695",
                "addressCountry": "US"
            }
        }
    }
    </script>

    <link rel="stylesheet" href="style.css?v=20260724city20">

    <style>
        .city-hero-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 330px;
            gap: 40px;
            align-items: center;
        }
        .city-hero-form-shell { position: relative; }
        .city-hero-form-card {
            background: rgba(8, 16, 28, .92);
            border: 1px solid rgba(100,255,218,.18);
            border-radius: 16px;
            padding: 22px 20px 20px;
            box-shadow: 0 18px 50px rgba(0,0,0,.35);
        }
        .city-form-group { margin-bottom: 12px; }
        .city-form-group label {
            display: block;
            font-size: .72rem;
            letter-spacing: .06em;
            text-transform: uppercase;
            color: rgba(255,255,255,.62);
            margin-bottom: 6px;
        }
        .city-form-group input,
        .city-form-group select,
        .city-form-group textarea {
            width: 100%;
            border: 1px solid rgba(100,255,218,.18);
            border-radius: 10px;
            background: rgba(255,255,255,.04);
            color: #fff;
            padding: 11px 12px;
            font: inherit;
        }
        .city-form-group select {
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364ffda' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 38px;
        }
        .city-form-group textarea { min-height: 70px; resize: vertical; }
        .city-form-submit {
            width: 100%;
            padding: 13px;
            border: 0;
            border-radius: 10px;
            background: linear-gradient(135deg, #64ffda, #4ecdc4);
            color: #0a0a0a;
            font-weight: 700;
            font-size: .95rem;
            cursor: pointer;
            margin-top: 8px;
            font-family: inherit;
        }
        .city-hero-layout .services-panel-link,
        .city-hero-layout .services-panel-link:visited {
            color: #64ffda !important;
            -webkit-text-fill-color: #64ffda !important;
        }
        .city-hero-layout .services-panel-link--solid,
        .city-hero-layout .services-panel-link--solid:visited {
            color: #0a0a0a !important;
            -webkit-text-fill-color: #0a0a0a !important;
        }
        @media (max-width: 900px) {
            .city-hero-layout { grid-template-columns: 1fr; }
        }
    </style>
    <script defer src="/script.js?v=20260724city20"></script>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NQ3KH4JP"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

    <div id="header-container"></div>

    <section class="cs-hero" style="padding: 80px 0 60px; background: linear-gradient(160deg, #050a14 0%, #0a1628 100%);">
        <div class="container" style="max-width: 1100px;">
            <nav aria-label="Breadcrumb" class="cs-breadcrumb">
                <a href="/">Home</a>
                <span>/</span>
                <a href="/service-websites">Custom Websites</a>
                <span>/</span>
                <span>${esc(city.breadcrumbLabel)}</span>
            </nav>
            <div class="city-hero-layout">
                <div>
                    <p style="margin:0 0 10px;color:#64ffda;font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${esc(city.countyFull)} · On-site Tampa Bay · Remote U.S.</p>
                    <h1 style="font-size: clamp(1.9rem, 4vw, 2.8rem); margin: 0 0 18px; line-height: 1.2;">${esc(city.h1)}</h1>
                    <p style="font-size: 1.08rem; color: #a8b2c8; line-height: 1.7; margin-bottom: 28px;">${rich(city.heroLead)} See <a href="/service-local-seo" style="color:#64ffda;">local SEO</a>, <a href="/service-google-business-profile" style="color:#64ffda;">Google Business Profile</a>, and <a href="/case-studies" style="color:#64ffda;">case studies</a>.</p>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        <a href="/starting-a-new-business" class="services-panel-link services-panel-link--solid">Launch Kit $299</a>
                        <a href="tel:+18137735553" class="services-panel-link" style="background:transparent; border:1px solid rgba(100,255,218,.4);">Call (813) 773-5553</a>
                    </div>
                </div>
                <aside class="city-hero-form-shell" aria-label="Contact Knight Logics">
                    <div class="city-hero-form-card">
                        <div style="margin-bottom:16px;">
                            <span style="display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;background:rgba(100,255,218,.1);border:1px solid rgba(100,255,218,.2);color:#64ffda;font-size:.76rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;">Get in Touch</span>
                            <h2 style="margin:12px 0 6px;font-size:1.1rem;color:#fff;line-height:1.15;">Talk Through Your Project</h2>
                            <p style="margin:0;color:rgba(255,255,255,.72);font-size:.86rem;line-height:1.35;">Need a stronger site or better rankings? Start here.</p>
                        </div>
                        <form class="consultation-form" action="https://formspree.io/f/xnnggyzp" method="POST">
                            <div class="city-form-group">
                                <label for="cityNameOrg_${city.formId}">Name / organization</label>
                                <input type="text" id="cityNameOrg_${city.formId}" name="nameOrg" autocomplete="organization" placeholder="Your name or company" required minlength="2" maxlength="160">
                            </div>
                            <div class="city-form-group">
                                <label for="cityContact_${city.formId}">Phone or email</label>
                                <input type="text" id="cityContact_${city.formId}" name="contact" inputmode="email" autocomplete="email" placeholder="(813) 555-0123 or you@company.com" required maxlength="160">
                            </div>
                            <div class="city-form-group">
                                <label for="cityDescription_${city.formId}">What do you need?</label>
                                <textarea id="cityDescription_${city.formId}" name="description" required minlength="8" maxlength="2500" placeholder="Tell us what is not working."></textarea>
                            </div>
                            <input type="hidden" name="_subject" value="Knight Logics city page inquiry">
                            <input type="hidden" name="leadSource" value="${escAttr(city.name)} city landing page hero form">
                            <button type="submit" class="city-form-submit form-submit-btn">
                                <span>Send My Request</span>
                                <span class="btn-loading" style="display:none;">Sending&hellip;</span>
                            </button>
                        </form>
                    </div>
                </aside>
            </div>
        </div>
    </section>

    <article style="padding: 64px 0; background: #0a0f1c;">
        <div class="container" style="max-width: 1040px; line-height: 1.8; color: #a8b2c8;">

            <figure class="kl-media-needed" data-media-needed="true"
                data-asset-type="photo"
                data-aspect="16:9"
                data-page="/web-designer-${city.slug}"
                data-brief="Verified ${escAttr(city.name)} FL photograph — identifiable landmark or downtown/commercial corridor. No stock from other cities.">
                <div class="kl-media-needed__frame" aria-hidden="true"></div>
                <figcaption>
                    <strong>Media needed:</strong> Owned or verified photograph of ${esc(city.name)}, ${esc(city.state || 'FL')} (landmark, downtown, or service corridor). Replace the misleading stock file at <code>${esc(city.contentImage)}</code> before removing this placeholder.
                    <span class="kl-media-needed__specs">WebP or JPG · 1600×1000 · exact-location caption · license/source recorded</span>
                </figcaption>
            </figure>
            <figure class="kl-media-needed" data-media-needed="true"
                data-asset-type="diagram"
                data-aspect="16:9"
                data-page="/web-designer-${city.slug}"
                data-brief="Custom service-area map for ${escAttr(city.name)} and neighboring metros you actually serve.">
                <div class="kl-media-needed__frame" aria-hidden="true"></div>
                <figcaption>
                    <strong>Media needed:</strong> Custom ${esc(city.name)} service-area map showing ${esc(city.countyFull)} coverage and honest sibling cities — not a generic Florida outline.
                    <span class="kl-media-needed__specs">SVG or PNG · 1600×900 · labeled corridors</span>
                </figcaption>
            </figure>
${city.imageVerified ? `
            <figure style="margin:0 0 36px;">
                <img src="${escAttr(city.contentImage)}" alt="${escAttr(city.contentImageAlt)}" width="1200" height="800" loading="eager" decoding="async" style="width:100%; height:auto; max-height:420px; object-fit:cover; border-radius:8px; border:1px solid rgba(100,255,218,.15); display:block;">
                <figcaption style="font-size:.82rem; color:#6b7fa3; margin-top:10px;">${esc(city.contentImageCaption)}</figcaption>
            </figure>
` : ''}

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 0 0 16px;">${esc(city.whyHeading)}</h2>
${city.whyParagraphs.map((p) => `            <p>${esc(p)}</p>`).join('\n')}

            <div style="margin: 28px 0 36px; padding: 24px 26px; background: rgba(100,255,218,.05); border: 1px solid rgba(100,255,218,.18); border-radius: 8px;">
                <h3 style="color:#e6f1ff; font-size:1.1rem; margin:0 0 10px;">Local in ${esc(city.name)} · Remote nationwide</h3>
                <p style="margin:0;">${esc(city.localAngle)} Learn more about <a href="/remote-us-services" style="color:#64ffda;">remote U.S. services</a> or start with a <a href="/website-growth-audit" style="color:#64ffda;">free website audit</a>.</p>
            </div>

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">${esc(city.marketHeading)}</h2>
${city.marketParagraphs.map((p) => `            <p>${esc(p)}</p>`).join('\n')}

            <section class="kl-proof-section" aria-labelledby="city-proof-heading-${city.slug}" style="margin: 2.5rem 0 1rem;">
                <header style="margin-bottom: 1.75rem;">
                    <h2 id="city-proof-heading-${city.slug}" style="color: #e6f1ff; font-size: 1.5rem; margin: 0 0 12px;">Real client builds — Tampa Bay market</h2>
                    <p style="margin:0;">${esc(city.proofBlurb)}</p>
                </header>

                <article class="svc-mirror fade-in">
                    <figure class="svc-mirror-media svc-mirror-media--good">
                        <img src="/images/screen-team-hero-mobile.webp" alt="Screen Team LLC mobile website — Tampa Bay screen repair" width="800" height="1200" loading="lazy" decoding="async">
                    </figure>
                    <div class="svc-mirror-copy">
                        <p class="svc-mirror-versus"><span>Local SEO</span> Screen Team LLC</p>
                        <h3>Call-first trade site with deep service coverage</h3>
                        <p>The same pattern we use for ${esc(city.name)} launches: service silos, estimate CTAs, schema, and pages built for map-pack clicks on phones.</p>
                        <ul class="svc-checklist">
                            <li>Mobile estimate and call paths above the fold</li>
                            <li>Service + city architecture for Tampa Bay search</li>
                            <li><a href="/case-study-screen-team" style="color:#64ffda;">Full Screen Team case study →</a></li>
                        </ul>
                    </div>
                </article>

                <article class="svc-mirror svc-mirror--flip fade-in">
                    <figure class="svc-mirror-media svc-mirror-media--good">
                        <img src="/images/proof/psi-desktop-screenteam-100.webp" alt="Screen Team desktop PageSpeed Insights scores at 100" width="1200" height="800" loading="lazy" decoding="async">
                    </figure>
                    <div class="svc-mirror-copy">
                        <p class="svc-mirror-versus"><span>Performance</span> Lab scores as a build requirement</p>
                        <h3>Speed that survives Slow 4G in ${esc(city.name)}</h3>
                        <p>Every Knight Logics build targets strong Lighthouse and PageSpeed results so ${esc(city.name)} visitors from Maps do not bounce before the estimate form loads.</p>
                        <ul class="svc-checklist">
                            <li>Compressed media and lean scripts by default</li>
                            <li>Desktop and mobile lab checks before launch</li>
                            <li>Accessibility and SEO categories closed with performance</li>
                        </ul>
                    </div>
                </article>

                <div class="kl-proof-gallery fade-in">
                    <figure>
                        <img src="/images/jns-hero-mobile.webp" alt="JNS Construction mobile website" width="800" height="1200" loading="lazy">
                        <figcaption><strong>JNS Construction</strong> Contractor service architecture + FAQ schema. <a href="/case-study-jns" style="color:#64ffda;">Case study →</a></figcaption>
                    </figure>
                    <figure>
                        <img src="/images/knight-group-hero-mobile.webp" alt="Knight Group mobile website" width="800" height="1200" loading="lazy">
                        <figcaption><strong>Knight Group</strong> Estimate-first handyman site. <a href="/case-study-knight-group" style="color:#64ffda;">Case study →</a></figcaption>
                    </figure>
                    <figure>
                        <img src="/images/proof/gbp-panel-knightgroup.webp" alt="Google Business Profile panel aligned with website" width="1200" height="800" loading="lazy">
                        <figcaption><strong>GBP ↔ site parity</strong> Map pack and owned pages tell the same story for ${esc(city.name)} searches. <a href="/service-google-business-profile" style="color:#64ffda;">GBP services →</a></figcaption>
                    </figure>
                </div>
            </section>

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">${esc(city.needsHeading)}</h2>
            ${needsHtml(city)}

            <article class="svc-mirror fade-in" style="margin: 2.5rem 0;">
                <figure class="svc-mirror-media svc-mirror-media--good">
                    <img src="/images/added-media/lighthouse-perfect.webp" alt="Perfect Google Lighthouse scores on a Knight Logics build" width="1000" height="638" loading="lazy" decoding="async">
                </figure>
                <div class="svc-mirror-copy">
                    <p class="svc-mirror-versus"><span>Technical baseline</span> Lighthouse targets</p>
                    <h3>Performance for ${esc(city.name)} local results</h3>
                    <p>Builder-template sites often dominate the middle of local SERPs with weak Core Web Vitals. We treat Performance, Accessibility, Best Practices, and SEO as ship criteria — not a post-launch upsell.</p>
                    <ul class="svc-checklist">
                        <li>Measurable edge vs page-builder competitors</li>
                        <li>Same standard whether you are in ${esc(city.name)} or remote U.S.</li>
                        <li><a href="/website-growth-audit" style="color:#64ffda;">Start with a free audit →</a></li>
                    </ul>
                </div>
            </article>

            <article class="svc-mirror svc-mirror--flip fade-in" style="margin: 0 0 2.5rem;">
                <figure class="svc-mirror-media svc-mirror-media--good">
                    <img src="/images/added-media/gbp-reviews.webp" alt="Google map and reviews on a Knight Logics client site" width="1000" height="796" loading="lazy" decoding="async">
                </figure>
                <div class="svc-mirror-copy">
                    <p class="svc-mirror-versus"><span>Maps</span> Google Business Profile</p>
                    <h3>The map layer ${esc(city.name)} sites cannot ignore</h3>
                    <p>The local map pack is often the first thing a ${esc(city.name)} searcher sees. Sites ship with <a href="/service-google-business-profile" style="color:#64ffda;">GBP alignment</a> — NAP parity, matching services, and conversion paths that turn profile clicks into calls.</p>
                    <ul class="svc-checklist">
                        <li>Categories and services matched to estimate intents</li>
                        <li>Landing URLs that convert on mobile</li>
                        <li>Reviews and posts reinforcing live website offers</li>
                    </ul>
                </div>
            </article>

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">${esc(city.processHeading)}</h2>
            <div style="display:grid; gap: 16px; margin-bottom: 24px;">
                ${processHtml(city)}
            </div>

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">${esc(city.industriesHeading)}</h2>
            <p>${esc(city.industriesBlurb)}</p>
            <ul style="padding-left: 1.4em; margin-bottom: 24px; display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px 24px;">
                <li>Screen &amp; pool enclosure repair</li>
                <li>Painting &amp; exterior coatings</li>
                <li>General construction &amp; contracting</li>
                <li>Home services &amp; property maintenance</li>
                <li>Local retail &amp; product brands</li>
                <li>Electricians &amp; specialty trades</li>
            </ul>

            <p><a href="/nicholas-knight" style="color:#64ffda;">Nicholas Knight</a> builds every site directly — HTML, CSS, and JavaScript from Safety Harbor. Review <a href="/pricing" style="color:#64ffda;">pricing</a> or <a href="/book-consultation" style="color:#64ffda;">book a consultation</a> when the scope is clear.</p>

            <h2 style="color: #e6f1ff; font-size: 1.5rem; margin: 40px 0 16px;">Frequently asked questions — ${esc(city.name)} web design</h2>
            <div style="display:grid; gap: 20px; margin-bottom: 12px;">
                ${faqHtml(city)}
            </div>

            <div style="margin-top: 48px; padding: 32px; background: rgba(100,255,218,.06); border: 1px solid rgba(100,255,218,.2); border-radius: 8px; text-align: center;">
                <p style="font-size: 1.05rem; color: #e6f1ff; margin: 0 0 16px; font-weight: 600;">${esc(city.ctaBlurb)}</p>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                    <a href="tel:+18137735553" class="services-panel-link">Call (813) 773-5553</a>
                    <a href="/contact" class="services-panel-link" style="background:transparent; border:1px solid rgba(100,255,218,.4);">Contact Nicholas &rarr;</a>
                </div>
            </div>

        </div>
    </article>

    <section style="padding: 48px 0; background: #050a14; border-top: 1px solid rgba(255,255,255,.06);">
        <div class="container" style="max-width: 900px;">
            <h3 style="font-size: 1.1rem; color: #e6f1ff; margin: 0 0 20px;">Related services and nearby cities</h3>
            <nav aria-label="Related pages" style="display: flex; flex-wrap: wrap; gap: 12px 20px;">
                <a href="/service-websites" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Custom Websites</a>
                <a href="/service-local-seo" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Local SEO Services</a>
                <a href="/service-google-business-profile" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Google Business Profile</a>
                <a href="/remote-us-services" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Remote U.S. Services</a>
                <a href="/pricing" style="color:#64ffda;text-decoration:none;font-size:.88rem;">Pricing &amp; Packages</a>
                ${siblingLinks(city)}
            </nav>
        </div>
    </section>

    <div id="footer-container">
    <nav class="crawl-fallback-links" aria-label="Site links">
        <a href="/service-websites">Website Services</a>
        <a href="/service-local-seo">Local SEO</a>
        <a href="/service-google-business-profile">Google Business Profile</a>
        <a href="/website-growth-audit">Free Website Audit</a>
        <a href="/remote-us-services">Remote U.S. Services</a>
        <a href="/case-studies">Case Studies</a>
        ${crawlCityLinks()}
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-of-service">Terms of Service</a>
    </nav>
</div>
</body>
</html>
`;
}

for (const city of cities) {
  const file = path.join(root, `web-designer-${city.slug}.html`);
  fs.writeFileSync(file, render(city));
  console.log('Wrote', path.basename(file), `(~${city.approxWordCount} words in source copy)`);
}
console.log(`Done: ${cities.length} pages`);
