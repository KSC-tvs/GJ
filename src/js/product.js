/**
 * Product Detail Page (PDP) Dynamic Logic
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProductById, fetchProducts } from './data.js';
import { store } from './state/store.js';
import { formatPrice } from './state/currency.js';
import { openEnquiryModal } from './main.js';
import { openRingSizeModal } from './components/ringSizeModal.js';
import { showToast } from './components/toast.js';
import { Tracking } from './tracking.js';

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id') || 'pukhraj-cushion-signet-22k';

  currentProduct = await fetchProductById(productId);
  if (!currentProduct) return;

  Tracking.trackProductView(currentProduct.id, currentProduct.title);
  renderProductDetails(currentProduct);
  initMacroZoom();
  initAccordions();
  renderRelatedProducts(currentProduct);
  initCertificateSimulator();

  store.subscribe('currency', () => {
    if (currentProduct) renderPrice(currentProduct);
  });
});

function renderPrice(product) {
  const priceEl = document.getElementById('pdp-price');
  if (!priceEl) return;
  const currentCurrency = store.getCurrency();
  priceEl.textContent = product.priceAmount ? formatPrice(product.priceAmount, currentCurrency) : product.priceDisplay;
}

function renderProductDetails(product) {
  document.title = `${product.title} | Gulshan Jewellers · Est. 1950`;

  // Breadcrumbs
  const crumbCategory = document.getElementById('pdp-crumb-category');
  if (crumbCategory) {
    crumbCategory.textContent = formatCategoryName(product.primaryCategory);
    crumbCategory.href = `collections.html?category=${product.primaryCategory}`;
  }
  const crumbTitle = document.getElementById('pdp-crumb-title');
  if (crumbTitle) crumbTitle.textContent = product.title;

  // Title, Poetic Descriptor, Price
  const titleEl = document.getElementById('pdp-title');
  if (titleEl) titleEl.textContent = product.title;

  const poeticEl = document.getElementById('pdp-poetic');
  if (poeticEl) poeticEl.textContent = product.poeticDescriptor;

  renderPrice(product);

  // Badges
  const badgesContainer = document.getElementById('pdp-badges');
  if (badgesContainer) {
    badgesContainer.innerHTML = `
      ${product.badges?.natural ? `<span class="badge badge-natural">Natural Earth-Mined</span>` : ''}
      ${product.badges?.treatment ? `<span class="badge badge-cert">${product.badges.treatment}</span>` : ''}
      ${product.badges?.certification ? `<span class="badge badge-cert">${product.badges.certification}</span>` : ''}
      ${product.badges?.hallmark ? `<span class="badge badge-hallmark">${product.badges.hallmark}</span>` : ''}
    `;
  }

  // Imagery
  const mainImg = document.getElementById('pdp-main-img');
  if (mainImg) {
    mainImg.src = product.image;
    mainImg.alt = product.title;
  }

  const thumbsRow = document.getElementById('pdp-thumbs-row');
  if (thumbsRow) {
    const images = [product.image, product.secondaryImage || '/images/bespoke-workshop.jpg'];
    thumbsRow.innerHTML = images.map((src, i) => `
      <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-src="${src}">
        <img src="${src}" alt="Thumbnail ${i + 1}">
      </div>
    `).join('');

    thumbsRow.querySelectorAll('.pdp-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbsRow.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImg.src = thumb.getAttribute('data-src');
      });
    });
  }

  // CTAs
  const primaryCta = document.getElementById('pdp-primary-enquire-btn');
  if (primaryCta) {
    primaryCta.addEventListener('click', () => {
      openEnquiryModal(product);
    });
  }

  const trayCta = document.getElementById('pdp-add-tray-btn');
  if (trayCta) {
    trayCta.addEventListener('click', () => {
      const res = store.addToTray(product);
      showToast(res.message, res.success ? 'success' : 'info');
    });
  }

  const consultationCta = document.getElementById('pdp-consultation-btn');
  if (consultationCta) {
    consultationCta.addEventListener('click', () => {
      openEnquiryModal(product);
    });
  }

  const whatsappCta = document.getElementById('pdp-whatsapp-btn');
  if (whatsappCta) {
    whatsappCta.addEventListener('click', () => {
      const msg = encodeURIComponent(`Hello Gulshan Jewellers, I am interested in inquiring about "${product.title}" (${product.priceDisplay}). Could you share certification details and bespoke options?`);
      window.open(`https://wa.me/919582841454?text=${msg}`, '_blank');
    });
  }

  // Ring Size Guide trigger
  const sizeGuideBtn = document.getElementById('pdp-size-guide-btn');
  if (sizeGuideBtn) {
    if (product.type === 'ring') {
      sizeGuideBtn.style.display = 'inline-flex';
      sizeGuideBtn.addEventListener('click', openRingSizeModal);
    } else {
      sizeGuideBtn.style.display = 'none';
    }
  }

  // Narrative
  const narrativeEl = document.getElementById('pdp-narrative');
  if (narrativeEl) narrativeEl.textContent = product.narrative;

  // Transparency Note
  const transNoteEl = document.getElementById('pdp-transparency-note');
  if (transNoteEl) transNoteEl.textContent = product.transparencyNote;

  // Astrological Note
  const astroContainer = document.getElementById('pdp-astro-container');
  const astroNoteEl = document.getElementById('pdp-astro-note');
  if (product.astrologicalNote && astroContainer && astroNoteEl) {
    astroContainer.style.display = 'block';
    astroNoteEl.textContent = product.astrologicalNote;
  }

  // Specifications Table
  populateSpecs(product.specs);

  // SEO JSON-LD Schema
  injectProductSchema(product);
}

function populateSpecs(specs = {}) {
  const table = document.getElementById('pdp-specs-table');
  if (!table) return;

  const specRows = [
    { label: 'Gemstone Type', value: specs.gemstoneType },
    { label: 'Natural / Lab-Grown', value: specs.naturalStatus },
    { label: 'Carat Weight', value: specs.caratWeight },
    { label: 'Treatment Disclosure', value: specs.treatmentDisclosure },
    { label: 'Verified Origin', value: specs.origin },
    { label: 'Lab Certification', value: specs.certificate },
    { label: 'Metal & Purity', value: specs.metalPurity },
    { label: 'Natural Diamond Details', value: specs.diamondDetails },
    { label: 'Size / Dimension', value: specs.sizeLength },
    { label: 'Customisation Options', value: specs.customisation }
  ];

  table.innerHTML = specRows
    .filter(row => row.value)
    .map(row => `
      <tr>
        <th>${row.label}</th>
        <td>${row.value}</td>
      </tr>
    `).join('');
}

function initMacroZoom() {
  const wrap = document.querySelector('.pdp-main-image-wrap');
  const img = document.getElementById('pdp-main-img');
  if (!wrap || !img) return;

  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(1.8)';
  });

  wrap.addEventListener('mouseleave', () => {
    img.style.transform = 'scale(1)';
  });
}

function initAccordions() {
  const items = document.querySelectorAll('.accordion-item');
  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        item.classList.toggle('open', !isOpen);
      });
    }
  });
}

function initCertificateSimulator() {
  const certBtn = document.getElementById('pdp-view-cert-sample-btn');
  if (!certBtn) return;

  certBtn.addEventListener('click', () => {
    alert(`
GULSHAN JEWELLERS · GEMOLOGICAL CERTIFICATION STANDARDS
-----------------------------------------------------------
Testing Laboratory: Independent Accredited Gemological Authority (IIGJ / Equivalent)
Species: Natural Earth-Mined Corundum / Beryl
Identification: Verified Natural Mineral
Refractive Index: Natural Corundum 1.762 - 1.770
Specific Gravity: 4.00
Microscopic Examination: Rutile Silk / Fingerprint Inclusions present
Thermal Treatment: None Detected / Completely Unheated
Origin: Ceylon (Sri Lanka) when verified

Every natural gemstone is accompanied by an independent laboratory report.
    `.trim());
  });
}

async function renderRelatedProducts(product) {
  const grid = document.getElementById('pdp-related-grid');
  if (!grid) return;

  const allProducts = await fetchProducts();
  const currentCurrency = store.getCurrency();
  const related = allProducts
    .filter(p => p.id !== product.id && (p.primaryCategory === product.primaryCategory || p.gemstone === product.gemstone))
    .slice(0, 4);

  grid.innerHTML = related.map(item => `
    <article class="product-card">
      <div class="product-card-media">
        <a href="product.html?id=${item.id}">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </a>
      </div>
      <div class="product-card-content">
        <h4 class="product-card-title">
          <a href="product.html?id=${item.id}">${item.title}</a>
        </h4>
        <div class="product-card-footer">
          <span class="product-price">
            ${item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay}
          </span>
          <a href="product.html?id=${item.id}" class="btn btn-outline btn-sm">View Piece</a>
        </div>
      </div>
    </article>
  `).join('');
}

function formatCategoryName(cat) {
  const map = {
    gemstones: 'Natural Gemstones',
    diamonds: 'Fine Diamonds',
    gold: 'Fine Gold',
    silver: 'Sterling Silver'
  };
  return map[cat] || 'Fine Jewellery';
}

function injectProductSchema(product) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.title,
    'image': [window.location.origin + product.image],
    'description': product.poeticDescriptor,
    'brand': {
      '@type': 'Brand',
      'name': 'Gulshan Jewellers | Est. 1950'
    },
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'INR',
      'availability': 'https://schema.org/InStock',
      'price': product.priceAmount || '0',
      'priceValidUntil': '2027-12-31'
    }
  });
  document.head.appendChild(script);
}
