/**
 * Order Confirmation & Invoice Controller
 * Gulshan Jewellers | Est. 1950
 */

import { formatPrice } from './state/currency.js';
import { normalizeAssetPath } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || 'GJ-ORD-2026-HERITAGE';

  let orderData = null;
  try {
    const last = JSON.parse(localStorage.getItem('gj_last_order') || 'null');
    if (last && (last.orderId === orderId || !params.get('orderId'))) {
      orderData = last;
    } else {
      const orders = JSON.parse(localStorage.getItem('gj_orders') || '[]');
      orderData = orders.find(o => o.orderId === orderId);
    }
  } catch (e) {
    console.warn('Could not read order from storage:', e);
  }

  renderConfirmation(orderId, orderData);
  bindActions(orderId, orderData);
});

function renderConfirmation(orderId, order) {
  const orderIdEl = document.getElementById('receipt-order-id');
  if (orderIdEl) orderIdEl.textContent = orderId;

  if (!order) return;

  const nameEl = document.getElementById('receipt-customer-name');
  const contactEl = document.getElementById('receipt-customer-contact');
  const addrEl = document.getElementById('receipt-shipping-address');
  const dateEl = document.getElementById('receipt-order-date');
  const paymentEl = document.getElementById('receipt-payment-status');
  const subtotalEl = document.getElementById('receipt-subtotal-val');
  const totalEl = document.getElementById('receipt-total-val');
  const itemsContainer = document.getElementById('receipt-items-list');

  if (nameEl && order.customer?.name) nameEl.textContent = order.customer.name;
  if (contactEl && order.customer) {
    contactEl.textContent = `${order.customer.phone} &middot; ${order.customer.email}`;
  }

  if (addrEl && order.shippingAddress) {
    const sa = order.shippingAddress;
    addrEl.textContent = `${sa.address}${sa.landmark ? `, ${sa.landmark}` : ''}, ${sa.city}, ${sa.state} - ${sa.pincode}`;
  }

  if (dateEl && order.orderDate) {
    dateEl.textContent = new Date(order.orderDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (paymentEl && order.payment?.method) {
    paymentEl.textContent = `Payment: ${order.payment.method.toUpperCase()} (Invoice Generated)`;
  }

  const currency = order.currency || 'INR';
  if (subtotalEl) subtotalEl.textContent = formatPrice(order.subtotal || order.totalAmount, currency);
  if (totalEl) totalEl.textContent = formatPrice(order.totalAmount, currency);

  if (itemsContainer && order.items) {
    itemsContainer.innerHTML = order.items.map(item => {
      const itemTotal = (item.priceAmount || 0) * (item.quantity || 1);
      const cleanImg = normalizeAssetPath(item.image);

      return `
        <div style="display: flex; gap: var(--space-4); align-items: center; padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border-hairline);">
          <img src="${cleanImg}" alt="${item.title}" style="width: 52px; height: 52px; object-fit: cover; border-radius: var(--radius-2xs); border: 1px solid var(--color-border-subtle); flex-shrink: 0;" onerror="this.src='images/pukhraj-hero.jpg'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.9rem; font-family: var(--font-serif); font-weight: 600; color: var(--color-text-primary);">
              ${item.title}
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">
              ${item.size && item.size !== 'Standard' ? `Size: ${item.size} &middot; ` : ''}Purity: ${item.metalPurity || 'Hallmarked'} &middot; Qty: ${item.quantity}
            </div>
          </div>
          <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-gold-deep);">
            ${formatPrice(itemTotal, currency)}
          </div>
        </div>
      `;
    }).join('');
  }
}

function bindActions(orderId, order) {
  const printBtn = document.getElementById('receipt-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const waBtn = document.getElementById('receipt-whatsapp-btn');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const clientName = order?.customer?.name || 'Client';
      const itemsText = order?.items?.map(i => `${i.title} (x${i.quantity})`).join(', ') || 'Fine Jewellery Acquisition';
      const totalText = order?.totalAmount ? `₹${order.totalAmount.toLocaleString('en-IN')}` : '';

      const text = `Hello Gulshan Jewellers, I have placed Order #${orderId} for ${itemsText} (${totalText}). Delivery to ${clientName}, ${order?.shippingAddress?.city || 'India'}. Please confirm the dispatch schedule.`;
      const url = `https://wa.me/919582841454?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });
  }
}
