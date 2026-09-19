-- ==============================================================================
-- GULSHAN JEWELLERS | EST. 1950
-- Production Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    poetic_descriptor TEXT,
    price_display TEXT NOT NULL DEFAULT 'Price on Request',
    price_amount NUMERIC,
    primary_category TEXT NOT NULL DEFAULT 'gemstones',
    gemstone TEXT,
    metal TEXT,
    type TEXT DEFAULT 'ring',
    occasion TEXT DEFAULT 'daily',
    featured BOOLEAN DEFAULT false,
    is_daily_wear BOOLEAN DEFAULT false,
    image TEXT NOT NULL,
    secondary_image TEXT,
    badges JSONB DEFAULT '{}'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    narrative TEXT,
    transparency_note TEXT,
    astrological_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for high-performance storefront queries
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(primary_category);
CREATE INDEX IF NOT EXISTS idx_products_gemstone ON public.products(gemstone);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);

-- 2. ENQUIRIES & CONSULTATIONS CRM TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    piece TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'In Discussion', 'Closed'
    channel TEXT DEFAULT 'web',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_date ON public.enquiries(date DESC);

-- 3. BOUTIQUE STORE SETTINGS & BULLION RATES TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    phone TEXT NOT NULL DEFAULT '+91 95828 41454',
    whatsapp TEXT NOT NULL DEFAULT '+91 95828 41454',
    email TEXT NOT NULL DEFAULT 'consult@gulshanjewellers.com',
    hours TEXT NOT NULL DEFAULT 'Monday to Saturday · 11:00 AM – 7:30 PM IST',
    gold_24k TEXT DEFAULT '₹7,650 / gram (999 Purity)',
    gold_22k TEXT DEFAULT '₹7,015 / gram (916 BIS Hallmark)',
    gold_18k TEXT DEFAULT '₹5,740 / gram (750 Fine Gold)',
    silver_925 TEXT DEFAULT '₹92 / gram (925 Sterling Silver)',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read, only authenticated staff can modify
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated staff can manage products" ON public.products;
CREATE POLICY "Authenticated staff can manage products" 
ON public.products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Enquiries: Anyone can submit an enquiry, only authenticated staff can read & manage
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" 
ON public.enquiries FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated staff can manage enquiries" ON public.enquiries;
CREATE POLICY "Authenticated staff can manage enquiries" 
ON public.enquiries FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Store Settings: Everyone can read, only authenticated staff can modify
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings" 
ON public.store_settings FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated staff can update store settings" ON public.store_settings;
CREATE POLICY "Authenticated staff can update store settings" 
ON public.store_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

INSERT INTO public.store_settings (id, phone, whatsapp, email, hours, gold_24k, gold_22k, gold_18k, silver_925)
VALUES ('default', '+91 95828 41454', '+91 95828 41454', 'consult@gulshanjewellers.com', 'Monday to Saturday · 11:00 AM – 7:30 PM IST', '₹7,650 / gram (999 Purity)', '₹7,015 / gram (916 BIS Hallmark)', '₹5,740 / gram (750 Fine Gold)', '₹92 / gram (925 Sterling Silver)')
ON CONFLICT (id) DO UPDATE SET 
    phone = EXCLUDED.phone, 
    whatsapp = EXCLUDED.whatsapp, 
    email = EXCLUDED.email;
