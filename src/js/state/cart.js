/**
 * Central Reactive Cart Store
 * Gulshan Jewellers | Est. 1950
 * Handles ready-to-ship e-commerce purchases, ring size selections, quantity updates, and checkout state.
 */

class CartStore {
  constructor() {
    this.subscribers = new Set();
    this.items = this.loadStorage();
  }

  loadStorage() {
    // One-time cleanup of stale legacy keys from previous templates
    try {
      ['ksc_cart', 'ksc_orders', 'ksc_tray', 'ksc_products'].forEach(k => localStorage.removeItem(k));
    } catch (_) {}

    try {
      const data = localStorage.getItem('gj_cart');
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Error reading gj_cart from storage:', e);
      return [];
    }
  }

  saveStorage() {
    try {
      const safe = Array.isArray(this.items) ? this.items : [];
      localStorage.setItem('gj_cart', JSON.stringify(safe));
    } catch (e) {
      console.warn('Error saving gj_cart to storage:', e);
    }
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
    try {
      callback(this.getState());
    } catch (err) {
      console.error('Cart subscriber initial execution error:', err);
    }
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    for (const callback of this.subscribers) {
      try {
        callback(state);
      } catch (err) {
        console.error('Cart subscriber notification error:', err);
      }
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
    const size = options.size || options.ringSize || 'Standard';
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
        priceDisplay: product.priceDisplay,
        image: product.image,
        primaryCategory: product.primaryCategory,
        metalPurity: product.specs?.metalPurity || product.badges?.hallmark || 'Hallmarked Purity',
        size: size,
        metal: metal,
        leadTime: product.leadTime || 'Ready to dispatch in 2–3 business days',
        quantity: options.quantity || 1
      });
    }

    this.saveStorage();
    this.notify();
    return { success: true, count: this.getItemCount() };
  }

  updateQuantity(id, size, delta) {
    const item = this.items.find(i => i.id === id && i.size === size);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(id, size);
      return;
    }

    this.saveStorage();
    this.notify();
  }

  removeItem(id, size) {
    this.items = this.items.filter(i => !(i.id === id && i.size === size));
    this.saveStorage();
    this.notify();
  }

  clear() {
    this.items = [];
    this.saveStorage();
    this.notify();
  }
}

export const cart = new CartStore();
