/**
 * Admin & Management Portal Manager
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProducts } from './data.js';
import { store } from './state/store.js';
import { showToast } from './components/toast.js';

let products = [];
let enquiries = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  products = await fetchProducts();
  loadEnquiries();
  loadSettings();

  initTabs();
  renderCatalogue();
  renderEnquiries();
  initCatalogueListeners();
  initEnquiryListeners();
  initSettingsListeners();
});

/* --------------------------------------------------------------------------
   Tab Navigation
   -------------------------------------------------------------------------- */
function initTabs() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const contents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

/* --------------------------------------------------------------------------
   TAB 1: Catalogue & Inventory Management
   -------------------------------------------------------------------------- */
function renderCatalogue(filterText = '') {
  renderStats();
  renderProductTable(filterText);
}

function renderStats() {
  const totalCount = products.length;
  const certifiedCount = products.filter(p => p.badges?.certification).length;
  const naturalCount = products.filter(p => p.badges?.natural).length;
  const untreatedCount = products.filter(p => 
    p.specs?.treatmentDisclosure?.toLowerCase().includes('untreated') || 
    p.specs?.treatmentDisclosure?.toLowerCase().includes('unheated')
  ).length;

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
           (p.specs?.metalPurity && p.specs.metalPurity.toLowerCase().includes(f)) ||
           (p.specs?.origin && p.specs.origin.toLowerCase().includes(f));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--color-text-muted);">No matching pieces found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr>
      <td><img src="${item.image}" alt="${item.title}" class="admin-table-thumb"></td>
      <td>
        <strong>${item.title}</strong>
        <div style="font-size: 0.7rem; color: var(--color-text-muted);">ID: ${item.id}</div>
      </td>
      <td><span style="text-transform: capitalize;">${item.primaryCategory}</span></td>
      <td>
        <strong>${item.priceDisplay}</strong>
        ${item.priceAmount ? `<div style="font-size: 0.7rem; color: var(--color-gold-champagne);">₹${item.priceAmount.toLocaleString('en-IN')}</div>` : ''}
      </td>
      <td>
        ${item.badges?.natural ? '<span style="color: #2ECC71;">Natural</span>' : '<span style="color: var(--color-text-muted);">Standard</span>'}
        · ${item.specs?.treatmentDisclosure || item.badges?.treatment || 'Disclosed'}
      </td>
      <td>
        <div>${item.specs?.origin || 'Verified'}</div>
        <div style="font-size: 0.7rem; color: var(--color-gold-champagne);">${item.badges?.certification ? '&#10003; ' + item.badges.certification : 'On Request'}</div>
      </td>
      <td style="text-align: right;">
        <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <button type="button" class="btn btn-outline btn-sm admin-edit-btn" data-id="${item.id}">Edit</button>
          <a href="product.html?id=${item.id}" target="_blank" class="btn btn-gold btn-sm">Preview</a>
          <button type="button" class="btn btn-outline btn-sm admin-delete-btn" data-id="${item.id}" style="color: #E74C3C; border-color: rgba(231,76,60,0.3);">&times;</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Bind Edit
  tbody.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditModal(btn.getAttribute('data-id'));
    });
  });

  // Bind Delete
  tbody.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm(`Remove "${id}" from the active catalogue?`)) {
        deleteProduct(id);
      }
    });
  });
}

