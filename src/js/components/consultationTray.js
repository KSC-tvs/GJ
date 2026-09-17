/**
 * Consultation Tray & Side-by-Side Comparison Matrix
 * Gulshan Jewellers | Est. 1950
 */

import { store } from '../state/store.js';
import { formatPrice } from '../state/currency.js';
import { showToast } from './toast.js';

let trayDrawerDOM = null;
let comparisonModalDOM = null;

export function initConsultationTray() {
  createTrayDrawerDOM();
  createComparisonModalDOM();
  updateTrayPill();

  // Subscribe to store tray changes
  store.subscribe('tray', () => {
    updateTrayPill();
    renderTrayItems();
  });

  store.subscribe('currency', () => {
    renderTrayItems();
  });

  setupTrayGlobalTriggers();
}

function createTrayDrawerDOM() {
  if (document.getElementById('consultation-tray-drawer')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'consultation-tray-drawer';
  backdrop.className = 'drawer-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="drawer">
      <div class="drawer-header">
        <div>
          <span class="section-eyebrow" style="margin: 0; font-size: 0.65rem;">Bespoke Curation</span>
          <h3 class="drawer-title">My Consultation Tray</h3>
        </div>
        <button class="drawer-close" aria-label="Close tray">&times;</button>
      </div>
      <div class="drawer-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.6;">
          Shortlist up to 4 gemstones or pieces to compare specifications side-by-side or send directly to our master jeweller for considered guidance.
        </p>

        <div id="tray-items-list" class="tray-items-container">
          <!-- Populated dynamically -->
        </div>

        <div id="tray-footer-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--color-border-hairline);">
          <button type="button" id="tray-compare-btn" class="btn btn-outline" style="width: 100%;">
            Compare Specs Side-by-Side
          </button>
          <button type="button" id="tray-whatsapp-btn" class="btn btn-whatsapp" style="width: 100%;">
            Send Tray via WhatsApp
          </button>
          <button type="button" id="tray-book-btn" class="btn btn-gold" style="width: 100%;">
            Book Private Consultation for Tray
          </button>
          <button type="button" id="tray-clear-btn" class="btn-link" style="align-self: center; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
            Clear All Items from Tray
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  trayDrawerDOM = backdrop;

  const closeBtn = backdrop.querySelector('.drawer-close');
  closeBtn.addEventListener('click', closeTrayDrawer);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTrayDrawer();
  });

  // Action Buttons
  backdrop.querySelector('#tray-compare-btn').addEventListener('click', () => {
    const items = store.getTray();
    if (items.length < 2) {
      showToast('Please add at least 2 pieces to compare specifications.');
      return;
    }
    closeTrayDrawer();
    openComparisonModal();
  });

  backdrop.querySelector('#tray-whatsapp-btn').addEventListener('click', handleTrayWhatsAppSend);
  backdrop.querySelector('#tray-book-btn').addEventListener('click', () => {
    closeTrayDrawer();
    const items = store.getTray();
    const titles = items.map(i => i.title).join(', ');
    window.GJ.openEnquiryModal({
      title: `Curated Tray Consultation (${items.length} pieces)`,
      primaryCategory: 'Curated Tray',
      image: items[0]?.image || '/images/pukhraj-hero.jpg'
    });
  });

  backdrop.querySelector('#tray-clear-btn').addEventListener('click', () => {
    store.clearTray();
    showToast('Consultation Tray cleared.');
  });
}

function updateTrayPill() {
  const pills = document.querySelectorAll('.tray-counter-pill');
  const tray = store.getTray();
  pills.forEach(pill => {
    pill.textContent = tray.length;
    pill.style.display = tray.length > 0 ? 'inline-flex' : 'none';
  });
}

