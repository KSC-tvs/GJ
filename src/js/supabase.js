/**
 * Supabase Database & Auth Service
 * Gulshan Jewellers | Est. 1950
 * Production-Grade Secure Client Architecture
 */

import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'gj_supabase_config';
const AUTH_SESSION_KEY = 'gj_admin_session';

let supabaseClient = null;

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.key) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored Supabase config:', e);
  }

  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl, key: envKey };
  }

  return null;
}

export function isSupabaseConfigured() {
  const cfg = getStoredConfig();
  return Boolean(cfg && cfg.url && cfg.key);
}

export function initSupabase(url, key) {
  if (!url || !key) {
    supabaseClient = null;
    return null;
  }
  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'gj_supabase_auth_token'
      }
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
}

// Initial setup from environment or storage
const initialCfg = getStoredConfig();
if (initialCfg) {
  initSupabase(initialCfg.url, initialCfg.key);
}

export function getSupabase() {
  if (!supabaseClient) {
    const cfg = getStoredConfig();
    if (cfg) initSupabase(cfg.url, cfg.key);
  }
  return supabaseClient;
}

export function saveSupabaseConfig(url, key) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (key || '').trim();
  if (!cleanUrl || !cleanKey) {
    localStorage.removeItem(STORAGE_KEY);
    supabaseClient = null;
    return false;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: cleanUrl, key: cleanKey }));
  initSupabase(cleanUrl, cleanKey);
  return true;
}