function initCatalogueListeners() {
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderProductTable(e.target.value.trim());
    });
  }

  // Add Product Button
  document.getElementById('admin-add-product-btn')?.addEventListener('click', () => {
    openAddModal();
  });

  // Export JSON
  document.getElementById('admin-export-json-btn')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `gulshan-jewellers-catalogue-${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
    showToast('Catalogue JSON exported successfully.');
  });

  // Reset to Defaults
  document.getElementById('admin-reset-btn')?.addEventListener('click', () => {
    if (confirm('Reset entire catalogue and settings to official factory defaults?')) {
      store.resetCatalogue();
      localStorage.removeItem('gj_enquiries');
      localStorage.removeItem('gj_store_settings');
      location.reload();
    }
  });

  // Modal Close buttons
  const modal = document.getElementById('admin-edit-modal-backdrop');
  document.getElementById('admin-close-edit-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('admin-cancel-edit-btn')?.addEventListener('click', closeEditModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
  });

  // Form Submit
  document.getElementById('admin-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProductForm();
  });
}

function openAddModal() {
  editingProductId = null;
  document.getElementById('admin-modal-title').textContent = 'Add New Fine Piece';
  document.getElementById('admin-edit-form').reset();
  document.getElementById('edit-product-id').value = '';
  document.getElementById('edit-category').value = 'gemstones';
  document.getElementById('edit-gemstone').value = 'pukhraj';

  document.getElementById('admin-edit-modal-backdrop').classList.add('active');
}

function openEditModal(productId) {
  const p = products.find(it => it.id === productId);
  if (!p) return;

  editingProductId = productId;
  document.getElementById('admin-modal-title').textContent = `Edit Piece: ${p.title}`;

  document.getElementById('edit-product-id').value = p.id;
  document.getElementById('edit-title').value = p.title;
  document.getElementById('edit-category').value = p.primaryCategory || 'gemstones';
  document.getElementById('edit-gemstone').value = p.gemstone || 'none';
  document.getElementById('edit-price-amount').value = p.priceAmount || '';
  document.getElementById('edit-price-display').value = p.priceDisplay || '';
  document.getElementById('edit-carat').value = p.specs?.caratWeight || '';
  document.getElementById('edit-metal').value = p.specs?.metalPurity || '';
  document.getElementById('edit-origin').value = p.specs?.origin || '';
  document.getElementById('edit-certificate').value = p.badges?.certification || '';
  document.getElementById('edit-treatment').value = p.specs?.treatmentDisclosure || '';
  document.getElementById('edit-image').value = p.image || '';
  document.getElementById('edit-poetic').value = p.poeticDescriptor || '';
  document.getElementById('edit-narrative').value = p.narrative || '';

  document.getElementById('admin-edit-modal-backdrop').classList.add('active');
}

function closeEditModal() {
  document.getElementById('admin-edit-modal-backdrop').classList.remove('active');
}

function saveProductForm() {
  const title = document.getElementById('edit-title').value.trim();
  const category = document.getElementById('edit-category').value;
  const gemstone = document.getElementById('edit-gemstone').value;
  const priceAmount = parseFloat(document.getElementById('edit-price-amount').value) || null;
  const priceDisplay = document.getElementById('edit-price-display').value.trim() || (priceAmount ? `₹${priceAmount.toLocaleString('en-IN')}` : 'Price on Request');
  const carat = document.getElementById('edit-carat').value.trim();
  const metal = document.getElementById('edit-metal').value.trim();
  const origin = document.getElementById('edit-origin').value.trim();
  const cert = document.getElementById('edit-certificate').value.trim();
  const treatment = document.getElementById('edit-treatment').value.trim();
  const image = document.getElementById('edit-image').value.trim() || '/images/pukhraj-hero.jpg';
  const poetic = document.getElementById('edit-poetic').value.trim();
  const narrative = document.getElementById('edit-narrative').value.trim();

  if (editingProductId) {
    // Update existing
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        title,
        primaryCategory: category,
        gemstone,
        priceAmount,
        priceDisplay,
        image,
        poeticDescriptor: poetic,
        narrative,
        specs: {
          ...products[idx].specs,
          caratWeight: carat,
          metalPurity: metal,
          origin,
          treatmentDisclosure: treatment,
          certificate: cert
        },
        badges: {
          ...products[idx].badges,
          certification: cert
        }
      };
      showToast(`Updated "${title}".`);
    }
  } else {
    // Insert new
    const newId = 'gj-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random()*1000);
    const newPiece = {
      id: newId,
      title,
      primaryCategory: category,
      gemstone,
      priceAmount,
      priceDisplay,
      image,
      secondaryImage: '/images/bespoke-workshop.jpg',
      poeticDescriptor: poetic || 'Artisan handcrafted fine piece',
      narrative: narrative || 'Handcrafted in 22K gold by master artisans.',
      specs: {
        gemstoneType: gemstone !== 'none' ? gemstone.toUpperCase() : 'Gold Solitaire',
        naturalStatus: 'Earth-Mined 100% Natural',
        caratWeight: carat || 'Custom Spec',
        origin: origin || 'Verified Origin',
        treatmentDisclosure: treatment || 'Natural Unheated',
        certificate: cert || 'Independent Lab Report',
        metalPurity: metal || '22K (916) BIS Hallmarked Gold'
      },
      badges: {
        natural: 'Natural',
        certification: cert || 'Certified',
        hallmark: 'BIS Hallmarked'
      }
    };
    products.unshift(newPiece);
    showToast(`Added new piece "${title}".`);
  }

  // Persist
  localStorage.setItem('gj_cms_products', JSON.stringify(products));
  store.notify('cmsProducts', products);

  closeEditModal();
  renderCatalogue();
}

function deleteProduct(productId) {
  products = products.filter(p => p.id !== productId);
  localStorage.setItem('gj_cms_products', JSON.stringify(products));
  store.notify('cmsProducts', products);
  showToast(`Piece "${productId}" deleted.`);
  renderCatalogue();
}

/* --------------------------------------------------------------------------
   TAB 2: Client Consultations & Leads CRM
   -------------------------------------------------------------------------- */
function loadEnquiries() {
  const stored = localStorage.getItem('gj_enquiries');
  if (stored) {
    try {
      enquiries = JSON.parse(stored);
    } catch {
      enquiries = [];
    }
  }

  if (!enquiries || enquiries.length === 0) {
    enquiries = [
      {
        id: 'ENQ-8901',
        date: '2026-09-17 17:40',
        name: 'Rajesh K. Sharma',
        contact: '+91 98112 34567',
        piece: 'Ceylon Yellow Sapphire (Pukhraj) Signet Ring',
        message: 'Looking for 4.5+ ct unheated yellow sapphire for Jupiter astrological placement. Need IIGJ certificate verification.',
        status: 'New'
      },
      {
        id: 'ENQ-8902',
        date: '2026-09-16 14:15',
        name: 'Dr. Priya V. Nambiar',
        contact: '+91 98201 88990',
        piece: 'Bespoke Colombian Emerald Halo Pendant',
        message: 'Interested in commission in 18K yellow gold with natural baguette diamonds. Budget around ₹3,00,000.',
        status: 'In Discussion'
      },
      {
        id: 'ENQ-8903',
        date: '2026-09-15 11:20',
        name: 'Vikram & Ananya Mehta',
        contact: '+971 50 123 4567',
        piece: '14K Everyday Natural Diamond Huggie Hoops',
        message: 'Inquiring about delivery timelines to Dubai (UAE) and hallmarking documentation.',
        status: 'Closed'
      }
    ];
    localStorage.setItem('gj_enquiries', JSON.stringify(enquiries));
  }
}

function renderEnquiries() {
  const tbody = document.getElementById('admin-enquiries-tbody');
  const badge = document.getElementById('admin-enquiry-badge');
  if (badge) badge.textContent = enquiries.length;
  if (!tbody) return;

  if (enquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--color-text-muted);">No client consultations recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = enquiries.map((enq, idx) => {
    let statusClass = 'status-new';
    if (enq.status === 'In Discussion') statusClass = 'status-discussion';
    if (enq.status === 'Closed') statusClass = 'status-closed';

    const cleanPhone = (enq.contact || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hello ${enq.name}, thank you for reaching out to Gulshan Jewellers regarding "${enq.piece}". How may our senior gemmologist assist you today?`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/919876543210?text=${waText}`;

    return `
      <tr>
        <td style="white-space: nowrap; color: var(--color-text-muted);">${enq.date}</td>
        <td><strong>${enq.name}</strong></td>
        <td>
          <a href="tel:${enq.contact}" style="color: var(--color-ivory);">${enq.contact}</a>
        </td>
        <td><span style="color: var(--color-gold-champagne);">${enq.piece}</span></td>
        <td style="max-width: 320px; font-size: 0.75rem; color: var(--color-text-secondary);">${enq.message}</td>
        <td>
          <select class="form-control enq-status-select" data-index="${idx}" style="font-size: 0.7rem; padding: 3px 6px;">
            <option value="New" ${enq.status === 'New' ? 'selected' : ''}>New</option>
            <option value="In Discussion" ${enq.status === 'In Discussion' ? 'selected' : ''}>In Discussion</option>
            <option value="Closed" ${enq.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td style="text-align: right;">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
            Reply WA &rarr;
          </a>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.enq-status-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      enquiries[idx].status = e.target.value;
      localStorage.setItem('gj_enquiries', JSON.stringify(enquiries));
      showToast(`Inquiry status updated to ${e.target.value}.`);
    });
  });
}

