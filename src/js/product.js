/**
 * Product Detail Page (PDP) Dynamic Logic
 * Gulshan Jewellers | Est. 1950
 */

import { fetchProductById, fetchProducts, normalizeAssetPath } from './data.js';
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

  if (!currentProduct) {
    renderNotFoundState(productId);
    return;
  }

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

function renderNotFoundState(requestedId) {
  const main = document.querySelector('main.container');
  if (!main) return;

  document.title = `Piece Not Found | Gulshan Jewellers · Est. 1950`;

  main.innerHTML = `
    <div style="text-align: center; padding: var(--space-20) var(--space-4); max-width: 640px; margin: 0 auto;">
      <span class="section-eyebrow">Atelier Archival Notice</span>
      <h1 style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--color-text-primary); margin: var(--space-4) 0 var(--space-3);">
        Piece Not Found in Current Curation
      </h1>
      <p style="font-size: 1rem; color: var(--color-text-secondary); line-height: 1.7; margin-bottom: var(--space-8);">
        The reference piece requested ("${requestedId || 'unknown'}") may have been acquired by a private collector, archived, or is available exclusively upon custom atelier commission.
      </p>
      <div style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap;">
        <a href="collections.html" class="btn btn-gold btn-lg">Explore Available Collections</a>
        <a href="bespoke.html" class="btn btn-outline btn-lg">Commission Bespoke Creation</a>
        <button type="button" class="btn btn-outline btn-lg" onclick="window.history.back()">Go Back</button>
      </div>
    </div>
  `;
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
  const normalizedMain = normalizeAssetPath(product.image);
  if (mainImg) {
    mainImg.src = normalizedMain;
    mainImg.alt = product.title;
  }

  const thumbsRow = document.getElementById('pdp-thumbs-row');
  if (thumbsRow) {
    const secImage = normalizeAssetPath(product.secondaryImage) || 'images/bespoke-workshop.jpg';
    const images = [normalizedMain, secImage];
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
    primaryCta.onclick = () => openEnquiryModal(product);
  }

  const trayCta = document.getElementById('pdp-add-tray-btn');
  if (trayCta) {
    trayCta.onclick = () => {
      const res = store.addToTray(product);
      showToast(res.message, res.success ? 'success' : 'info');
    };
  }

  const consultationCta = document.getElementById('pdp-consultation-btn');
  if (consultationCta) {
    consultationCta.onclick = () => openEnquiryModal(product);
  }

  const whatsappCta = document.getElementById('pdp-whatsapp-btn');
  if (whatsappCta) {
    whatsappCta.onclick = () => {
      const msg = encodeURIComponent(`Hello Gulshan Jewellers, I am enquiring about "${product.title}" (${product.priceDisplay}). Could you share certificate details and availability?`);
      window.open(`https://wa.me/919582841454?text=${msg}`, '_blank');
    };
  }

  // Ring Size Guide trigger
  const sizeGuideBtn = document.getElementById('pdp-size-guide-btn');
  if (sizeGuideBtn) {
    if (product.type === 'ring') {
      sizeGuideBtn.style.display = 'inline-flex';
      sizeGuideBtn.onclick = openRingSizeModal;
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
      trigger.onclick = () => {
        const isOpen = item.classList.contains('open');
        item.classList.toggle('open', !isOpen);
      };
    }
  });
}

async function renderRelatedProducts(product) {
  const grid = document.getElementById('pdp-related-grid');
  if (!grid) return;

  const all = await fetchProducts();
  const related = all
    .filter(p => p.id !== product.id && (p.primaryCategory === product.primaryCategory || p.gemstone === product.gemstone))
    .slice(0, 3);

  const fallback = related.length >= 2 ? related : all.filter(p => p.id !== product.id).slice(0, 3);
  const currentCurrency = store.getCurrency();

  grid.innerHTML = fallback.map(item => `
    <article class="product-card">
      <div class="product-card-media">
        <a href="product.html?id=${item.id}">
          <img src="${normalizeAssetPath(item.image)}" alt="${item.title}" loading="lazy">
        </a>
      </div>
      <div class="product-card-content">
        <h3 class="product-card-title">
          <a href="product.html?id=${item.id}">${item.title}</a>
        </h3>
        <p class="product-card-desc">${item.poeticDescriptor}</p>
        <div class="product-card-footer">
          <span class="product-price">
            ${item.priceAmount ? formatPrice(item.priceAmount, currentCurrency) : item.priceDisplay}
          </span>
          <a href="product.html?id=${item.id}" class="product-card-view-btn">
            <span>View Piece</span> &rarr;
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

function initCertificateSimulator() {
  const viewCertBtn = document.getElementById('pdp-view-cert-sample-btn');
  if (viewCertBtn) {
    viewCertBtn.onclick = () => {
      showToast('Authenticity Guarantee: Complete physical testing lab report & BIS hallmark receipt accompany delivery.');
    };
  }
}

function formatCategoryName(cat) {
  const map = {
    gemstones: 'Natural Gemstones',
    diamonds: 'Fine Diamonds',
    gold: 'Hallmarked Gold',
    silver: 'Sterling Silver'
  };
  return map[cat] || 'Fine Jewellery';
}

function injectProductSchema(product) {
  let script = document.getElementById('pdp-json-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'pdp-json-ld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title,
    'description': product.poeticDescriptor || product.narrative,
    'image': product.image ? window.location.origin + '/' + normalizeAssetPath(product.image) : undefined,
    'brand': {
      '@type': 'Brand',
      'name': 'Gulshan Jewellers'
    },
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'INR',
      'price': product.priceAmount || undefined,
      'priceSpecification': {
        '@type': 'PriceSpecification',
        'priceCurrency': 'INR',
        'description': product.priceDisplay
      },
      'availability': 'https://schema.org/InStock',
      'itemCondition': 'https://schema.org/NewCondition'
    }
  };

  script.textContent = JSON.stringify(schema, null, 2);
}
