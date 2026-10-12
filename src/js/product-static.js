/**
 * Static Product Page Interactive Enhancements
 * Gulshan Jewellers | Est. 1950
 * Handles thumbnail switching, tray addition, accordions & currency conversion on static PDPs
 */

import { store } from './state/store.js';
import { cart } from './state/cart.js';
import { openCartDrawer } from './components/cartDrawer.js';
import { formatPrice } from './state/currency.js';
import { openEnquiryModal } from './main.js';
import { openRingSizeModal } from './components/ringSizeModal.js';
import { showToast } from './components/toast.js';
import productsData from '../data/products.json';

document.addEventListener('DOMContentLoaded', () => {
  initImageGallery();
  initAccordions();
  initTrayButtons();
  initEnquiryButtons();
  initCommerceButtons();
  initCurrencySync();
});

function initImageGallery() {
  const mainImg = document.getElementById('pdp-main-img');
  const thumbs = document.querySelectorAll('.pdp-thumb');
  const mainWrap = document.querySelector('.pdp-main-image-wrap');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const newSrc = thumb.getAttribute('data-src');
      if (mainImg && newSrc) {
        mainImg.src = newSrc;
      }
    });
  });

  if (mainWrap && mainImg) {
    mainWrap.addEventListener('mousemove', (e) => {
      const rect = mainWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transform = 'scale(1.5)';
    });

    mainWrap.addEventListener('mouseleave', () => {
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    });
  }
}

function initAccordions() {
  const triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.accordion-item');
      if (parent) {
        parent.classList.toggle('open');
        const icon = btn.querySelector('.icon');
        if (icon) {
          icon.textContent = parent.classList.contains('open') ? '−' : '+';
        }
      }
    });
  });
}

function initTrayButtons() {
  const addBtn = document.getElementById('pdp-add-tray-btn');
  if (!addBtn) return;

  const productId = addBtn.getAttribute('data-id');
  if (!productId) return;

  addBtn.addEventListener('click', () => {
    store.addToTray(productId);
    addBtn.textContent = '✓ Added to Tray';
    addBtn.classList.add('btn-gold');
    addBtn.classList.remove('btn-outline');
    setTimeout(() => {
      addBtn.textContent = '+ Add to Tray';
      addBtn.classList.remove('btn-gold');
      addBtn.classList.add('btn-outline');
    }, 2000);
  });
}

function initEnquiryButtons() {
  const enquireBtn = document.getElementById('pdp-primary-enquire-btn');
  if (enquireBtn) {
    enquireBtn.addEventListener('click', () => {
      const productId = enquireBtn.getAttribute('data-product-id');
      const product = productsData.find(p => p.id === productId);
      if (product) {
        openEnquiryModal(product);
      }
    });
  }

  const sizeBtn = document.getElementById('pdp-size-guide-btn');
  if (sizeBtn) {
    sizeBtn.addEventListener('click', () => {
      openRingSizeModal();
    });
  }
}

function initCommerceButtons() {
  const addToBagBtn = document.getElementById('pdp-add-to-bag-btn');
  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      const id = addToBagBtn.getAttribute('data-id');
      const title = addToBagBtn.getAttribute('data-title');
      const price = parseFloat(addToBagBtn.getAttribute('data-price')) || 0;
      const image = addToBagBtn.getAttribute('data-image');
      const sizeSelect = document.getElementById('pdp-size-select');
      const size = sizeSelect ? sizeSelect.value : null;

      cart.addItem({ id, title, price, image, size });
      openCartDrawer();
    });
  }

  const buyNowBtn = document.getElementById('pdp-buy-now-btn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const id = buyNowBtn.getAttribute('data-id');
      const title = buyNowBtn.getAttribute('data-title');
      const price = parseFloat(buyNowBtn.getAttribute('data-price')) || 0;
      const image = buyNowBtn.getAttribute('data-image');
      const sizeSelect = document.getElementById('pdp-size-select');
      const size = sizeSelect ? sizeSelect.value : null;

      cart.addItem({ id, title, price, image, size });
      window.location.href = '../checkout.html';
    });
  }
}

function initCurrencySync() {
  const priceEl = document.getElementById('pdp-price');
  if (!priceEl) return;

  const urlParams = window.location.pathname;
  const match = urlParams.match(/\/([^\/]+)\.html$/);
  const currentSlug = match ? match[1] : '';
  const product = productsData.find(p => p.id === currentSlug);

  if (product && product.priceAmount) {
    store.subscribe((state) => {
      priceEl.textContent = formatPrice(product.priceAmount, state.currency);
    });
  }
}
