/**
 * Global Search & Command Modal (Cmd+K)
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProducts, fetchGemstones } from '../data.js';
import { store } from '../state/store.js';
import { formatPrice } from '../state/currency.js';

let searchModalDOM = null;
let productsCache = [];
let gemstonesCache = [];

export async function initSearchModal() {
  productsCache = await fetchProducts();
  gemstonesCache = await fetchGemstones();

  createModalDOM();
  setupShortcuts();
}

function createModalDOM() {
  if (document.getElementById('global-search-modal')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'global-search-modal';
  backdrop.className = 'search-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'search-modal-title');

  backdrop.innerHTML = `
    <div class="search-modal-container">
      <div class="search-modal-header">
        <span class="search-icon-svg">&#128269;</span>
        <input 
          type="search" 
          id="global-search-input" 
          class="search-modal-input" 
          placeholder="Search natural gemstones, carats, 18K/22K gold, everyday diamonds..." 
          autocomplete="off"
          spellcheck="false"
        >
        <span class="search-kbd-hint">ESC</span>
        <button class="search-modal-close" aria-label="Close search">&times;</button>
      </div>

      <div class="search-quick-tags">
        <span class="search-tag-label">Popular:</span>
        <button type="button" class="search-quick-btn" data-query="Ceylon Yellow Sapphire">Ceylon Pukhraj</button>
        <button type="button" class="search-quick-btn" data-query="Blue Sapphire">Royal Neelam</button>
        <button type="button" class="search-quick-btn" data-query="Colombian Emerald">Emerald</button>
        <button type="button" class="search-quick-btn" data-query="Everyday Diamond">Everyday Diamonds</button>
        <button type="button" class="search-quick-btn" data-query="Blue Kyanite">Kyanite Alternative</button>
      </div>

      <div class="search-results-container" id="search-results-container">
        <div class="search-idle-state">
          <p style="color: var(--color-text-muted); font-size: var(--text-sm);">
            Type a gemstone name, origin, metal karat, or style to search our atelier.
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  searchModalDOM = backdrop;

  // Event Listeners
  const input = backdrop.querySelector('#global-search-input');
  const closeBtn = backdrop.querySelector('.search-modal-close');

  closeBtn.addEventListener('click', closeSearchModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSearchModal();
  });

  input.addEventListener('input', (e) => {
    handleSearchInput(e.target.value.trim());
  });

  backdrop.querySelectorAll('.search-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      input.value = q;
      handleSearchInput(q);
      input.focus();
    });
  });
}

function setupShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    // Escape
    if (e.key === 'Escape' && searchModalDOM?.classList.contains('active')) {
      closeSearchModal();
    }
  });

  // Global triggers
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-trigger-search]')) {
      e.preventDefault();
      openSearchModal();
    }
  });
}

export function openSearchModal() {
  if (!searchModalDOM) createModalDOM();
  searchModalDOM.classList.add('active');
  document.body.style.overflow = 'hidden';
  const input = searchModalDOM.querySelector('#global-search-input');
  setTimeout(() => input.focus(), 50);
}

export function closeSearchModal() {
  if (!searchModalDOM) return;
  searchModalDOM.classList.remove('active');
  document.body.style.overflow = '';
}

function handleSearchInput(query) {
  const container = document.getElementById('search-results-container');
  if (!container) return;

  if (!query || query.length < 2) {
    container.innerHTML = `
      <div class="search-idle-state">
        <p style="color: var(--color-text-muted); font-size: var(--text-sm);">
          Type at least 2 characters to search...
        </p>
      </div>
    `;
    return;
  }

  store.addRecentSearch(query);
  const q = query.toLowerCase();

  // Search in Products
  const matchedProducts = productsCache.filter(item => {
    const hay = `${item.title} ${item.poeticDescriptor} ${item.specs?.gemstoneType || ''} ${item.specs?.metalPurity || ''} ${item.specs?.origin || ''} ${item.specs?.treatmentDisclosure || ''}`.toLowerCase();
    return hay.includes(q);
  });

  // Search in Gemstone Guide
  const matchedGuides = gemstonesCache.filter(gem => {
    return gem.name.toLowerCase().includes(q) ||
           gem.traditionalName.toLowerCase().includes(q) ||
           gem.planetaryAssociation.toLowerCase().includes(q) ||
           gem.summary.toLowerCase().includes(q);
  });

  if (matchedProducts.length === 0 && matchedGuides.length === 0) {
    container.innerHTML = `
      <div class="search-no-results">
        <h4 style="color: var(--color-ivory); margin-bottom: var(--space-2);">No matching pieces found for "${query}"</h4>
        <p style="color: var(--color-text-secondary); font-size: var(--text-xs); margin-bottom: var(--space-4);">
          Looking for a specific carat weight, unheated sapphire, or bespoke design?
        </p>
        <button type="button" class="btn btn-outline btn-sm" onclick="GJ.openEnquiryModal(); GJ.closeSearchModal();">
          Request Bespoke Sourcing Consultation
        </button>
      </div>
    `;
    return;
  }

  const currentCurrency = store.getCurrency();

  let html = '';

  if (matchedGuides.length > 0) {
    html += `
      <div class="search-section-label">Gemstone Educational Guides</div>
      <div class="search-guide-results">
        ${matchedGuides.map(g => `
          <a href="gemstone-guide.html#guide-${g.id}" class="search-guide-item" onclick="GJ.closeSearchModal()">
            <span class="search-guide-dot" style="background-color: ${g.color};"></span>
            <div>
              <strong style="color: var(--color-ivory); font-size: 0.9rem;">${g.name} (${g.traditionalName})</strong>
              <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block;">${g.planetaryAssociation}</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  if (matchedProducts.length > 0) {
    html += `
      <div class="search-section-label">Fine Jewellery & Pieces (${matchedProducts.length})</div>
      <div class="search-products-list">
        ${matchedProducts.map(p => `
          <a href="product.html?id=${p.id}" class="search-product-item" onclick="GJ.closeSearchModal()">
            <img src="${p.image}" alt="${p.title}" class="search-product-thumb">
            <div class="search-product-info">
              <h4 class="search-product-title">${p.title}</h4>
              <p class="search-product-desc">${p.poeticDescriptor}</p>
              <div class="search-product-meta">
                <span class="search-product-price">
                  ${p.priceAmount ? formatPrice(p.priceAmount, currentCurrency) : p.priceDisplay}
                </span>
                <span style="color: var(--color-border-subtle);">&middot;</span>
                <span class="search-product-badge">
                  ${p.badges?.treatment || p.badges?.hallmark || 'Fine Jewellery'}
                </span>
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
}
