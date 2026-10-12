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
    try {
      const data = localStorage.getItem('gj_cart');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error reading gj_cart from storage:', e);
      return [];
    }
  }

  saveStorage() {
    try {
      localStorage.setItem('gj_cart', JSON.stringify(this.items));
    } catch (e) {
      console.warn('Error saving gj_cart to storage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getItems());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const items = this.getItems();
    for (const callback of this.subscribers) {
      try {
        callback(items);
      } catch (err) {
        console.error('Cart subscriber error:', err);
      }
    }
  }

  getItems() {
    return [...this.items];
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + ((item.priceAmount || 0) * (item.quantity || 1)), 0);
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
