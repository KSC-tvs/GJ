/**
 * Accessible Shopping Bag Drawer Component
 * Gulshan Jewellers | Est. 1950
 * Handles cart display, quantity stepper, currency conversions, focus trap, and checkout initiation.
 */

import { cart } from '../state/cart.js';
import { store } from '../state/store.js';
import { formatPrice } from '../state/currency.js';
import { normalizeAssetPath } from '../data.js';
import { showToast } from './toast.js';
import { Tracking } from '../tracking.js';

let cartDrawerDOM = null;
let previousActiveElement = null;

export function initCartDrawer() {
  createCartDrawerDOM();
  updateCartPills();

  cart.subscribe(() => {
    updateCartPills();
    renderCartItems();
  });

  store.subscribe('currency', () => {
    renderCartItems();
  });

  setupCartGlobalTriggers();
}

function getBasePath() {
  const isProductsSubdir = window.location.pathname.includes('/products/');
  return isProductsSubdir ? '../' : './';
}

function createCartDrawerDOM() {
  if (document.getElementById('cart-drawer')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'cart-drawer';
  backdrop.className = 'drawer-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'cart-drawer-heading');

  const basePath = getBasePath();

  backdrop.innerHTML = `
    <div class="drawer">
      <div class="drawer-header">
        <div>
          <span class="section-eyebrow" style="margin: 0; font-size: 0.65rem;">Gulshan Jewellers &middot; Est. 1950</span>
          <h3 id="cart-drawer-heading" class="drawer-title">Shopping Bag</h3>
        </div>
        <button type="button" class="drawer-close" id="cart-drawer-close-btn" aria-label="Close shopping bag">&times;</button>
      </div>
      <div class="drawer-body">
        <div id="cart-items-container" class="cart-items-list" style="display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-6);">
          <!-- Populated dynamically -->
        </div>

        <div id="cart-footer-summary" style="margin-top: auto; border-top: 1px solid var(--color-border-hairline); padding-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);">
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--color-text-secondary);">
            <span>Subtotal</span>
            <span id="cart-subtotal-val" style="font-weight: 600; color: var(--color-text-primary);">₹0</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-gold-deep);">
            <span>Insured Shipping (India)</span>
            <span>Complimentary</span>
          </div>
          <p style="font-size: 0.72rem; color: var(--color-text-muted); line-height: 1.5; margin: 0;">
            All fine jewellery &amp; silver dispatches include tamper-evident security packaging and insured transit.
          </p>

          <a href="${basePath}checkout.html" id="cart-checkout-btn" class="btn btn-gold btn-lg" style="width: 100%; text-align: center; text-decoration: none; margin-top: var(--space-2);">
            Proceed to Secure Checkout
          </a>
          <button type="button" id="cart-continue-btn" class="btn btn-outline" style="width: 100%;">
            Continue Browsing Collections
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  cartDrawerDOM = backdrop;

  const closeBtn = backdrop.querySelector('#cart-drawer-close-btn');
  closeBtn.addEventListener('click', closeCartDrawer);

  const continueBtn = backdrop.querySelector('#cart-continue-btn');
  if (continueBtn) continueBtn.addEventListener('click', closeCartDrawer);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCartDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      closeCartDrawer();
    }
  });
}

export function openCartDrawer() {
  if (!cartDrawerDOM) createCartDrawerDOM();
  previousActiveElement = document.activeElement;

  renderCartItems();
  cartDrawerDOM.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Set focus into drawer
  const closeBtn = cartDrawerDOM.querySelector('#cart-drawer-close-btn');
  if (closeBtn) closeBtn.focus();

  Tracking.trackCartOpen?.(cart.getItemCount(), cart.getSubtotal());
}

export function closeCartDrawer() {
  if (!cartDrawerDOM) return;
  cartDrawerDOM.classList.remove('active');
  document.body.style.overflow = '';

  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

function updateCartPills() {
  const count = cart.getItemCount();
  const pills = document.querySelectorAll('.cart-counter-pill');

  pills.forEach(pill => {
    if (count > 0) {
      pill.textContent = String(count);
      pill.style.display = 'inline-flex';
    } else {
      pill.style.display = 'none';
    }
  });
}

function renderCartItems() {
  if (!cartDrawerDOM) return;

  const container = cartDrawerDOM.querySelector('#cart-items-container');
  const footer = cartDrawerDOM.querySelector('#cart-footer-summary');
  const subtotalEl = cartDrawerDOM.querySelector('#cart-subtotal-val');
  if (!container || !footer || !subtotalEl) return;

  const items = cart.getItems();
  const currency = store.getCurrency();
  const basePath = getBasePath();

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-10) var(--space-4);">
        <svg style="width: 48px; height: 48px; stroke: var(--color-text-muted); fill: none; margin: 0 auto var(--space-3);" viewBox="0 0 24 24" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h4 style="font-size: 1.1rem; color: var(--color-text-primary); margin-bottom: var(--space-2);">Your Bag is Empty</h4>
        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); line-height: 1.6; max-width: 280px; margin: 0 auto var(--space-5);">
          Explore our handcrafted sterling silver, everyday diamonds, and certified creations ready for dispatch.
        </p>
        <a href="${basePath}collections.html" class="btn btn-gold btn-sm" style="text-decoration: none; display: inline-flex;" onclick="GJ.closeCartDrawer()">
          Explore Collections
        </a>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';
  const subtotal = cart.getSubtotal();
  subtotalEl.textContent = formatPrice(subtotal, currency);

  container.innerHTML = items.map(item => {
    const itemTotal = (item.priceAmount || 0) * (item.quantity || 1);
    const itemPriceDisplay = item.priceAmount ? formatPrice(itemTotal, currency) : item.priceDisplay;
    const cleanImg = normalizeAssetPath(item.image);
    const imgSrc = cleanImg.startsWith('http') ? cleanImg : `${basePath}${cleanImg}`;

    return `
      <div class="cart-item-card" style="display: flex; gap: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border-hairline);">
        <img src="${imgSrc}" alt="${item.title}" style="width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-2xs); border: 1px solid var(--color-border-subtle); flex-shrink: 0;" onerror="this.src='${basePath}images/pukhraj-hero.jpg'">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 0.88rem; font-family: var(--font-serif); color: var(--color-text-primary); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.title}
          </h4>
          <div style="font-size: 0.72rem; color: var(--color-text-muted); line-height: 1.4; margin-bottom: 6px;">
            ${item.size && item.size !== 'Standard' ? `<span>Size: ${item.size}</span> &middot; ` : ''}
            <span>${item.metalPurity}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 600; font-size: 0.82rem; color: var(--color-gold-deep);">
              ${itemPriceDisplay}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-qty-step" data-action="decrease" data-id="${item.id}" data-size="${item.size}" aria-label="Decrease quantity for ${item.title}" style="width: 26px; height: 26px; border: 1px solid var(--color-border-subtle); background: #FAF8F5; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">-</button>
              <span style="font-size: 0.8rem; font-weight: 600; min-width: 18px; text-align: center;">${item.quantity}</span>
              <button type="button" class="btn-qty-step" data-action="increase" data-id="${item.id}" data-size="${item.size}" aria-label="Increase quantity for ${item.title}" style="width: 26px; height: 26px; border: 1px solid var(--color-border-subtle); background: #FAF8F5; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">+</button>
              <button type="button" class="btn-item-remove" data-id="${item.id}" data-size="${item.size}" aria-label="Remove ${item.title} from shopping bag" title="Remove piece" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; margin-left: 4px; font-size: 14px;">&times;</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind quantity steppers
  container.querySelectorAll('.btn-qty-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const size = btn.getAttribute('data-size');
      const action = btn.getAttribute('data-action');
      cart.updateQuantity(id, size, action === 'increase' ? 1 : -1);
    });
  });

  // Bind remove buttons
  container.querySelectorAll('.btn-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const size = btn.getAttribute('data-size');
      cart.removeItem(id, size);
      showToast('Piece removed from bag.');
    });
  });
}

function setupCartGlobalTriggers() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-trigger-cart]');
    if (trigger) {
      e.preventDefault();
      openCartDrawer();
    }
  });
}
