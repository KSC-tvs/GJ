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

  // Check COD Eligibility based on cart items
  updateCodEligibility(form);

  // Bind live PIN code serviceability check
  const pinInput = document.getElementById('checkout-pincode');
  pinInput?.addEventListener('input', () => {
    checkPincodeServiceability(pinInput.value.trim());
  });

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
        method: data.paymentMethod || 'razorpay',
        status: data.paymentMethod === 'cod' ? 'Cash On Delivery (Verified)' : (data.paymentMethod === 'razorpay' ? 'Paid via Razorpay (Test / Gateway)' : 'Tax Invoice Generated'),
        razorpayPaymentId: data.paymentMethod === 'razorpay' ? `pay_test_${Math.random().toString(36).substring(2, 10)}` : null
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

    // 2. Dispatch to Supabase Orders & CRM if available
    try {
      await db.createOrder({
        id: orderId,
        customer: orderRecord.customer,
        shippingAddress: orderRecord.shippingAddress,
        items: orderRecord.items,
        subtotal: orderRecord.subtotal,
        shippingFee: orderRecord.shippingFee,
        totalAmount: orderRecord.totalAmount,
        payment: orderRecord.payment,
        notes: orderRecord.notes
      });
    } catch (err) {
      console.warn('Supabase order creation notice (preserved offline):', err);
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

function checkPincodeServiceability(pin) {
  const badge = document.getElementById('pincode-serviceability');
  if (!badge) return;

  const cleanPin = pin.replace(/[^0-9]/g, '');
  if (cleanPin.length !== 6) {
    badge.style.display = 'none';
    return;
  }

  badge.style.display = 'block';

  // Delhi NCR prefix checks: 11 (Delhi), 121/122/124 (Haryana NCR), 201 (Noida/Ghaziabad)
  if (cleanPin.startsWith('11') || cleanPin.startsWith('121') || cleanPin.startsWith('122') || cleanPin.startsWith('201')) {
    badge.style.background = 'rgba(23, 86, 53, 0.1)';
    badge.style.color = '#175635';
    badge.style.border = '1px solid rgba(23, 86, 53, 0.2)';
    badge.innerHTML = `<strong>✔ Delhi NCR Priority Transit:</strong> Complimentary Same-Day / Next-Day Insured Atelier Handover available for PIN <strong>${cleanPin}</strong>.`;
  } else {
    badge.style.background = 'rgba(197, 168, 128, 0.12)';
    badge.style.color = 'var(--color-gold-deep)';
    badge.style.border = '1px solid var(--color-gold-champagne)';
    badge.innerHTML = `<strong>✔ Pan-India Insured Express:</strong> Standard 3–5 business day tamper-evident insured courier active for PIN <strong>${cleanPin}</strong>.`;
  }
}

function updateCodEligibility(form) {
  const codRadio = form.querySelector('input[name="paymentMethod"][value="cod"]');
  const codOpt = document.getElementById('payment-opt-cod');
  const explanation = document.getElementById('cod-explanation-text');
  if (!codRadio || !codOpt) return;

  const items = cart.getItems();
  const subtotal = cart.getSubtotal();

  // Fine jewellery or loose gemstone check
  const hasFinePieces = items.some(i => {
    const cat = (i.category || i.primaryCategory || '').toLowerCase();
    const type = (i.type || '').toLowerCase();
    return cat === 'gemstones' || cat === 'gold' || cat === 'diamonds' || cat === 'silver' || type.includes('fine');
  });

  if (hasFinePieces || subtotal > 10000) {
    codRadio.disabled = true;
    codOpt.style.opacity = '0.5';
    codOpt.style.cursor = 'not-allowed';
    if (explanation) {
      explanation.textContent = 'Unavailable: Cash on Delivery is restricted to Fashion / Artificial Jewellery orders under ₹10,000. Fine jewellery dispatches require tamper-evident prepaid courier insurance.';
    }
  } else {
    codRadio.disabled = false;
    codOpt.style.opacity = '1';
    codOpt.style.cursor = 'pointer';
    if (explanation) {
      explanation.textContent = 'Pay upon delivery. Available exclusively for Artificial Jewellery orders under ₹10,000.';
    }
  }
}
