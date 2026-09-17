/**
 * Collections Browser & Faceted Filtering
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProducts } from './data.js';
import { store } from './state/store.js';
import { formatPrice } from './state/currency.js';
import { openEnquiryModal } from './main.js';
import { showToast } from './components/toast.js';

let allProducts = [];
let activeFilters = {
  category: 'all',
  gemstone: [],
  metal: [],
  occasion: [],
  certifiedOnly: false,
  search: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  allProducts = await fetchProducts();
  readUrlParameters();
  initFilterListeners();
  initMobileFilters();
  renderProducts();

  // Listen to currency changes
  store.subscribe('currency', () => {
    renderProducts();
  });

  // Listen to CMS catalogue changes
  store.subscribe('cmsProducts', async () => {
    allProducts = await fetchProducts();
    renderProducts();
  });
});

function readUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const gemstoneParam = params.get('gemstone');
  const searchParam = params.get('search');

  if (categoryParam) {
    activeFilters.category = categoryParam;
    const catRadio = document.querySelector(`input[name="category-filter"][value="${categoryParam}"]`);
    if (catRadio) catRadio.checked = true;
  }

  if (gemstoneParam) {
    activeFilters.gemstone = [gemstoneParam];
    const gemCheckbox = document.querySelector(`input[name="gem-filter"][value="${gemstoneParam}"]`);
    if (gemCheckbox) gemCheckbox.checked = true;
  }

  if (searchParam) {
    activeFilters.search = searchParam.toLowerCase();
    const searchInput = document.getElementById('collection-search');
    if (searchInput) searchInput.value = searchParam;
  }
}

function initFilterListeners() {
  // Category Radio / Tabs
  const categoryInputs = document.querySelectorAll('input[name="category-filter"]');
  categoryInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      activeFilters.category = e.target.value;
      renderProducts();
    });
  });

  // Gemstone Checkboxes
  const gemInputs = document.querySelectorAll('input[name="gem-filter"]');
  gemInputs.forEach(input => {
    input.addEventListener('change', () => {
      activeFilters.gemstone = Array.from(gemInputs)
        .filter(i => i.checked)
        .map(i => i.value);
      renderProducts();
    });
  });

  // Metal Checkboxes
  const metalInputs = document.querySelectorAll('input[name="metal-filter"]');
  metalInputs.forEach(input => {
    input.addEventListener('change', () => {
      activeFilters.metal = Array.from(metalInputs)
        .filter(i => i.checked)
        .map(i => i.value);
      renderProducts();
    });
  });

  // Occasion Checkboxes
  const occasionInputs = document.querySelectorAll('input[name="occasion-filter"]');
  occasionInputs.forEach(input => {
    input.addEventListener('change', () => {
      activeFilters.occasion = Array.from(occasionInputs)
        .filter(i => i.checked)
        .map(i => i.value);
      renderProducts();
    });
  });

  // Certified Only Toggle
  const certInput = document.getElementById('filter-certified-only');
  if (certInput) {
    certInput.addEventListener('change', (e) => {
      activeFilters.certifiedOnly = e.target.checked;
      renderProducts();
    });
  }

  // Search Input
  const searchInput = document.getElementById('collection-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.search = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeFilters = {
        category: 'all',
        gemstone: [],
        metal: [],
        occasion: [],
        certifiedOnly: false,
        search: ''
      };
      document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
      const allCat = document.querySelector('input[name="category-filter"][value="all"]');
      if (allCat) allCat.checked = true;
      if (searchInput) searchInput.value = '';
      renderProducts();
    });
  }
}

function initMobileFilters() {
  const openBtn = document.getElementById('mobile-filter-btn');
  const closeBtn = document.getElementById('mobile-filter-drawer-close');
  const applyBtn = document.getElementById('mobile-filter-apply-btn');
  const sidebar = document.getElementById('filter-sidebar');
  if (!sidebar) return;

  function openFilters() {
    sidebar.classList.add('mobile-open');
    document.body.classList.add('filter-drawer-open');
  }

  function closeFilters() {
    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('filter-drawer-open');
  }

  if (openBtn) openBtn.addEventListener('click', openFilters);
  if (closeBtn) closeBtn.addEventListener('click', closeFilters);
  if (applyBtn) applyBtn.addEventListener('click', closeFilters);
}

function getActiveFilterCount() {
  let count = 0;
  if (activeFilters.category !== 'all') count++;
  count += activeFilters.gemstone.length;
  count += activeFilters.metal.length;
  count += activeFilters.occasion.length;
  if (activeFilters.certifiedOnly) count++;
  if (activeFilters.search) count++;
  return count;
}

function filterProductList(products) {
  return products.filter(item => {
    if (activeFilters.category !== 'all' && item.primaryCategory !== activeFilters.category) {
      return false;
    }
    if (activeFilters.gemstone.length > 0 && !activeFilters.gemstone.includes(item.gemstone)) {
      return false;
    }
    if (activeFilters.metal.length > 0 && !activeFilters.metal.includes(item.metal)) {
      return false;
    }
    if (activeFilters.occasion.length > 0) {
      if (activeFilters.occasion.includes('daily') && !item.isDailyWear) return false;
      if (activeFilters.occasion.includes('occasion') && item.occasion !== 'occasion') return false;
      if (activeFilters.occasion.includes('gifting') && item.occasion !== 'gifting' && item.type !== 'gifts') return false;
    }
    if (activeFilters.certifiedOnly && !item.badges?.certification) {
      return false;
    }
    if (activeFilters.search) {
      const matchString = `${item.title} ${item.poeticDescriptor} ${item.specs?.gemstoneType || ''} ${item.specs?.metalPurity || ''}`.toLowerCase();
      if (!matchString.includes(activeFilters.search)) {
        return false;
      }
    }
    return true;
  });
}

function renderProducts() {
  const grid = document.getElementById('collections-product-grid');
  const countEl = document.getElementById('collection-count');
  const mobileCountEl = document.getElementById('mobile-pieces-count');
  const filterPill = document.getElementById('mobile-filter-pill');
  if (!grid) return;

  const filtered = filterProductList(allProducts);
  const currentCurrency = store.getCurrency();

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} considered ${filtered.length === 1 ? 'piece' : 'pieces'}`;
  }
  if (mobileCountEl) {
    mobileCountEl.textContent = `${filtered.length} considered ${filtered.length === 1 ? 'piece' : 'pieces'}`;
  }
  if (filterPill) {
    const activeCount = getActiveFilterCount();
    filterPill.textContent = activeCount;
    filterPill.style.display = activeCount > 0 ? 'inline-flex' : 'none';
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16) 0;">
        <h3 style="font-size: 1.5rem; color: var(--color-ivory); margin-bottom: var(--space-2);">No pieces matched your selected filters</h3>
        <p style="font-size: 0.9rem; color: var(--color-text-secondary); max-width: 460px; margin: 0 auto var(--space-6);">
          Every piece at Gulshan Jewellers can also be custom-created around your specific gemstone, metal purity, or budget.
        </p>
        <button type="button" class="btn btn-outline" data-trigger-consultation>
          Request a Custom Design Consultation
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const priceFormatted = item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay;

    return `
      <article class="product-card">
        <div class="product-card-media">
          <a href="product.html?id=${item.id}" aria-label="View ${item.title}">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
          </a>
          <div class="product-badges">
            ${item.badges?.natural ? `<span class="badge badge-natural">Natural</span>` : ''}
            ${item.badges?.treatment ? `<span class="badge badge-cert">${item.badges.treatment}</span>` : ''}
            ${item.badges?.certification ? `<span class="badge badge-cert">${item.badges.certification}</span>` : ''}
            ${item.badges?.hallmark ? `<span class="badge badge-hallmark">${item.badges.hallmark}</span>` : ''}
          </div>
        </div>
        <div class="product-card-content">
          <h3 class="product-card-title">
            <a href="product.html?id=${item.id}">${item.title}</a>
          </h3>
          <p class="product-card-desc">${item.poeticDescriptor}</p>
          <div class="product-card-footer">
            <span class="product-price">${priceFormatted}</span>
            <div style="display: flex; gap: var(--space-2);">
              <button type="button" class="btn btn-outline btn-sm quick-tray-btn" data-id="${item.id}" title="Add to Consultation Tray">
                + Tray
              </button>
              <button type="button" class="btn btn-gold btn-sm quick-enquire-btn" data-product-id="${item.id}">
                Enquire
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Quick Enquire
  grid.querySelectorAll('.quick-enquire-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-product-id');
      const prod = allProducts.find(p => p.id === id);
      if (prod) openEnquiryModal(prod);
    });
  });

  // Quick Add to Tray
  grid.querySelectorAll('.quick-tray-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = allProducts.find(p => p.id === id);
      if (prod) {
        const res = store.addToTray(prod);
        showToast(res.message, res.success ? 'success' : 'info');
      }
    });
  });
}
