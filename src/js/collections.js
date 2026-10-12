/**
 * Collections Browser & Faceted Filtering
 * Gulshan Jewellers | Est. 1950
 * Enterprise Filtering with URL Synchronization, Sorting, and Hybrid Commerce
 */

import { fetchProducts, normalizeAssetPath } from './data.js';
import { store } from './state/store.js';
import { cart } from './state/cart.js';
import { openCartDrawer } from './components/cartDrawer.js';
import { formatPrice } from './state/currency.js';
import { openEnquiryModal } from './main.js';
import { showToast } from './components/toast.js';

let allProducts = [];
let activeFilters = {
  category: 'all',
  gemstone: [],
  metal: [],
  occasion: [],
  price: [],
  availability: [],
  certifiedOnly: false,
  untreatedOnly: false,
  search: '',
  sort: 'featured'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    allProducts = await fetchProducts();
    // Expose products on window for quick access by global triggers
    window.productsData = allProducts;
    
    readUrlParameters();
    initFilterListeners();
    initMobileFilters();
    initSortListener();
    renderProducts();

    // Listen to currency changes
    store.subscribe('currency', () => {
      renderProducts();
    });

    // Listen to CMS catalogue changes
    store.subscribe('cmsProducts', async () => {
      try {
        allProducts = await fetchProducts();
        window.productsData = allProducts;
        renderProducts();
      } catch (e) {
        console.warn('Failed to refresh catalogue:', e);
      }
    });

    // Listen to browser forward/back buttons
    window.addEventListener('popstate', () => {
      readUrlParameters();
      renderProducts();
    });
  } catch (err) {
    console.error('Failed to load catalogue:', err);
    renderCatalogueError(err);
  }
});

function syncFiltersToUrl() {
  const params = new URLSearchParams();

  if (activeFilters.category && activeFilters.category !== 'all') {
    params.set('category', activeFilters.category);
  }
  if (activeFilters.gemstone.length > 0) {
    params.set('gemstone', activeFilters.gemstone.join(','));
  }
  if (activeFilters.metal.length > 0) {
    params.set('metal', activeFilters.metal.join(','));
  }
  if (activeFilters.occasion.length > 0) {
    params.set('occasion', activeFilters.occasion.join(','));
  }
  if (activeFilters.price.length > 0) {
    params.set('price', activeFilters.price.join(','));
  }
  if (activeFilters.availability.length > 0) {
    params.set('availability', activeFilters.availability.join(','));
  }
  if (activeFilters.certifiedOnly) {
    params.set('certified', '1');
  }
  if (activeFilters.untreatedOnly) {
    params.set('untreated', '1');
  }
  if (activeFilters.search) {
    params.set('search', activeFilters.search);
  }
  if (activeFilters.sort && activeFilters.sort !== 'featured') {
    params.set('sort', activeFilters.sort);
  }

  const newQuery = params.toString();
  const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}