export async function testConnection(customUrl, customKey) {
  const testClient = (customUrl && customKey) 
    ? createClient(customUrl.trim(), customKey.trim()) 
    : getSupabase();

  if (!testClient) {
    return { success: false, error: 'No Supabase credentials provided.' };
  }

  try {
    const { error } = await testClient
      .from('store_settings')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: true, 
          needsSchema: true, 
          message: 'Connected to Supabase. Database schema needs to be applied by running supabase/schema.sql in the SQL Editor.' 
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase PostgreSQL database.' };
  } catch (err) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

/* --------------------------------------------------------------------------
   ADMIN AUTHENTICATION GATE
   Strictly enforced via Supabase Auth & JWT Session Verification
   -------------------------------------------------------------------------- */
export const auth = {
  async getSession() {
    const client = getSupabase();
    if (!client) return null;

    try {
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) {
        return { user: session.user, token: session.access_token };
      }
    } catch (e) {
      console.warn('Supabase auth getSession verification failed:', e);
    }
    return null;
  },

  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const client = getSupabase();
    if (!client) {
      return { 
        success: false, 
        error: 'Supabase cloud database is not connected. Configure project URL and Anon key in Database settings first.' 
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.session) {
        const sessionData = {
          user: { email: data.user.email, id: data.user.id, role: 'admin' },
          token: data.session.access_token,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
        return { success: true, session: sessionData, user: data.user };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Authentication error.' };
    }

    return { 
      success: false, 
      error: 'Invalid credentials. Please enter authorized staff credentials.' 
    };
  },

  async logout() {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout error:', e);
      }
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

/* --------------------------------------------------------------------------
   DATABASE CRUD METHODS
   -------------------------------------------------------------------------- */
export const db = {
  // PRODUCTS
  async getProducts() {
    const client = getSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map(row => ({
        id: row.id,
        title: row.title,
        poeticDescriptor: row.poetic_descriptor,
        priceDisplay: row.price_display,
        priceAmount: row.price_amount ? Number(row.price_amount) : null,
        primaryCategory: row.primary_category,
        gemstone: row.gemstone,
        metal: row.metal,
        type: row.type,
        occasion: row.occasion,
        featured: row.featured,
        isDailyWear: row.is_daily_wear,
        image: row.image,
        secondaryImage: row.secondary_image,
        badges: row.badges || {},
        specs: row.specs || {},
        narrative: row.narrative,
        transparencyNote: row.transparency_note,
        astrologicalNote: row.astrological_note
      }));
    } catch (err) {
      return null;
    }
  },

  async upsertProduct(product) {
    const session = await auth.getSession();
    if (!session) return { success: false, error: 'Unauthorized: staff authentication required' };

    const client = getSupabase();
    if (!client) return { success: false, error: 'Supabase not connected' };

    const payload = {
      id: product.id,
      title: product.title,
      poetic_descriptor: product.poeticDescriptor || '',
      price_display: product.priceDisplay || 'Price on Request',
      price_amount: product.priceAmount || null,
      primary_category: product.primaryCategory || 'gemstones',
      gemstone: product.gemstone || '',
      metal: product.metal || '',
      type: product.type || 'ring',
      occasion: product.occasion || 'daily',
      featured: Boolean(product.featured),
      is_daily_wear: Boolean(product.isDailyWear),
      image: product.image,
      secondary_image: product.secondaryImage || null,
      badges: product.badges || {},
      specs: product.specs || {},
      narrative: product.narrative || '',
      transparency_note: product.transparencyNote || '',
      astrological_note: product.astrologicalNote || '',
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await client
        .from('products')
        .upsert(payload)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteProduct(id) {
    const session = await auth.getSession();
    if (!session) return { success: false, error: 'Unauthorized: staff authentication required' };

    const client = getSupabase();
    if (!client) return { success: false, error: 'Supabase not connected' };
    try {
      const { error } = await client
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ENQUIRIES / CRM
  async getEnquiries() {
    const session = await auth.getSession();
    if (!session) return null; // Protect customer personal data from unauthorized access

    const client = getSupabase();
    if (!client) {
      // Local fallback for offline authorized staff
      try {
        return JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
      } catch (e) {
        return [];
      }
    }

    try {
      const { data, error } = await client
        .from('enquiries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      try {
        return JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
      } catch (e) {
        return [];
      }
    }
  },

  async createEnquiry(enquiry) {
    // Public action: Allowed by RLS policy "Public can submit enquiries"
    const client = getSupabase();
    const payload = {
      id: enquiry.id || ('ENQ-' + Math.floor(1000 + Math.random() * 9000)),
      date: enquiry.date ? new Date(enquiry.date).toISOString() : new Date().toISOString(),
      name: enquiry.name,
      contact: enquiry.contact,
      piece: enquiry.piece || 'General Consultation',
      message: enquiry.message || '',
      status: enquiry.status || 'New',
      channel: enquiry.channel || 'web',
      notes: enquiry.notes || ''
    };

    if (client) {
      try {
        const { data, error } = await client
          .from('enquiries')
          .insert(payload);

        if (!error) return { success: true, data };
      } catch (err) {
        console.warn('Supabase createEnquiry notice:', err);
      }
    }

    // Resilient local backup for offline operation
    try {
      const saved = JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
      saved.unshift(payload);
      localStorage.setItem('gj_enquiries', JSON.stringify(saved));
    } catch (e) {}

    return { success: true, fallback: true };
  },

  async updateEnquiryStatus(id, status, notes) {
    const session = await auth.getSession();
    if (!session) return { success: false, error: 'Unauthorized: staff authentication required' };

    const client = getSupabase();
    if (client) {
      try {
        const updateObj = { status };
        if (notes !== undefined) updateObj.notes = notes;
        const { error } = await client
          .from('enquiries')
          .update(updateObj)
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Local storage fallback
    try {
      const enquiries = JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
      const item = enquiries.find(e => e.id === id);
      if (item) {
        item.status = status;
        if (notes !== undefined) item.notes = notes;
        localStorage.setItem('gj_enquiries', JSON.stringify(enquiries));
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // STORE SETTINGS & RATES
  async getStoreSettings() {
    const client = getSupabase();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        bullion_rates: {
          gold24k: data.gold_24k,
          gold22k: data.gold_22k,
          gold18k: data.gold_18k,
          silver925: data.silver_925
        },
        contact_info: {
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          hours: data.hours
        }
      };
    } catch (err) {
      return null;
    }
  },

  async updateStoreSettings(settings) {
    const session = await auth.getSession();
    if (!session) return { success: false, error: 'Unauthorized: staff authentication required' };

    const client = getSupabase();
    if (!client) return { success: false, error: 'Supabase not connected' };

    const payload = {
      id: 'default',
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      hours: settings.hours,
      gold_24k: settings.gold24k,
      gold_22k: settings.gold22k,
      gold_18k: settings.gold18k,
      silver_925: settings.silver925,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await client
        .from('store_settings')
        .upsert(payload);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // BULK CATALOGUE SYNC
  async syncCatalogueToSupabase(productsList) {
    const session = await auth.getSession();
    if (!session) return { success: false, error: 'Unauthorized: staff authentication required' };

    const client = getSupabase();
    if (!client) return { success: false, error: 'Supabase not connected' };

    const payloads = productsList.map(product => ({
      id: product.id,
      title: product.title,
      poetic_descriptor: product.poeticDescriptor || '',
      price_display: product.priceDisplay || 'Price on Request',
      price_amount: product.priceAmount || null,
      primary_category: product.primaryCategory || 'gemstones',
      gemstone: product.gemstone || '',
      metal: product.metal || '',
      type: product.type || 'ring',
      occasion: product.occasion || 'daily',
      featured: Boolean(product.featured),
      is_daily_wear: Boolean(product.isDailyWear),
      image: product.image,
      secondary_image: product.secondaryImage || null,
      badges: product.badges || {},
      specs: product.specs || {},
      narrative: product.narrative || '',
      transparency_note: product.transparencyNote || '',
      astrological_note: product.astrologicalNote || ''
    }));

    try {
      const { error } = await client
        .from('products')
        .upsert(payloads, { onConflict: 'id' });

      if (error) throw error;
      return { success: true, count: payloads.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
