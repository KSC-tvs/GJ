/**
 * Data Service for Gulshan Jewellers | Est. 1950
 * Resilient Multi-Tier Catalogue Provider:
 * 1. Bundled Static JSON Catalogue (Zero-latency fallback, 100% offline & GitHub Pages compatible)
 * 2. Live Supabase PostgreSQL Database (When configured & online)
 * 3. Local Storage Caching
 */

import { store } from './state/store.js';
import { db } from './supabase.js';

import bundledSiteConfig from '../data/site-config.json';
import bundledProducts from '../data/products.json';
import bundledGemstones from '../data/gemstones.json';

/**
 * Normalizes asset URLs to ensure compatibility with GitHub Pages subpaths
 * e.g., '/images/pukhraj-hero.jpg' -> 'images/pukhraj-hero.jpg'
 */
export function normalizeAssetPath(url) {
  if (!url) return '';
  if (url.startsWith('/images/')) {
    return url.slice(1); // 'images/...'
  }
  return url;
}

function sanitizeProduct(product) {
  if (!product) return null;
  return {
    ...product,
    image: normalizeAssetPath(product.image),
    secondaryImage: normalizeAssetPath(product.secondaryImage)
  };
}

export async function fetchSiteConfig() {
  let config = { ...bundledSiteConfig };

  // Attempt to merge live store settings from Supabase if connected
  try {
    const dbSettings = await db.getStoreSettings();
    if (dbSettings) {
      if (dbSettings.bullion_rates) {
        config.bullionRates = { ...config.bullionRates, ...dbSettings.bullion_rates };
      }
      if (dbSettings.contact_info) {
        config.contact = { ...config.contact, ...dbSettings.contact_info };
      }
      config.cloudSynced = true;
    }
  } catch (err) {
    // Non-blocking fallback to bundled site config
  }

  return config;
}

export async function fetchProducts() {
  // 1. First priority: Live Supabase PostgreSQL database if available
  try {
    const dbProducts = await db.getProducts();
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      const sanitized = dbProducts.map(sanitizeProduct);
      try {
        localStorage.setItem('gj_cms_products', JSON.stringify(sanitized));
      } catch (_) {}
      return sanitized;
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // 2. Second priority: staff custom CMS overrides in store / localStorage
  const cmsProducts = store.loadStorage('gj_cms_products', null);
  if (cmsProducts && Array.isArray(cmsProducts) && cmsProducts.length > 0) {
    return cmsProducts.map(sanitizeProduct);
  }

  // 3. Guaranteed fallback: bundled static catalogue
  return (bundledProducts || []).map(sanitizeProduct);
}

export async function fetchProductById(id) {
  if (!id) return null;
  const products = await fetchProducts();
  const cleanId = String(id).trim().toLowerCase();
  const found = products.find(p => p.id && p.id.toLowerCase() === cleanId);
  return found || null;
}

export async function fetchGemstones() {
  return bundledGemstones || [];
}
