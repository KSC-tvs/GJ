/**
 * Global Shell & Enterprise Orchestration
 * Gulshan Jewellers | Est. 1950
 */

import { fetchSiteConfig } from './data.js';
import { store } from './state/store.js';
import { Tracking } from './tracking.js';
import { showToast } from './components/toast.js';
import { initSearchModal, openSearchModal, closeSearchModal } from './components/searchModal.js';
import { initConsultationTray, openTrayDrawer, closeTrayDrawer, openComparisonModal, closeComparisonModal } from './components/consultationTray.js';
import { initRingSizeModal, openRingSizeModal, closeRingSizeModal } from './components/ringSizeModal.js';
import { initMegamenu } from './components/megamenu.js';
import { initMobileNav, openMobileDrawer, closeMobileDrawer } from './components/mobileNav.js';
import { initInteractiveFeatures } from './components/interactive.js';

export { showToast, openMobileDrawer, closeMobileDrawer };

let siteConfig = null;

document.addEventListener('DOMContentLoaded', async () => {
  siteConfig = await fetchSiteConfig();
  initHeader();
  initCurrencySelector();
  initEnquiryDrawer();
  initMobileNav();
  initMegamenu();
  initSearchModal();
  initConsultationTray();
  initRingSizeModal();
  initInteractiveFeatures();
  setupGlobalTriggers();
});

/* --------------------------------------------------------------------------
   Header Navigation & Scroll State
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.split('?')[0])) {
      link.classList.add('active');
    }
  });
}

/* --------------------------------------------------------------------------
   Multi-Currency Selector Binding
   -------------------------------------------------------------------------- */
function initCurrencySelector() {
  const selects = document.querySelectorAll('.currency-selector');
  const current = store.getCurrency();

  selects.forEach(select => {
    select.value = current;
    select.addEventListener('change', (e) => {
      store.setCurrency(e.target.value);
      showToast(`Currency changed to ${e.target.value}.`);
    });
  });

  store.subscribe('currency', (curr) => {
    selects.forEach(s => s.value = curr);
  });
}

/* --------------------------------------------------------------------------
   Mobile Drawer & Dock Navigation handled in mobileNav.js
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Universal Consultation & Enquiry Drawer
   -------------------------------------------------------------------------- */
function initEnquiryDrawer() {
  let backdrop = document.getElementById('consultation-drawer');
  if (!backdrop) {
    backdrop = createDrawerDOM();
    document.body.appendChild(backdrop);
  }

  const closeBtn = backdrop.querySelector('.drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeEnquiryModal);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeEnquiryModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      closeEnquiryModal();
    }
  });

  const form = document.getElementById('universal-enquiry-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleEnquirySubmission(form);
    });
  }

  const waBtn = document.getElementById('drawer-whatsapp-btn');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      handleWhatsAppDispatch();
    });
  }
}

