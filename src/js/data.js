/**
 * Data Service for Gulshan Jewellers
 * Loads Headless JSON Data with CMS localStorage Overrides
 */

import { store } from './state/store.js';

export async function fetchSiteConfig() {
  try {
    const response = await fetch('/src/data/site-config.json');
    if (!response.ok) throw new Error('Failed to load site config');
    return await response.json();
  } catch (error) {
    console.error('Error loading site config:', error);
    return null;
  }
}

export async function fetchProducts() {
  // Check if staff has custom CMS overrides in store
  const cmsProducts = store.loadStorage('gj_cms_products', null);
  if (cmsProducts && Array.isArray(cmsProducts) && cmsProducts.length > 0) {
    return cmsProducts;
  }

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
