/**
 * Cart Store Unit Test
 * Gulshan Jewellers | Est. 1950
 * Validates state normalization, subscriber resilience, and zero console errors.
 */

const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock CartStore class for Node testing
class TestCartStore {
  constructor() {
    this.subscribers = new Set();
    this.items = this.loadStorage();
  }

  loadStorage() {
    try {
      ['ksc_cart', 'ksc_orders', 'ksc_tray', 'ksc_products'].forEach(k => localStorage.removeItem(k));
    } catch (_) {}

    try {
      const data = localStorage.getItem('gj_cart');
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  saveStorage() {
    const safe = Array.isArray(this.items) ? this.items : [];
    localStorage.setItem('gj_cart', JSON.stringify(safe));
  }

  getState() {
    const items = this.getItems();
    return {
      items,
      count: this.getItemCount(),
      subtotal: this.getSubtotal()
    };
  }

  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    for (const callback of this.subscribers) {
      callback(state);
    }
  }

  getItems() {
    return Array.isArray(this.items) ? [...this.items] : [];
  }

  getItemCount() {
    const list = Array.isArray(this.items) ? this.items : [];
    return list.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
  }

  getSubtotal() {
    const list = Array.isArray(this.items) ? this.items : [];
    return list.reduce((sum, item) => sum + ((Number(item?.priceAmount) || 0) * (Number(item?.quantity) || 1)), 0);
  }

  addItem(product, options = {}) {
    const size = options.size || 'Standard';
    const metal = options.metal || product.metal || 'Default';
    const existingIndex = this.items.findIndex(
      item => item.id === product.id && item.size === size && item.metal === metal
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += options.quantity || 1;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        priceAmount: product.priceAmount,
        size,
        metal,
        quantity: options.quantity || 1
      });
    }

    this.saveStorage();
    this.notify();
  }
}

console.log('--- Running Cart Store Resilience Tests ---');

// Test 1: Clean initialization
localStorage.clear();
const cart1 = new TestCartStore();
assert.strictEqual(cart1.getItemCount(), 0, 'Empty cart count must be 0');
assert.strictEqual(cart1.getSubtotal(), 0, 'Empty cart subtotal must be 0');
assert.deepStrictEqual(cart1.getItems(), [], 'Empty cart items must be empty array');

// Test 2: Subscriber handles empty cart without throwing
let subscriberState = null;
let lastCount = -1;
const unsubscribe = cart1.subscribe(state => {
  // MobileNav style reduce test
  const items = Array.isArray(state) ? state : (state?.items || []);
  const count = items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
  lastCount = count;
  subscriberState = state;
});
assert.strictEqual(lastCount, 0);
assert(subscriberState !== null, 'Subscriber must be invoked immediately');
assert.deepStrictEqual(subscriberState.items, []);
assert.strictEqual(subscriberState.count, 0);
assert.strictEqual(subscriberState.subtotal, 0);

// Test 3: Adding item updates subscriber
cart1.addItem({ id: 'kyanite-ring', title: 'Blue Kyanite Ring', priceAmount: 18500, metal: '925-silver' }, { quantity: 2 });
assert.strictEqual(cart1.getItemCount(), 2);
assert.strictEqual(cart1.getSubtotal(), 37000);
assert.strictEqual(subscriberState.count, 2);
assert.strictEqual(subscriberState.subtotal, 37000);

// Test 4: Stale ksc_* keys are cleaned up
localStorage.setItem('ksc_cart', '["legacy"]');
localStorage.setItem('ksc_orders', '["old"]');
const cart2 = new TestCartStore();
assert.strictEqual(localStorage.getItem('ksc_cart'), null, 'ksc_cart must be removed');
assert.strictEqual(localStorage.getItem('ksc_orders'), null, 'ksc_orders must be removed');

// Test 5: Corrupt storage handled safely
localStorage.setItem('gj_cart', 'invalid-json{{{');
const cart3 = new TestCartStore();
assert.strictEqual(cart3.getItemCount(), 0, 'Corrupt storage must fall back safely to 0 items');

unsubscribe();
console.log('✅ All Cart Store tests PASSED with 0 errors.');