function renderTrayItems() {
  const container = document.getElementById('tray-items-list');
  const footerActions = document.getElementById('tray-footer-actions');
  if (!container) return;

  const items = store.getTray();
  const currentCurrency = store.getCurrency();

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <span style="font-size: 2rem; color: var(--color-gold-champagne); display: block; margin-bottom: var(--space-2);">&#9671;</span>
        <h4 style="color: var(--color-ivory); margin-bottom: var(--space-1);">Your Consultation Tray is Empty</h4>
        <p style="font-size: 0.8rem; color: var(--color-text-muted); max-width: 280px; margin: 0 auto var(--space-4);">
          Browse our natural gemstones and fine jewellery, and click "Add to Tray" to shortlist pieces for personal consultation.
        </p>
        <a href="collections.html" class="btn btn-outline btn-sm" onclick="GJ.closeTrayDrawer()">
          Explore Collections
        </a>
      </div>
    `;
    if (footerActions) footerActions.style.display = 'none';
    return;
  }

  if (footerActions) footerActions.style.display = 'flex';

  container.innerHTML = items.map(item => `
    <div class="tray-card">
      <img src="${item.image}" alt="${item.title}" class="tray-card-thumb">
      <div class="tray-card-content">
        <h4 class="tray-card-title">
          <a href="product.html?id=${item.id}">${item.title}</a>
        </h4>
        <div class="tray-card-meta">
          <span class="tray-card-price">
            ${item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay}
          </span>
          <span style="font-size: 0.72rem; color: var(--color-gold-champagne);">
            ${item.badges?.treatment || item.badges?.hallmark || 'Fine Selection'}
          </span>
        </div>
      </div>
      <button type="button" class="tray-remove-btn" data-id="${item.id}" aria-label="Remove item">&times;</button>
    </div>
  `).join('');

  container.querySelectorAll('.tray-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      store.removeFromTray(id);
      showToast('Piece removed from your tray.');
    });
  });
}

export function openTrayDrawer() {
  if (!trayDrawerDOM) createTrayDrawerDOM();
  renderTrayItems();
  trayDrawerDOM.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeTrayDrawer() {
  if (!trayDrawerDOM) return;
  trayDrawerDOM.classList.remove('active');
  document.body.style.overflow = '';
}

function handleTrayWhatsAppSend() {
  const items = store.getTray();
  if (items.length === 0) return;

  const lines = [
    'Hello Gulshan Jewellers, I would like to enquire about my Curated Consultation Tray:',
    ...items.map((it, idx) => `${idx + 1}. *${it.title}* (${it.priceDisplay}) — ${it.specs?.gemstoneType || ''} [${it.specs?.metalPurity || ''}]`),
    '',
    'Please advise on current certified loose stones, custom setting options, and appointment availability.'
  ];

  const phone = '919876543210';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank');
}

/* --------------------------------------------------------------------------
   Side-by-Side Comparison Matrix Modal
   -------------------------------------------------------------------------- */
function createComparisonModalDOM() {
  if (document.getElementById('comparison-matrix-modal')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'comparison-matrix-modal';
  backdrop.className = 'comparison-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="comparison-modal-container">
      <div class="comparison-modal-header">
        <div>
          <span class="section-eyebrow" style="margin: 0; font-size: 0.65rem;">Objective Gemological Comparison</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-ivory);">Specification Matrix</h3>
        </div>
        <button class="comparison-modal-close" aria-label="Close comparison">&times;</button>
      </div>
      <div class="comparison-modal-body" id="comparison-matrix-content">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  comparisonModalDOM = backdrop;

  backdrop.querySelector('.comparison-modal-close').addEventListener('click', closeComparisonModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeComparisonModal();
  });
}

export function openComparisonModal() {
  const items = store.getTray();
  const content = document.getElementById('comparison-matrix-content');
  if (!content || items.length < 2) return;

  const currentCurrency = store.getCurrency();

  content.innerHTML = `
    <div style="overflow-x: auto;">
      <table class="comparison-table">
        <thead>
          <tr>
            <th style="width: 200px;">Attribute</th>
            ${items.map(item => `
              <th>
                <img src="${item.image}" alt="${item.title}" class="comparison-thumb">
                <div class="comparison-item-title">${item.title}</div>
                <div class="comparison-item-price">${item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gemstone Species</td>
            ${items.map(item => `<td>${item.specs?.gemstoneType || 'N/A'}</td>`).join('')}
          </tr>
          <tr>
            <td>Natural Earth Status</td>
            ${items.map(item => `<td><strong>${item.specs?.naturalStatus || 'Natural'}</strong></td>`).join('')}
          </tr>
          <tr>
            <td>Carat Weight</td>
            ${items.map(item => `<td>${item.specs?.caratWeight || 'Customizable'}</td>`).join('')}
          </tr>
          <tr>
            <td>Treatment Disclosure</td>
            ${items.map(item => `<td class="highlight-spec">${item.specs?.treatmentDisclosure || 'Untreated'}</td>`).join('')}
          </tr>
          <tr>
            <td>Origin Verification</td>
            ${items.map(item => `<td>${item.specs?.origin || 'Verified per certification'}</td>`).join('')}
          </tr>
          <tr>
            <td>Independent Lab Report</td>
            ${items.map(item => `<td>${item.specs?.certificate || 'Certificate Available'}</td>`).join('')}
          </tr>
          <tr>
            <td>Metal & Karat Purity</td>
            ${items.map(item => `<td>${item.specs?.metalPurity || 'Hallmarked Gold'}</td>`).join('')}
          </tr>
          <tr>
            <td>Customisation Scope</td>
            ${items.map(item => `<td>${item.specs?.customisation || 'Bespoke handcrafting available'}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: var(--space-6); text-align: center;">
      <button type="button" class="btn btn-gold" onclick="GJ.closeComparisonModal(); GJ.openEnquiryModal({title: 'Multi-Stone Matrix Consultation', primaryCategory: 'Curated Comparison'});">
        Discuss This Comparison With a Specialist
      </button>
    </div>
  `;

  comparisonModalDOM.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeComparisonModal() {
  if (!comparisonModalDOM) return;
  comparisonModalDOM.classList.remove('active');
  document.body.style.overflow = '';
}

function setupTrayGlobalTriggers() {
  document.addEventListener('click', (e) => {
    // Open tray button
    if (e.target.closest('[data-trigger-tray]')) {
      e.preventDefault();
      openTrayDrawer();
    }

    // Add to tray button
    const addBtn = e.target.closest('[data-add-to-tray]');
    if (addBtn) {
      e.preventDefault();
      const productJson = addBtn.getAttribute('data-product');
      if (productJson) {
        try {
          const prod = JSON.parse(productJson);
          const res = store.addToTray(prod);
          showToast(res.message, res.success ? 'success' : 'info');
        } catch (err) {
          console.error('Error adding to tray:', err);
        }
      }
    }
  });
}