function renderCatalogueError(err) {
  const grid = document.getElementById('collections-product-grid');
  const countEl = document.getElementById('collection-count');
  if (countEl) countEl.textContent = 'Atelier Notice';
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16) var(--space-4); background-color: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-xs);">
        <h3 style="font-size: 1.4rem; color: var(--color-text-primary); margin-bottom: var(--space-2);">Unable to Retrieve Catalogue</h3>
        <p style="font-size: 0.9rem; color: var(--color-text-secondary); max-width: 480px; margin: 0 auto var(--space-6); line-height: 1.6;">
          A momentary connection disruption prevented loading the collection. Please retry or contact our atelier concierge directly.
        </p>
        <div style="display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-gold" onclick="window.location.reload()">
            Retry Loading Catalogue
          </button>
          <a href="https://wa.me/919582841454" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
            Connect on WhatsApp
          </a>
        </div>
      </div>
    `;
  }
}

function readUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const gemstoneParam = params.get('gemstone');
  const metalParam = params.get('metal');
  const occasionParam = params.get('occasion');
  const priceParam = params.get('price');
  const availParam = params.get('availability');
  const certParam = params.get('certified');
  const untreatParam = params.get('untreated');
  const searchParam = params.get('search');
  const sortParam = params.get('sort');

  // Reset checkboxes first
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);

  if (categoryParam) {
    activeFilters.category = categoryParam;
    const catRadio = document.querySelector(`input[name="category-filter"][value="${categoryParam}"]`);
    if (catRadio) catRadio.checked = true;
  } else {
    activeFilters.category = 'all';
    const allCat = document.querySelector('input[name="category-filter"][value="all"]');
    if (allCat) allCat.checked = true;
  }

  if (gemstoneParam) {
    activeFilters.gemstone = gemstoneParam.split(',').map(s => s.trim()).filter(Boolean);
    activeFilters.gemstone.forEach(val => {
      const el = document.querySelector(`input[name="gem-filter"][value="${val}"]`);
      if (el) el.checked = true;
    });
  } else {
    activeFilters.gemstone = [];
  }

  if (metalParam) {
    activeFilters.metal = metalParam.split(',').map(s => s.trim()).filter(Boolean);
    activeFilters.metal.forEach(val => {
      const el = document.querySelector(`input[name="metal-filter"][value="${val}"]`);
      if (el) el.checked = true;
    });
  } else {
    activeFilters.metal = [];
  }

  if (occasionParam) {
    activeFilters.occasion = occasionParam.split(',').map(s => s.trim()).filter(Boolean);
    activeFilters.occasion.forEach(val => {
      const el = document.querySelector(`input[name="occasion-filter"][value="${val}"]`);
      if (el) el.checked = true;
    });
  } else {
    activeFilters.occasion = [];
  }

  if (priceParam) {
    activeFilters.price = priceParam.split(',').map(s => s.trim()).filter(Boolean);
    activeFilters.price.forEach(val => {
      const el = document.querySelector(`input[name="price-filter"][value="${val}"]`);
      if (el) el.checked = true;
    });
  } else {
    activeFilters.price = [];
  }

  if (availParam) {
    activeFilters.availability = availParam.split(',').map(s => s.trim()).filter(Boolean);
    activeFilters.availability.forEach(val => {
      const el = document.querySelector(`input[name="avail-filter"][value="${val}"]`);
      if (el) el.checked = true;
    });
  } else {
    activeFilters.availability = [];
  }

  activeFilters.certifiedOnly = (certParam === '1' || certParam === 'true');
  const certInput = document.getElementById('filter-certified-only');
  if (certInput) certInput.checked = activeFilters.certifiedOnly;

  activeFilters.untreatedOnly = (untreatParam === '1' || untreatParam === 'true');
  const untreatInput = document.getElementById('filter-untreated-only');
  if (untreatInput) untreatInput.checked = activeFilters.untreatedOnly;

  if (searchParam) {
    activeFilters.search = searchParam.trim().toLowerCase();
    const searchInput = document.getElementById('collection-search');
    if (searchInput) searchInput.value = searchParam;
  } else {
    activeFilters.search = '';
    const searchInput = document.getElementById('collection-search');
    if (searchInput) searchInput.value = '';
  }

  if (sortParam) {
    activeFilters.sort = sortParam;
    const sortSelect = document.getElementById('collection-sort');
    if (sortSelect) sortSelect.value = sortParam;
  } else {
    activeFilters.sort = 'featured';
    const sortSelect = document.getElementById('collection-sort');
    if (sortSelect) sortSelect.value = 'featured';
  }
}

function initSortListener() {
  const sortSelect = document.getElementById('collection-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      syncFiltersToUrl();
      renderProducts();
    });
  }
}

function initFilterListeners() {
  // Category Radio / Tabs
  const categoryInputs = document.querySelectorAll('input[name="category-filter"]');
  categoryInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      activeFilters.category = e.target.value;
      syncFiltersToUrl();
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
      syncFiltersToUrl();
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
      syncFiltersToUrl();
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
      syncFiltersToUrl();
      renderProducts();
    });
  });

  // Price Checkboxes
  const priceInputs = document.querySelectorAll('input[name="price-filter"]');
  priceInputs.forEach(input => {
    input.addEventListener('change', () => {
      activeFilters.price = Array.from(priceInputs)
        .filter(i => i.checked)
        .map(i => i.value);
      syncFiltersToUrl();
      renderProducts();
    });
  });

  // Availability Checkboxes
  const availInputs = document.querySelectorAll('input[name="avail-filter"]');
  availInputs.forEach(input => {
    input.addEventListener('change', () => {
      activeFilters.availability = Array.from(availInputs)
        .filter(i => i.checked)
        .map(i => i.value);
      syncFiltersToUrl();
      renderProducts();
    });
  });

  // Certified Only Toggle
  const certInput = document.getElementById('filter-certified-only');
  if (certInput) {
    certInput.addEventListener('change', (e) => {
      activeFilters.certifiedOnly = e.target.checked;
      syncFiltersToUrl();
      renderProducts();
    });
  }

  // Untreated Only Toggle
  const untreatInput = document.getElementById('filter-untreated-only');
  if (untreatInput) {
    untreatInput.addEventListener('change', (e) => {
      activeFilters.untreatedOnly = e.target.checked;
      syncFiltersToUrl();
      renderProducts();
    });
  }

  // Search Input
  const searchInput = document.getElementById('collection-search');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        activeFilters.search = e.target.value.trim().toLowerCase();
        syncFiltersToUrl();
        renderProducts();
      }, 250);
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
        price: [],
        availability: [],
        certifiedOnly: false,
        untreatedOnly: false,
        search: '',
        sort: 'featured'
      };
      document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
      const allCat = document.querySelector('input[name="category-filter"][value="all"]');
      if (allCat) allCat.checked = true;
      if (searchInput) searchInput.value = '';
      const sortSelect = document.getElementById('collection-sort');
      if (sortSelect) sortSelect.value = 'featured';
      syncFiltersToUrl();
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
  count += activeFilters.price.length;
  count += activeFilters.availability.length;
  if (activeFilters.certifiedOnly) count++;
  if (activeFilters.untreatedOnly) count++;
  if (activeFilters.search) count++;
  return count;
}

function filterProductList(products) {
  let list = products.filter(item => {
    // 1. Category
    if (activeFilters.category !== 'all' && item.primaryCategory !== activeFilters.category) {
      return false;
    }
    // 2. Gemstone
    if (activeFilters.gemstone.length > 0 && !activeFilters.gemstone.includes(item.gemstone)) {
      return false;
    }
    // 3. Metal
    if (activeFilters.metal.length > 0 && !activeFilters.metal.includes(item.metal)) {
      return false;
    }
    // 4. Occasion
    if (activeFilters.occasion.length > 0) {
      if (activeFilters.occasion.includes('daily') && !item.isDailyWear) return false;
      if (activeFilters.occasion.includes('occasion') && item.occasion !== 'occasion') return false;
      if (activeFilters.occasion.includes('gifting') && item.occasion !== 'gifting' && item.type !== 'gifts') return false;
    }
    // 5. Price Ranges
    if (activeFilters.price.length > 0) {
      const price = item.priceAmount;
      const matchesPrice = activeFilters.price.some(range => {
        if (range === 'under-50k') return price && price < 50000;
        if (range === '50k-150k') return price && price >= 50000 && price <= 150000;
        if (range === '150k-plus') return price && price > 150000;
        if (range === 'on-request') return !price;
        return false;
      });
      if (!matchesPrice) return false;
    }
    // 6. Availability
    if (activeFilters.availability.length > 0) {
      if (!activeFilters.availability.includes(item.availability)) {
        return false;
      }
    }
    // 7. Certification
    if (activeFilters.certifiedOnly && !item.badges?.certification) {
      return false;
    }
    // 8. Untreated / Unheated disclosure
    if (activeFilters.untreatedOnly) {
      const disclosure = (item.specs?.treatmentDisclosure || item.badges?.treatment || '').toLowerCase();
      if (!disclosure.includes('unheated') && !disclosure.includes('untreated') && !disclosure.includes('none')) {
        return false;
      }
    }
    // 9. Search
    if (activeFilters.search) {
      const matchString = `${item.title} ${item.poeticDescriptor} ${item.specs?.gemstoneType || ''} ${item.specs?.metalPurity || ''} ${item.metal || ''} ${item.primaryCategory || ''}`.toLowerCase();
      if (!matchString.includes(activeFilters.search)) {
        return false;
      }
    }
    return true;
  });

  // Apply sorting
  if (activeFilters.sort === 'title-asc') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (activeFilters.sort === 'price-asc') {
    list.sort((a, b) => (a.priceAmount || 9999999) - (b.priceAmount || 9999999));
  } else if (activeFilters.sort === 'price-desc') {
    list.sort((a, b) => (b.priceAmount || 0) - (a.priceAmount || 0));
  } else {
    // featured
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return list;
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
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16) 0; background-color: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-xs);">
        <h3 style="font-size: 1.4rem; color: var(--color-text-primary); margin-bottom: var(--space-2);">No pieces matched your selected filters</h3>
        <p style="font-size: 0.9rem; color: var(--color-text-secondary); max-width: 480px; margin: 0 auto var(--space-6); line-height: 1.6;">
          Every jewel at Gulshan Jewellers can also be custom-created around your specific gemstone preference, metal purity (22K, 18K, 925 Silver), or family heirloom reset.
        </p>
        <div style="display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-gold" id="clear-empty-filters-btn">
            Clear All Filters
          </button>
          <button type="button" class="btn btn-outline" data-trigger-consultation>
            Request a Custom Design Consultation
          </button>
        </div>
      </div>
    `;

    document.getElementById('clear-empty-filters-btn')?.addEventListener('click', () => {
      document.getElementById('reset-filters-btn')?.click();
    });
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const priceFormatted = item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay;
    const normalizedImg = normalizeAssetPath(item.image);

    const leftBadges = [
      item.badges?.natural ? `<span class="badge badge-natural">Natural</span>` : '',
      item.badges?.treatment ? `<span class="badge badge-cert">${item.badges.treatment}</span>` : '',
      item.badges?.certification ? `<span class="badge badge-cert">${item.badges.certification}</span>` : ''
    ].filter(Boolean).join('');

    const rightBadges = [
      item.badges?.hallmark ? `<span class="badge badge-hallmark">${item.badges.hallmark}</span>` : ''
    ].filter(Boolean).join('');

    return `
      <article class="product-card" id="card-${item.id}">
        <div class="product-card-media">
          <a href="products/${item.id}.html" aria-label="View ${item.title}">
            <img src="${normalizedImg}" alt="${item.title}" loading="lazy" width="400" height="400">
          </a>

          <!-- Floating Badges -->
          ${leftBadges ? `<div class="product-badges-top-left">${leftBadges}</div>` : ''}
          ${rightBadges ? `<div class="product-badges-top-right">${rightBadges}</div>` : ''}

          <!-- Action Overlay Bar -->
          <div class="product-card-actions-overlay">
            <a href="products/${item.id}.html" class="card-action-icon-btn" aria-label="View piece details" title="View Details">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </a>
            <button type="button" class="card-action-icon-btn quick-tray-btn" data-id="${item.id}" aria-label="Save to Curated Tray" title="Save to Tray">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="6 3 18 3 22 9 12 22 2 9"></polygon>
                <line x1="2" y1="9" x2="22" y2="9"></line>
                <line x1="12" y1="22" x2="6" y2="9"></line>
                <line x1="12" y1="22" x2="18" y2="9"></line>
                <line x1="6" y1="3" x2="12" y2="9"></line>
                <line x1="18" y1="3" x2="12" y2="9"></line>
              </svg>
            </button>
            ${item.commerceMode === 'direct' ? `
            <button type="button" class="card-action-icon-btn quick-cart-btn" data-id="${item.id}" data-title="${item.title}" data-price="${item.priceAmount || 0}" data-image="${item.image}" aria-label="Add to Bag" title="Add to Bag">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </button>` : `
            <button type="button" class="card-action-enquire-btn quick-enquire-btn" data-product-id="${item.id}" aria-label="Enquire about ${item.title}">
              Enquire
            </button>`}
          </div>
        </div>

        <div class="product-card-content">
          <h3 class="product-card-title">
            <a href="products/${item.id}.html">${item.title}</a>
          </h3>
          <p class="product-card-desc">${item.poeticDescriptor}</p>
          <div class="product-card-footer">
            <span class="product-price">${priceFormatted}</span>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              ${item.commerceMode === 'direct' ? `
              <button type="button" class="btn btn-gold btn-sm quick-add-bag-inline" data-id="${item.id}" data-title="${item.title}" data-price="${item.priceAmount || 0}" data-image="${item.image}" style="padding: 4px 10px; font-size: 0.72rem;">
                Add to Bag
              </button>` : `
              <a href="products/${item.id}.html" class="product-card-view-btn">
                <span>View Piece</span>
                <span>&rarr;</span>
              </a>`}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Bind Quick Enquire
  grid.querySelectorAll('.quick-enquire-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-product-id');
      const prod = allProducts.find(p => p.id === id);
      if (prod) openEnquiryModal(prod);
    });
  });

  // Bind Quick Add to Tray
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

  // Bind Quick Add to Bag (both overlay icon and inline button)
  grid.querySelectorAll('.quick-cart-btn, .quick-add-bag-inline').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const price = parseFloat(btn.getAttribute('data-price')) || 0;
      const image = btn.getAttribute('data-image');
      cart.addItem({ id, title, price, image });
      openCartDrawer();
    });
  });
}
