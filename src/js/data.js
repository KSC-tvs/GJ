/**
 * Data Service for Gulshan Jewellers
 * Loads Headless JSON Data with CMS localStorage Overrides
 */

import { store } from './state/store.js';
import { db } from './supabase.js';

export async function fetchSiteConfig() {
  let baseConfig = null;
  try {
    const response = await fetch('/src/data/site-config.json');
    if (response.ok) {
      baseConfig = await response.json();
    }
  } catch (error) {
    console.warn('Could not load local site-config.json:', error);
  }

  // Attempt to merge live store settings from Supabase
  try {
    const dbSettings = await db.getStoreSettings();
    if (dbSettings) {
      if (!baseConfig) baseConfig = {};
      if (dbSettings.bullion_rates) {
        baseConfig.bullionRates = { ...baseConfig.bullionRates, ...dbSettings.bullion_rates };
      }
      if (dbSettings.contact_info) {
        baseConfig.contact = { ...baseConfig.contact, ...dbSettings.contact_info };
      }
      baseConfig.cloudSynced = true;
    }
  } catch (err) {
    console.warn('Supabase store settings fetch error (using local):', err);
  }

  return baseConfig;
}

export async function fetchProducts() {
  // 1. First priority: live Supabase PostgreSQL database
  try {
    const dbProducts = await db.getProducts();
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      // Cache latest fetched products for resilient offline fallback
      try {
        localStorage.setItem('gj_cms_products', JSON.stringify(dbProducts));
      } catch (_) {}
      return dbProducts;
    }
  } catch (err) {
    console.warn('Supabase products fetch failed, falling back to local store:', err);
  }

  // 2. Second priority: staff custom CMS overrides in store / localStorage
  const cmsProducts = store.loadStorage('gj_cms_products', null);
  if (cmsProducts && Array.isArray(cmsProducts) && cmsProducts.length > 0) {
    return cmsProducts;
  }

  // 3. Third priority: bundled static JSON catalogue
  try {
    const response = await fetch('/src/data/products.json');
    if (!response.ok) throw new Error('Failed to load products');
    return await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function fetchProductById(id) {
  const products = await fetchProducts();
  return products.find(p => p.id === id) || products[0];
}

export async function fetchGemstones() {
  try {
    const response = await fetch('/src/data/gemstones.json');
    if (!response.ok) throw new Error('Failed to load gemstones');
    return await response.json();
  } catch (error) {
    console.error('Error loading gemstones:', error);
    return [];
  }
}

