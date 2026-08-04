/**
 * Shared Instant Package checkout modal + order status poller.
 * Buttons: <button type="button" class="sp-buy" data-sku="ai_site_health_5">Buy</button>
 * Optional status host: #order-status with #order-status-title, #order-status-message, #order-status-meta
 */
(function () {
  const NICHES = [
    'roofing', 'hvac', 'plumbing', 'electrical', 'dental', 'cleaning', 'landscaping',
    'accounting', 'automotive', 'insurance', 'real_estate', 'property_management', 'restaurant', 'marketing'
  ];

  function ensureModal() {
    let modal = document.querySelector('#order-modal');
    if (modal) return modal;
    const nicheOptions = NICHES.map((n) => {
      const label = n.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `<option value="${n}">${label}</option>`;
    }).join('');
    modal = document.createElement('div');
    modal.className = 'sp-modal';
    modal.id = 'order-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <form class="sp-panel" id="order-form">
        <button class="sp-close" type="button" aria-label="Close">&times;</button>
        <h2 id="order-title">Order package</h2>
        <input type="hidden" name="sku">
        <label>Delivery email<input type="email" name="buyerEmail" required autocomplete="email"></label>
        <div id="audit-fields">
          <label id="client-name-field">Client or business name<input name="clientName" maxlength="100"></label>
          <label>Public website URL<input type="url" name="websiteUrl" placeholder="https://example.com"></label>
          <label id="agency-field">Agency name<input name="agencyName" maxlength="100"></label>
          <label id="gsc-domain-field" hidden>Search Console domain or URL-prefix property
            <input name="gscProperty" maxlength="200" placeholder="example.com or https://www.example.com/">
          </label>
        </div>
        <div id="prospect-fields" hidden>
          <label>Business niche<select name="targetNiche">${nicheOptions}</select></label>
          <label>US city and state<input name="location" placeholder="Tampa, FL"></label>
          <label>Radius<select name="radiusMiles">
            <option value="15">15 miles</option>
            <option value="25" selected>25 miles</option>
            <option value="50">50 miles</option>
          </select></label>
        </div>
        <label class="sp-checks">
          <input type="checkbox" name="acceptedTerms" required>
          <span>I accept the <a href="/service-terms" target="_blank" rel="noopener">service terms and refund policy</a>.</span>
        </label>
        <p class="sp-error" id="order-error" role="alert"></p>
        <button class="sp-buy" id="checkout-button" type="submit">Continue to secure Stripe checkout</button>
      </form>`;
    document.body.appendChild(modal);
    return modal;
  }

  function ensureStatusBox() {
    let box = document.querySelector('#order-status');
    if (box) return box;
    const host = document.querySelector('[data-sp-status-host]') || document.querySelector('.container');
    if (!host) return null;
    box = document.createElement('div');
    box.id = 'order-status';
    box.className = 'sp-status';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<h2 id="order-status-title">Processing your order</h2><p id="order-status-message"></p><p id="order-status-meta" style="opacity:.75;font-size:.9rem;margin:0"></p><div id="order-status-access" class="sp-access-box" hidden></div>';
    host.prepend(box);
    return box;
  }

  function wireModal(modal) {
    const form = modal.querySelector('#order-form');
    const audit = modal.querySelector('#audit-fields');
    const prospect = modal.querySelector('#prospect-fields');
    const clientNameField = modal.querySelector('#client-name-field');
    const agency = modal.querySelector('#agency-field');
    const gscField = modal.querySelector('#gsc-domain-field');
    const error = modal.querySelector('#order-error');
    const submit = modal.querySelector('#checkout-button');
    const MODULE_SKUS = new Set(['ai_search_readiness', 'conversion_leak_audit']);

    document.querySelectorAll('[data-sku]').forEach((button) => {
      if (button.dataset.spWired) return;
      button.dataset.spWired = '1';
      button.addEventListener('click', () => {
        const sku = button.dataset.sku;
        form.reset();
        form.sku.value = sku;
        const isProspect = sku === 'local_opportunity_50';
        const isGsc = sku === 'full_access_gsc_audit';
        const isModule = MODULE_SKUS.has(sku);
        audit.hidden = isProspect;
        prospect.hidden = !isProspect;
        if (clientNameField) {
          clientNameField.hidden = isModule;
          const clientInput = clientNameField.querySelector('input');
          if (clientInput) clientInput.required = !isProspect && !isModule;
        }
        agency.hidden = sku !== 'agency_white_label_health_5';
        if (gscField) {
          gscField.hidden = !isGsc;
          gscField.querySelector('input').required = isGsc;
        }
        const urlInput = audit.querySelector('input[name="websiteUrl"]');
        if (urlInput) urlInput.required = !isProspect;
        error.textContent = '';
        modal.classList.add('is-open');
      });
    });

    modal.querySelector('.sp-close').addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('is-open'); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.textContent = '';
      submit.disabled = true;
      const data = Object.fromEntries(new FormData(form));
      data.acceptedTerms = form.acceptedTerms.checked;
      try {
        const response = await fetch('/api/service-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const body = await response.json();
        if (!response.ok || !body.url) throw new Error(body.error || 'Checkout could not be started.');
        location.href = body.url;
      } catch (err) {
        error.textContent = err.message || 'Checkout could not be started.';
        submit.disabled = false;
      }
    });
  }

  function wireStatus() {
    const statusBox = ensureStatusBox();
    if (!statusBox) return;
    const statusTitle = statusBox.querySelector('#order-status-title');
    const statusMessage = statusBox.querySelector('#order-status-message');
    const statusMeta = statusBox.querySelector('#order-status-meta');
    const accessBox = statusBox.querySelector('#order-status-access');
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id') || '';
    const paid = params.get('paid') === '1';
    const canceled = params.get('canceled') === '1';

    function renderStatus(payload) {
      statusBox.classList.add('is-open');
      statusBox.dataset.state = payload.status || 'pending';
      const titles = {
        awaiting_payment_or_webhook: 'Confirming payment',
        pending: 'Queued',
        awaiting_access: 'Waiting for Search Console access',
        processing: 'Generating deliverable',
        completed: 'Ready',
        failed: 'Retrying quality checks',
        refunded: 'Refunded'
      };
      statusTitle.textContent = titles[payload.status] || 'Order status';
      statusMessage.textContent = payload.buyer_message || 'Updating…';
      const bits = [];
      if (payload.sku) bits.push('SKU: ' + payload.sku);
      if (payload.attempts) bits.push('Attempts: ' + payload.attempts);
      if (payload.delivery_ready) bits.push('Check your email for the private download link.');
      if (payload.refunded) bits.push('No further action needed unless your bank statement is delayed.');
      statusMeta.textContent = bits.join(' · ');
      if (accessBox) {
        if (payload.status === 'awaiting_access') {
          accessBox.hidden = false;
          accessBox.innerHTML = payload.access_instructions
            || 'Add <strong>audits@knightlogics.com</strong> as a user with <strong>Full</strong> permission on your Google Search Console property. We poll for access automatically, then run the audit.';
        } else {
          accessBox.hidden = true;
        }
      }
      return payload.status === 'completed' || payload.status === 'refunded';
    }

    async function pollStatus(id, attempt) {
      try {
        const response = await fetch('/api/service-status?session_id=' + encodeURIComponent(id), { headers: { Accept: 'application/json' } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Status unavailable');
        const done = renderStatus(body);
        if (done || attempt > 60) return;
      } catch (err) {
        renderStatus({
          status: 'awaiting_payment_or_webhook',
          buyer_message: err.message || 'Waiting for order status…'
        });
      }
      const delay = Math.min(1500 * Math.pow(1.12, attempt), 10000);
      setTimeout(() => pollStatus(id, attempt + 1), delay);
    }

    if (canceled) {
      statusBox.classList.add('is-open');
      statusBox.dataset.state = 'failed';
      statusTitle.textContent = 'Checkout canceled';
      statusMessage.textContent = 'No charge was completed. Re-open the package when you are ready.';
    } else if (paid && sessionId) {
      renderStatus({
        status: 'awaiting_payment_or_webhook',
        buyer_message: 'Payment received. Waiting for automated fulfillment…'
      });
      pollStatus(sessionId, 0);
      statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function wireDemoVideos() {
    document.querySelectorAll('figure.sp-demo-video').forEach((figure) => {
      const inner = figure.querySelector('.sp-demo-video__inner');
      if (!inner) return;
      const localSrc = String(figure.getAttribute('data-video-src') || '').trim();
      const id = String(figure.getAttribute('data-youtube-id') || '').trim();
      const title = figure.getAttribute('data-video-title') || 'Package walkthrough';

      if (localSrc) {
        if (inner.querySelector('video')) return;
        const video = document.createElement('video');
        video.src = localSrc;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('title', title);
        if (figure.getAttribute('data-video-poster')) {
          video.poster = figure.getAttribute('data-video-poster');
        }
        inner.innerHTML = '';
        inner.appendChild(video);
        return;
      }

      if (!id) {
        if (!inner.querySelector('.sp-demo-video__placeholder') && !inner.querySelector('video')) {
          inner.innerHTML = '<p class="sp-demo-video__placeholder">Walkthrough video coming soon.</p>';
        }
        return;
      }
      if (inner.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id);
      iframe.title = title;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      inner.innerHTML = '';
      inner.appendChild(iframe);
    });
  }

  function boot() {
    const modal = ensureModal();
    wireModal(modal);
    wireStatus();
    wireDemoVideos();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
