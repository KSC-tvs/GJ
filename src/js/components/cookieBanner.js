/**
 * Digital Personal Data Protection (DPDP) Act 2023 & Privacy Consent Banner
 * Gulshan Jewellers | Est. 1950
 * Compliant with India's DPDP Act 2023 and International Privacy Standards
 */

const STORAGE_KEY = 'gj_dpdp_consent';

export function getConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveConsent(preferences) {
  try {
    const record = {
      essential: true,
      analytics: Boolean(preferences.analytics),
      timestamp: new Date().toISOString(),
      version: '2023-DPDP-1.0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('gj:consent_updated', { detail: record }));
    return record;
  } catch (e) {
    return null;
  }
}

export function initCookieBanner() {
  // If already consented, don't show the initial prompt
  const existingConsent = getConsent();
  if (!existingConsent) {
    // Show banner after brief delay to avoid layout shift
    setTimeout(() => {
      renderCookieBanner();
    }, 1200);
  }

  // Bind any footer "Cookie & Privacy Choices" links
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cookie-settings]') || e.target.closest('#manage-privacy-consent')) {
      e.preventDefault();
      renderCookieModal();
    }
  });
}

function renderCookieBanner() {
  if (document.getElementById('gj-cookie-banner')) return;

  const banner = document.createElement('aside');
  banner.id = 'gj-cookie-banner';
  banner.className = 'gj-cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Privacy and Data Protection Notice');

  banner.innerHTML = `
    <div class="gj-cookie-inner">
      <div class="gj-cookie-content">
        <div class="gj-cookie-header">
          <span class="gj-cookie-shield">🔒</span>
          <strong>Digital Personal Data Protection (DPDP) Notice</strong>
        </div>
        <p class="gj-cookie-text">
          Gulshan Jewellers respects your data dignity. Under India’s Digital Personal Data Protection Act, 2023, we collect essential session data strictly to safeguard your bespoke consultations, cart, and orders. With your permission, we also use anonymised analytics to improve your atelier browsing experience.
          <a href="policies.html#privacy" class="gj-cookie-link">Read Atelier Privacy Policy</a>
        </p>
      </div>
      <div class="gj-cookie-actions">
        <button type="button" class="btn btn-outline btn-sm" id="cookie-essential-only-btn">
          Essential Only
        </button>
        <button type="button" class="btn btn-gold btn-sm" id="cookie-accept-all-btn">
          Accept All Preferences
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Animate in
  requestAnimationFrame(() => {
    banner.classList.add('visible');
  });

  const acceptBtn = banner.querySelector('#cookie-accept-all-btn');
  const essentialBtn = banner.querySelector('#cookie-essential-only-btn');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      saveConsent({ analytics: true });
      closeBanner(banner);
    });
  }

  if (essentialBtn) {
    essentialBtn.addEventListener('click', () => {
      saveConsent({ analytics: false });
      closeBanner(banner);
    });
  }
}

function renderCookieModal() {
  const current = getConsent() || { analytics: true };
  const existingModal = document.getElementById('gj-cookie-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'gj-cookie-modal';
  modal.className = 'modal-backdrop visible';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cookie-modal-title');

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 520px;">
      <div class="modal-header">
        <h3 id="cookie-modal-title" class="modal-title" style="font-family: var(--font-heading); font-size: 1.3rem;">
          Atelier Privacy & Consent Preferences
        </h3>
        <button type="button" class="modal-close" id="cookie-modal-close" aria-label="Close preferences">&times;</button>
      </div>
      <div class="modal-body" style="padding: var(--space-6);">
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-4);">
          Manage how Gulshan Jewellers stores and processes your personal data in accordance with the <strong>Digital Personal Data Protection Act (DPDP Act, 2023)</strong>.
        </p>
        
        <div style="background: rgba(212, 175, 55, 0.05); border: 1px solid var(--color-border-subtle); padding: var(--space-4); border-radius: var(--radius-xs); margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: var(--color-text-primary); font-size: 0.95rem;">Strictly Necessary (Always Active)</strong>
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-gold-champagne); font-weight: 600;">Required</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0; line-height: 1.5;">
            Required for bag storage, encrypted order tokens, birth chart intake transmission, and checkout security.
          </p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--color-border-subtle); padding: var(--space-4); border-radius: var(--radius-xs); margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label for="consent-analytics-toggle" style="cursor: pointer;">
              <strong style="color: var(--color-text-primary); font-size: 0.95rem;">Audience Measurement & Analytics</strong>
            </label>
            <input type="checkbox" id="consent-analytics-toggle" ${current.analytics ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-gold-champagne); cursor: pointer;">
          </div>
          <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0; line-height: 1.5;">
            Allows us to evaluate catalogue popularity and resolve navigation friction anonymously without personal profiling.
          </p>
        </div>

        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline btn-sm" id="cookie-modal-cancel">Cancel</button>
          <button type="button" class="btn btn-gold btn-sm" id="cookie-modal-save">Save Preferences</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#cookie-modal-close');
  const cancelBtn = modal.querySelector('#cookie-modal-cancel');
  const saveBtn = modal.querySelector('#cookie-modal-save');
  const toggle = modal.querySelector('#consent-analytics-toggle');

  const closeModal = () => modal.remove();

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveConsent({ analytics: toggle ? toggle.checked : true });
      closeModal();
      const existingBanner = document.getElementById('gj-cookie-banner');
      if (existingBanner) closeBanner(existingBanner);
    });
  }
}

function closeBanner(banner) {
  banner.classList.remove('visible');
  setTimeout(() => {
    banner.remove();
  }, 400);
}