function createDrawerDOM() {
  const div = document.createElement('div');
  div.id = 'consultation-drawer';
  div.className = 'drawer-backdrop';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-modal', 'true');
  div.setAttribute('aria-labelledby', 'drawer-heading');

  div.innerHTML = `
    <div class="drawer">
      <div class="drawer-header">
        <div>
          <span class="section-eyebrow" style="margin: 0; font-size: 0.65rem;">Gulshan Jewellers · Est. 1950</span>
          <h3 id="drawer-heading" class="drawer-title">Private Consultation</h3>
        </div>
        <button class="drawer-close" aria-label="Close consultation modal">&times;</button>
      </div>
      <div class="drawer-body">
        <div id="drawer-product-preview" style="display: none;" class="enquiry-product-summary">
          <img id="drawer-thumb" src="" alt="Product preview" class="enquiry-product-thumb">
          <div>
            <h4 id="drawer-product-title" style="font-size: 1rem; color: var(--color-ivory);"></h4>
            <p id="drawer-product-spec" style="font-size: 0.75rem; color: var(--color-gold-champagne); margin-top: 2px;"></p>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--color-text-secondary);">
          Every considered piece begins with an honest conversation. Share your questions regarding gemstone quality, certified origin, bespoke setting options, or personal preference.
        </p>

        <form id="universal-enquiry-form">
          <input type="hidden" id="enquiry-product-id" name="productId" value="">
          <input type="hidden" id="enquiry-product-name" name="productName" value="">

          <div class="form-group">
            <label class="form-label" for="enquiry-name">Your Full Name</label>
            <input type="text" id="enquiry-name" name="name" class="form-control" required placeholder="e.g. Rohini Sharma">
          </div>

          <div class="form-group">
            <label class="form-label" for="enquiry-contact">Phone / WhatsApp Number</label>
            <input type="tel" id="enquiry-contact" name="phone" class="form-control" required placeholder="e.g. +91 95828 41454">
          </div>

          <div class="form-group">
            <label class="form-label" for="enquiry-interest">Nature of Enquiry</label>
            <select id="enquiry-interest" name="interest" class="form-control">
              <option value="gemstone-guidance">Gemstone Quality & Astrological Guidance</option>
              <option value="price-availability">Price & Availability on Request</option>
              <option value="bespoke-design">Bespoke Setting / Custom Creation</option>
              <option value="everyday-fine">Everyday Fine Jewellery / Gifting</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="enquiry-message">Your Message or Requirements</label>
            <textarea id="enquiry-message" name="message" class="form-control" placeholder="Mention preferred carat weight, natural gemstone query, metal preference (22K, 18K, 925 Silver), or occasion..."></textarea>
          </div>

          <p class="form-disclaimer">
            <strong>Authenticity & Trust Note:</strong> Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.
          </p>

          <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);">
            <button type="submit" class="btn btn-gold btn-lg" style="width: 100%;">
              Submit Consultation Request
            </button>
            <button type="button" id="drawer-whatsapp-btn" class="btn btn-whatsapp" style="width: 100%;">
              <span>Chat Directly on WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  return div;
}

export function openEnquiryModal(productData = null) {
  const backdrop = document.getElementById('consultation-drawer');
  if (!backdrop) return;

  const preview = document.getElementById('drawer-product-preview');
  const thumb = document.getElementById('drawer-thumb');
  const titleEl = document.getElementById('drawer-product-title');
  const specEl = document.getElementById('drawer-product-spec');
  const hiddenId = document.getElementById('enquiry-product-id');
  const hiddenName = document.getElementById('enquiry-product-name');
  const messageInput = document.getElementById('enquiry-message');

  if (productData) {
    preview.style.display = 'flex';
    thumb.src = productData.image;
    titleEl.textContent = productData.title;
    specEl.textContent = productData.badges ? Object.values(productData.badges).filter(Boolean).join(' · ') : '';
    hiddenId.value = productData.id || '';
    hiddenName.value = productData.title || '';
    messageInput.value = `I would like to enquire about "${productData.title}". Please share details regarding certified natural stone options, metal settings, and availability.`;
    Tracking.trackEnquiryClick(productData.title, productData.primaryCategory);
  } else {
    preview.style.display = 'none';
    hiddenId.value = '';
    hiddenName.value = 'General Consultation';
    messageInput.value = '';
  }

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeEnquiryModal() {
  const backdrop = document.getElementById('consultation-drawer');
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

function handleEnquirySubmission(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  Tracking.trackConsultationSubmit(data);

  // Record into Admin CRM
  try {
    const existing = JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
    existing.unshift({
      id: 'ENQ-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      name: data.name || 'Client',
      contact: data.contact || data.phone || data.email || '+91 95828 41454',
      piece: document.getElementById('enquiry-product-name')?.value || 'Fine Jewellery & Gemstones',
      message: data.message || 'Consultation request submitted from digital boutique.',
      status: 'New'
    });
    localStorage.setItem('gj_enquiries', JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to log CRM inquiry', err);
  }

  showToast('Thank you. A member of the Gulshan Jewellers team will be in touch shortly.');
  form.reset();
  setTimeout(() => {
    closeEnquiryModal();
  }, 1200);
}

function handleWhatsAppDispatch() {
  const productName = document.getElementById('enquiry-product-name').value || 'Fine Jewellery & Gemstones';
  const customMessage = document.getElementById('enquiry-message').value || `Hello Gulshan Jewellers, I would like to consult with you regarding ${productName}.`;

  const phone = siteConfig?.contact?.whatsappNumber || '919582841454';
  const encoded = encodeURIComponent(customMessage);
  const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encoded}`;

  Tracking.trackWhatsAppClick('drawer_button', customMessage);
  window.open(url, '_blank');
}

function setupGlobalTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-trigger-consultation]');
    if (trigger) {
      e.preventDefault();
      openEnquiryModal();
    }
  });
}

// Global window object API
window.GJ = {
  openEnquiryModal,
  closeEnquiryModal,
  openSearchModal,
  closeSearchModal,
  openTrayDrawer,
  closeTrayDrawer,
  openComparisonModal,
  closeComparisonModal,
  openRingSizeModal,
  closeRingSizeModal,
  openMobileDrawer,
  closeMobileDrawer,
  showToast,
  store
};
