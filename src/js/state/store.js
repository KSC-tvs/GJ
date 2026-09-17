/**
 * Central Reactive Store
 * Gulshan Jewellers | Est. 1950
 */

class Store {
  constructor() {
    this.subscribers = new Map();
    this.state = {
      currency: localStorage.getItem('gj_currency') || 'INR',
      tray: this.loadStorage('gj_tray', []),
      recentSearches: this.loadStorage('gj_recent_searches', []),
      cmsProducts: this.loadStorage('gj_cms_products', null)
    };
  }

  loadStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Error loading ${key} from storage:`, e);
      return fallback;
    }
  }

  saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    // Immediately call with current value
    callback(this.state[key]);

    return () => {
      this.subscribers.get(key).delete(callback);
    };
  }

  notify(key) {
    if (this.subscribers.has(key)) {
      for (const cb of this.subscribers.get(key)) {
        cb(this.state[key]);
      }
    }
  }

  // Currency
  setCurrency(code) {
    this.state.currency = code;
    localStorage.setItem('gj_currency', code);
    this.notify('currency');
  }

  getCurrency() {
    return this.state.currency;
  }

  // Consultation Tray
  getTray() {
    return [...this.state.tray];
  }

  addToTray(product) {
    if (this.state.tray.some(item => item.id === product.id)) {
      return { success: false, message: 'This piece is already in your Curated Tray.' };
    }
    if (this.state.tray.length >= 4) {
      return { success: false, message: 'Your Curated Tray holds a maximum of 4 pieces for focused consultation.' };
    }

    const simplified = {
      id: product.id,
      title: product.title,
      priceDisplay: product.priceDisplay,
      priceAmount: product.priceAmount,
      image: product.image,
      primaryCategory: product.primaryCategory,
      gemstone: product.gemstone,
      metal: product.metal,
      badges: product.badges,
      specs: product.specs
    };

    this.state.tray.push(simplified);
    this.saveStorage('gj_tray', this.state.tray);
    this.notify('tray');
    return { success: true, message: `Added "${product.title}" to your Curated Tray.` };
  }

  removeFromTray(productId) {
    this.state.tray = this.state.tray.filter(item => item.id !== productId);
    this.saveStorage('gj_tray', this.state.tray);
    this.notify('tray');
  }

  clearTray() {
    this.state.tray = [];
    this.saveStorage('gj_tray', []);
    this.notify('tray');
  }

  // Searches
  addRecentSearch(term) {
    if (!term || typeof term !== 'string') return;
    const clean = term.trim();
    if (!clean) return;

    this.state.recentSearches = [
      clean,
      ...this.state.recentSearches.filter(t => t.toLowerCase() !== clean.toLowerCase())
    ].slice(0, 5);

    this.saveStorage('gj_recent_searches', this.state.recentSearches);
    this.notify('recentSearches');
  }

  // CMS Product Overrides
  saveCmsProducts(products) {
    this.state.cmsProducts = products;
    this.saveStorage('gj_cms_products', products);
    this.notify('cmsProducts');
  }

  resetCmsProducts() {
    this.state.cmsProducts = null;
    localStorage.removeItem('gj_cms_products');
    this.notify('cmsProducts');
  }
}

export const store = new Store();
