/**
 * Checkout Controller
 * Gulshan Jewellers | Est. 1950
 * Validates shipping coordinates, manages payment methods, stores orders, and routes to confirmation.
 */

import { cart } from './state/cart.js';
import { store } from './state/store.js';
import { formatPrice } from './state/currency.js';
import { normalizeAssetPath } from './data.js';
import { db } from './supabase.js';
import { showToast } from './components/toast.js';
import { Tracking } from './tracking.js';

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutPage();
  bindFormHandlers();
  Tracking.trackCheckoutStart?.(cart.getItemCount(), cart.getSubtotal());
});

function renderCheckoutPage() {
  const items = cart.getItems();
  const emptyNotice = document.getElementById('checkout-empty-notice');
  const layoutGrid = document.getElementById('checkout-layout-grid');
  const itemsContainer = document.getElementById('checkout-summary-items');
  const countEl = document.getElementById('checkout-summary-count');
  const subtotalEl = document.getElementById('checkout-subtotal-amount');
  const grandTotalEl = document.getElementById('checkout-grand-total');

  if (items.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    if (layoutGrid) layoutGrid.style.display = 'none';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';
  if (layoutGrid) layoutGrid.style.display = 'grid';

  const currency = store.getCurrency();
  const subtotal = cart.getSubtotal();

  if (countEl) countEl.textContent = `${cart.getItemCount()} ${cart.getItemCount() === 1 ? 'Piece' : 'Pieces'}`;
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal, currency);
  if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal, currency);

  if (itemsContainer) {
    itemsContainer.innerHTML = items.map(item => {
      const itemTotal = (item.priceAmount || 0) * (item.quantity || 1);
      const cleanImg = normalizeAssetPath(item.image);

      return `
        <div style="display: flex; gap: var(--space-3); align-items: center; padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border-hairline);">
          <img src="${cleanImg}" alt="${item.title}" style="width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-2xs); border: 1px solid var(--color-border-subtle); flex-shrink: 0;" onerror="this.src='images/pukhraj-hero.jpg'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.82rem; font-family: var(--font-serif); font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.title}
            </div>
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
              ${item.size && item.size !== 'Standard' ? `Size ${item.size} &middot; ` : ''}Qty: ${item.quantity}
            </div>
          </div>
          <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-gold-deep); white-space: nowrap;">
            ${formatPrice(itemTotal, currency)}
          </div>
        </div>
      `;
    }).join('');
  }
}

function bindFormHandlers() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // Toggle active styling on payment selection
  const paymentRadios = form.querySelectorAll('input[name="paymentMethod"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('.payment-method-option').forEach(opt => {
        opt.style.borderColor = 'var(--color-border-subtle)';
        opt.style.background = 'transparent';
      });
      const selectedParent = radio.closest('.payment-method-option');
      if (selectedParent) {
        selectedParent.style.borderColor = 'var(--color-gold-champagne)';
        selectedParent.style.background = 'rgba(197, 168, 128, 0.05)';
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateCheckoutForm(form)) return;

    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Transmitting Order & Generating Invoice...';
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Anti-spam check
    if (data._gotcha) {
      console.warn('Bot submission intercepted');
      return;
    }

    const orderId = `GJ-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const items = cart.getItems();
    const subtotal = cart.getSubtotal();
    const currency = store.getCurrency();

    const orderRecord = {
      orderId,
      orderDate: new Date().toISOString(),
      customer: {
        name: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim()
      },
      shippingAddress: {
        address: data.address.trim(),
        landmark: (data.landmark || '').trim(),
        city: data.city.trim(),
        state: data.state || 'Delhi',
        pincode: data.pincode.trim(),
        shippingMethod: data.shippingMethod || 'courier'
      },
      payment: {
        method: data.paymentMethod || 'upi',
        status: 'Order Placed (Direct Atelier Invoice)'
      },
      items,
      subtotal,
      shippingFee: 0,
      totalAmount: subtotal,
      currency,
      notes: (data.notes || '').trim()
    };

    // 1. Record order locally
    try {
      const existingOrders = JSON.parse(localStorage.getItem('gj_orders') || '[]');
      existingOrders.unshift(orderRecord);
      localStorage.setItem('gj_orders', JSON.stringify(existingOrders));
      localStorage.setItem('gj_last_order', JSON.stringify(orderRecord));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // 2. Dispatch to Supabase CRM / Orders if available
    try {
      await db.createEnquiry({
        name: orderRecord.customer.name,
        contact: `${orderRecord.customer.phone} / ${orderRecord.customer.email}`,
        piece: `Order ${orderId}: ${items.map(i => `${i.title} (x${i.quantity})`).join(', ')}`,
        message: `Delivery: ${orderRecord.shippingAddress.address}, ${orderRecord.shippingAddress.city} - ${orderRecord.shippingAddress.pincode}. Payment: ${orderRecord.payment.method}. Total: ${formatPrice(subtotal, currency)}`,
        status: 'Order Placed'
      });
    } catch (err) {
      console.warn('Supabase order log notice (preserved offline):', err);
    }

    // 3. Fire analytics event
    Tracking.trackPurchase?.(orderRecord);

    // 4. Clear cart & redirect
    cart.clear();
    showToast('Your order has been placed. Redirecting to invoice confirmation...');

    setTimeout(() => {
      window.location.href = `order-confirmation.html?orderId=${encodeURIComponent(orderId)}`;
    }, 800);
  });
}

function validateCheckoutForm(form) {
  let isValid = true;

  const name = form.querySelector('#checkout-name');
  const errName = document.getElementById('err-checkout-name');
  if (!name.value.trim()) {
    errName.style.display = 'block';
    isValid = false;
  } else {
    errName.style.display = 'none';
  }

  const phone = form.querySelector('#checkout-phone');
  const errPhone = document.getElementById('err-checkout-phone');
  if (!phone.value.trim() || phone.value.replace(/[^0-9]/g, '').length < 8) {
    errPhone.style.display = 'block';
    isValid = false;
  } else {
    errPhone.style.display = 'none';
  }

  const email = form.querySelector('#checkout-email');
  const errEmail = document.getElementById('err-checkout-email');
  if (!email.value.trim() || !email.value.includes('@')) {
    errEmail.style.display = 'block';
    isValid = false;
  } else {
    errEmail.style.display = 'none';
  }

  const address = form.querySelector('#checkout-address');
  const errAddr = document.getElementById('err-checkout-address');
  if (!address.value.trim()) {
    errAddr.style.display = 'block';
    isValid = false;
  } else {
    errAddr.style.display = 'none';
  }

  const pincode = form.querySelector('#checkout-pincode');
  const errPin = document.getElementById('err-checkout-pincode');
  if (!pincode.value.trim() || pincode.value.replace(/[^0-9]/g, '').length !== 6) {
    errPin.style.display = 'block';
    isValid = false;
  } else {
    errPin.style.display = 'none';
  }

  const consent = form.querySelector('#checkout-terms-consent');
  const errConsent = document.getElementById('err-checkout-consent');
  if (!consent.checked) {
    errConsent.style.display = 'block';
    isValid = false;
  } else {
    errConsent.style.display = 'none';
  }

  return isValid;
}