function initEnquiryListeners() {
  document.getElementById('admin-seed-enquiry-btn')?.addEventListener('click', () => {
    const names = ['Siddharth Singhania', 'Meera Kapoor', 'Karan Oberoi', 'Ritu Aggarwal'];
    const pieces = ['Royal Blue Sapphire (Neelam) Cushion', 'Zambian Emerald 22K Kada', 'Bespoke Solitaire Ring'];
    const randName = names[Math.floor(Math.random() * names.length)];
    const randPiece = pieces[Math.floor(Math.random() * pieces.length)];

    enquiries.unshift({
      id: 'ENQ-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      name: randName,
      contact: '+91 99887 ' + Math.floor(10000 + Math.random() * 90000),
      piece: randPiece,
      message: 'Requesting private video consultation for gemstone verification and setting design.',
      status: 'New'
    });

    localStorage.setItem('gj_enquiries', JSON.stringify(enquiries));
    renderEnquiries();
    showToast('New client consultation lead recorded.');
  });
}

/* --------------------------------------------------------------------------
   TAB 3: Boutique Settings & Live Rates
   -------------------------------------------------------------------------- */
function loadSettings() {
  const saved = localStorage.getItem('gj_store_settings');
  if (!saved) return;

  try {
    const s = JSON.parse(saved);
    if (s.phone) document.getElementById('setting-phone').value = s.phone;
    if (s.whatsapp) document.getElementById('setting-whatsapp').value = s.whatsapp;
    if (s.email) document.getElementById('setting-email').value = s.email;
    if (s.hours) document.getElementById('setting-hours').value = s.hours;
    if (s.gold24k) document.getElementById('rate-gold-24k').value = s.gold24k;
    if (s.gold22k) document.getElementById('rate-gold-22k').value = s.gold22k;
    if (s.gold18k) document.getElementById('rate-gold-18k').value = s.gold18k;
    if (s.silver925) document.getElementById('rate-silver-925').value = s.silver925;
  } catch (err) {
    console.error('Failed to parse saved settings', err);
  }
}

function initSettingsListeners() {
  const form = document.getElementById('admin-settings-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      phone: document.getElementById('setting-phone').value.trim(),
      whatsapp: document.getElementById('setting-whatsapp').value.trim(),
      email: document.getElementById('setting-email').value.trim(),
      hours: document.getElementById('setting-hours').value.trim(),
      gold24k: document.getElementById('rate-gold-24k').value.trim(),
      gold22k: document.getElementById('rate-gold-22k').value.trim(),
      gold18k: document.getElementById('rate-gold-18k').value.trim(),
      silver925: document.getElementById('rate-silver-925').value.trim()
    };

    localStorage.setItem('gj_store_settings', JSON.stringify(settings));
    showToast('Boutique settings & daily metal rates updated successfully.');
  });
}
