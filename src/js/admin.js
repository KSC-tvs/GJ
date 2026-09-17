/**
 * Staff Portal & Catalogue CMS Manager
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProducts } from './data.js';
import { store } from './state/store.js';
import { showToast } from './components/toast.js';

let products = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  products = await fetchProducts();
  renderStats();
  renderProductTable();
  initAdminListeners();
});

function renderStats() {
  const totalCount = products.length;
  const certifiedCount = products.filter(p => p.badges?.certification).length;
  const naturalCount = products.filter(p => p.badges?.natural).length;
  const untreatedCount = products.filter(p => p.specs?.treatmentDisclosure?.toLowerCase().includes('untreated') || p.specs?.treatmentDisclosure?.toLowerCase().includes('unheated')).length;

  document.getElementById('admin-stat-total').textContent = totalCount;
  document.getElementById('admin-stat-certified').textContent = certifiedCount;
  document.getElementById('admin-stat-natural').textContent = naturalCount;
  document.getElementById('admin-stat-untreated').textContent = untreatedCount;
}

function renderProductTable(filterText = '') {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const f = filterText.toLowerCase();
  const filtered = products.filter(p => {
    return p.title.toLowerCase().includes(f) ||
           p.primaryCategory.toLowerCase().includes(f) ||
           (p.specs?.gemstoneType && p.specs.gemstoneType.toLowerCase().includes(f)) ||
           (p.specs?.metalPurity && p.specs.metalPurity.toLowerCase().includes(f));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No matching pieces found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr>
      <td><img src="${item.image}" alt="${item.title}" class="admin-table-thumb"></td>
      <td>
        <strong>${item.title}</strong>
        <div style="font-size: 0.7rem; color: var(--color-text-muted);">${item.id}</div>
      </td>
      <td><span style="text-transform: capitalize;">${item.primaryCategory}</span></td>
      <td>
        ${item.priceDisplay}
        ${item.priceAmount ? `<div style="font-size: 0.7rem; color: var(--color-gold-champagne);">₹${item.priceAmount.toLocaleString('en-IN')}</div>` : ''}
      </td>
      <td>
        ${item.badges?.natural ? '<span style="color: #2ECC71;">Natural</span>' : '<span style="color: var(--color-text-muted);">Standard</span>'}
        · ${item.badges?.treatment || 'Disclosed'}
      </td>
      <td>${item.badges?.certification ? '&#10003; Certified' : 'On Request'}</td>
      <td>
        <div style="display: flex; gap: var(--space-2);">
          <button type="button" class="btn btn-outline btn-sm admin-edit-btn" data-id="${item.id}">Edit</button>
          <a href="product.html?id=${item.id}" target="_blank" class="btn btn-gold btn-sm">Preview</a>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });
}

function initAdminListeners() {
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderProductTable(e.target.value.trim());
    });
  }

  // Export JSON
  document.getElementById('admin-export-json-btn')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `gulshan-jewellers-catalogue-${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
    showToast('Catalogue JSON exported successfully.');
  });

  // Reset to Factory Defaults
  document.getElementById('admin-reset-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all products to atelier default catalog?')) {
      store.resetCmsProducts();
      window.location.reload();
    }
  });

  // Edit Modal Form Submit
  const editForm = document.getElementById('admin-edit-form');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveEditedProduct();
    });
  }

  // Close Edit Modal
  document.getElementById('admin-close-edit-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('admin-edit-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'admin-edit-modal-backdrop') closeEditModal();
  });
}

function openEditModal(productId) {
  editingProductId = productId;
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('edit-product-id').value = prod.id;
  document.getElementById('edit-title').value = prod.title || '';
  document.getElementById('edit-poetic').value = prod.poeticDescriptor || '';
  document.getElementById('edit-price-display').value = prod.priceDisplay || 'Price on Request';
  document.getElementById('edit-price-amount').value = prod.priceAmount || '';
  document.getElementById('edit-treatment').value = prod.specs?.treatmentDisclosure || '';
  document.getElementById('edit-origin').value = prod.specs?.origin || '';
  document.getElementById('edit-certificate').value = prod.specs?.certificate || '';
  document.getElementById('edit-metal').value = prod.specs?.metalPurity || '';
  document.getElementById('edit-badge-natural').checked = !!prod.badges?.natural;
  document.getElementById('edit-badge-cert').value = prod.badges?.certification || '';

  const backdrop = document.getElementById('admin-edit-modal-backdrop');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  const backdrop = document.getElementById('admin-edit-modal-backdrop');
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

function saveEditedProduct() {
  const index = products.findIndex(p => p.id === editingProductId);
  if (index === -1) return;

  const target = { ...products[index] };

  target.title = document.getElementById('edit-title').value;
  target.poeticDescriptor = document.getElementById('edit-poetic').value;
  target.priceDisplay = document.getElementById('edit-price-display').value;
  const amt = document.getElementById('edit-price-amount').value;
  target.priceAmount = amt ? parseInt(amt, 10) : null;

  target.badges = {
    ...target.badges,
    natural: document.getElementById('edit-badge-natural').checked,
    certification: document.getElementById('edit-badge-cert').value
  };

  target.specs = {
    ...target.specs,
    treatmentDisclosure: document.getElementById('edit-treatment').value,
    origin: document.getElementById('edit-origin').value,
    certificate: document.getElementById('edit-certificate').value,
    metalPurity: document.getElementById('edit-metal').value
  };

  products[index] = target;
  store.saveCmsProducts(products);

  showToast(`Updated "${target.title}" successfully.`);
  closeEditModal();
  renderStats();
  renderProductTable();
}
