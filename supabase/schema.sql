-- ==============================================================================
-- GULSHAN JEWELLERS | EST. 1950 (NEW DELHI)
-- Production Supabase PostgreSQL Schema, Security Policies & Seed Data
-- Architecture: Next-Gen Headless Luxury Commerce & Atelier Management
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
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
    availability TEXT DEFAULT 'In Stock · Atelier Ready',
    lead_time TEXT,
    dimensions TEXT,
    image TEXT NOT NULL,
    secondary_image TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    badges JSONB DEFAULT '{}'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    return_eligibility TEXT,
    narrative TEXT,
    transparency_note TEXT,
    astrological_note TEXT,
    status TEXT NOT NULL DEFAULT 'published', -- 'published', 'draft', 'archived'
    stock_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(primary_category);
CREATE INDEX IF NOT EXISTS idx_products_gemstone ON public.products(gemstone);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- ------------------------------------------------------------------------------
-- 2. ORDERS TABLE (E-Commerce Commerce Engine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Format: GJ-ORD-2026-XXXX
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping_fee NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'razorpay', -- 'razorpay', 'cod', 'bank_transfer'
    payment_status TEXT NOT NULL DEFAULT 'Paid', -- 'Pending', 'Paid', 'Failed', 'Refunded'
    payment_id TEXT, -- Gateway Reference ID
    fulfillment_status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Packed', 'Shipped', 'Delivered', 'Cancelled'
    tracking_carrier TEXT DEFAULT 'Blue Dart Apex Secured',
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. CONSULTATIONS & ASTROLOGY BOOKINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultations (
    id TEXT PRIMARY KEY, -- Format: GJ-CNS-2026-XXXX
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    slot_date DATE NOT NULL,
    slot_time TEXT NOT NULL,
    birth_date DATE,
    birth_time TIME,
    birth_place TEXT,
    concern TEXT,
    preferred_language TEXT DEFAULT 'Hindi & English',
    payment_status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Pending', 'Confirmed', 'Refunded'
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_slot_date ON public.consultations(slot_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- ------------------------------------------------------------------------------
-- 4. ENQUIRIES & BESPOKE CRM TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id TEXT PRIMARY KEY, -- Format: ENQ-XXXX
    date TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    piece TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'In Discussion', 'Quote Sent', 'Won', 'Closed'
    channel TEXT DEFAULT 'web',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_date ON public.enquiries(date DESC);

-- ------------------------------------------------------------------------------
-- 5. STORE SETTINGS & BULLION RATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    phone TEXT NOT NULL DEFAULT '+91 95828 41454',
    whatsapp TEXT NOT NULL DEFAULT '+91 95828 41454',
    email TEXT NOT NULL DEFAULT 'consult@gulshanjewellers.com',
    address TEXT NOT NULL DEFAULT 'Central Delhi Atelier, New Delhi, India 110001',
    hours TEXT NOT NULL DEFAULT 'Monday to Saturday · 11:00 AM – 7:30 PM IST',
    gold_24k TEXT DEFAULT '₹7,650 / gram (999 Purity)',
    gold_22k TEXT DEFAULT '₹7,015 / gram (916 BIS Hallmark)',
    gold_18k TEXT DEFAULT '₹5,740 / gram (750 Fine Gold)',
    silver_925 TEXT DEFAULT '₹92 / gram (925 Sterling Silver)',
    bullion_rates JSONB DEFAULT '{"gold24k": 7650, "gold22k": 7015, "gold18k": 5740, "silver925": 92}'::jsonb,
    shipping_threshold NUMERIC DEFAULT 10000,
    maintenance_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOGS TABLE (DPDP Act & Administrative Accountability)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    action TEXT NOT NULL, -- 'CREATE_PRODUCT', 'UPDATE_PRICE', 'SHIP_ORDER', 'CHANGE_RATE'
    target_table TEXT NOT NULL,
    record_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated staff can manage products" ON public.products;
CREATE POLICY "Authenticated staff can manage products" 
ON public.products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. ORDERS POLICIES (Public can insert orders, only authenticated staff can view/edit)
DROP POLICY IF EXISTS "Public can create checkout orders" ON public.orders;
CREATE POLICY "Public can create checkout orders" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated staff can manage orders" ON public.orders;
CREATE POLICY "Authenticated staff can manage orders" 
ON public.orders FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. CONSULTATIONS POLICIES (Public can book slots, only authenticated staff can view/edit)
DROP POLICY IF EXISTS "Public can book consultations" ON public.consultations;
CREATE POLICY "Public can book consultations" 
ON public.consultations FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated staff can manage consultations" ON public.consultations;
CREATE POLICY "Authenticated staff can manage consultations" 
ON public.consultations FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. ENQUIRIES POLICIES (Public can submit enquiries, only authenticated staff can view/edit)
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

-- 5. STORE SETTINGS POLICIES (Public can view, authenticated staff can update)
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

-- 6. AUDIT LOGS POLICIES (Authenticated staff only)
DROP POLICY IF EXISTS "Authenticated staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated staff can view audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated staff can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated staff can create audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Store Settings Seed
INSERT INTO public.store_settings (id, phone, whatsapp, email, address, hours, gold_24k, gold_22k, gold_18k, silver_925, bullion_rates, shipping_threshold)
VALUES (
    'default', 
    '+91 95828 41454', 
    '+91 95828 41454', 
    'consult@gulshanjewellers.com', 
    'Central Delhi Atelier, New Delhi, India 110001',
    'Monday to Saturday · 11:00 AM – 7:30 PM IST', 
    '₹7,650 / gram (999 Purity)', 
    '₹7,015 / gram (916 BIS Hallmark)', 
    '₹5,740 / gram (750 Fine Gold)', 
    '₹92 / gram (925 Sterling Silver)',
    '{"gold24k": 7650, "gold22k": 7015, "gold18k": 5740, "silver925": 92}'::jsonb,
    10000
)
ON CONFLICT (id) DO UPDATE SET 
    phone = EXCLUDED.phone, 
    whatsapp = EXCLUDED.whatsapp, 
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    hours = EXCLUDED.hours;

-- 2. Products Catalogue Seed (All 28 verified pieces)

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'pukhraj-cushion-signet-22k',
    'Ceylon Yellow Sapphire (Pukhraj) Signet Ring',
    'Untreated golden fire in solid hand-forged 22K gold—a timeless legacy of Jupiter.',
    'Indicative ₹2,85,000 · Quotation Confirmed on Sizing',
    285000,
    'gemstones',
    'pukhraj',
    '22k-gold',
    'ring',
    'occasion',
    true,
    false,
    'Bespoke Commission · Single Gem Curation',
    'Hand-forged to bespoke finger measurement within 10–14 business days',
    '14.2 mm x 12.8 mm face; 3.8 mm shank base',
    'images/pukhraj-hero.jpg',
    'images/loose-sapphire.jpg',
    '["images/pukhraj-hero.jpg","images/loose-sapphire.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Certificate Available","hallmark":"22K BIS Hallmarked Gold"}'::jsonb,
    '{"gemstoneType":"Natural Yellow Sapphire (Pukhraj / Corundum)","naturalStatus":"100% Earth-Mined Natural","caratWeight":"4.15 carats (approx. 4.56 Pakka Ratti)","treatmentDisclosure":"Completely Unheated, No Thermal or Chemical Treatment","origin":"Ratnapura, Ceylon (Sri Lanka) — Lab Verified","certificate":"Independent Gemological Lab Certificate available upon request","metalPurity":"22K Solid Yellow Gold (916 BIS Hallmarked)","diamondDetails":"None (Solid gold sculpted mount)","sizeLength":"Custom crafted to bespoke ring size (Standard Indian Size 12-24)","customisation":"Available in Panchdhatu, 18K Yellow Gold, or open-back basket setting","careInstructions":"Clean gently using lukewarm soapy water and soft brush. Avoid steam or harsh ultrasonic cleaning on fine jewellery."}'::jsonb,
    'Bespoke Creation: Exchange and lifetime authenticity support with complimentary first resizing.',
    'Selected personally for its pure canary-yellow saturation and crystalline transparency, this Ceylon Pukhraj embodies our heritage ethos. The ring is forged in solid 22K gold by our senior goldsmiths, carved with traditional motifs that frame the cushion facet without concealing its natural luster.',
    'Every gemstone at Gulshan Jewellers is accompanied by a transparent disclosure of natural status and any treatment. We do not use simulated or beryllium-diffused sapphires.',
    'Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'neelam-royal-blue-baguette-18k',
    'Royal Ceylon Blue Sapphire (Neelam) Solitaire Ring',
    'A little blue, a lot of brilliance. Velvety royal corundum flanked by clean tapered diamonds.',
    'Indicative ₹4,20,000 · Quotation Confirmed on Sizing',
    420000,
    'gemstones',
    'neelam',
    '18k-white-gold',
    'ring',
    'occasion',
    true,
    false,
    'Bespoke Commission · Natural Unheated Corundum',
    'Hand-forged to client finger size in 10–14 business days',
    '13.5 mm x 10.2 mm crown; 2.6 mm knife-edge band',
    'images/neelam-sapphire.jpg',
    'images/loose-sapphire.jpg',
    '["images/neelam-sapphire.jpg","images/loose-sapphire.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"IIGJ-Certified Available","hallmark":"18K BIS Hallmarked Gold"}'::jsonb,
    '{"gemstoneType":"Natural Blue Sapphire (Neelam / Corundum)","naturalStatus":"Natural Earth-Mined Corundum","caratWeight":"3.80 carats (approx. 4.18 Pakka Ratti)","treatmentDisclosure":"Completely Natural & Unheated (Tested)","origin":"Ceylon (Sri Lanka) when certified","certificate":"IIGJ / Reputed Testing Lab Report available per stone","metalPurity":"18K White Gold (750 BIS Hallmarked) or Platinum","diamondDetails":"Natural tapered baguette diamonds (VVS-VS, E-F color, 0.28 ctw)","sizeLength":"Hand-sized to client measurement (Indian Sizes 10-22)","customisation":"Can be adapted to 925 sterling silver or 18K yellow gold setting","careInstructions":"Store individually in soft pouch. Wipe with microfiber cloth after wear."}'::jsonb,
    'Bespoke Creation: Exchange and lifetime authenticity support with complimentary first resizing.',
    'Neelam possesses a quiet, commanding presence. We selected this oval specimen for its rich royal blue depth without heavy extinction, pairing it with architectural diamond baguettes that allow the centre stone to remain the focal point.',
    'We never sell lead-glass filled, diffusion-treated, or lab-synthesized sapphires. Full clarity and treatment details are provided prior to purchase.',
    'Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'emerald-colombian-bezel-pendant',
    'Natural Colombian Emerald (Panna) Bezel Pendant',
    'Understated but unmistakable. Vivid green emerald glow embraced in a tailored 18K gold collar.',
    'Indicative ₹1,85,000 · Quotation Confirmed on Chain Selection',
    185000,
    'gemstones',
    'emerald',
    '18k-gold',
    'pendant',
    'daily',
    true,
    true,
    'Atelier Curation · Single Earth-Mined Emerald',
    'Complimentary insured delivery within 5–7 business days',
    '16.0 mm x 11.5 mm bezel pendant; 18-inch chain',
    'images/emerald-pendant.jpg',
    'images/bespoke-workshop.jpg',
    '["images/emerald-pendant.jpg","images/bespoke-workshop.jpg","images/loose-sapphire.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Oiled, disclosed","treatmentStatus":"oiled_disclosed","certification":"Certificate Available","hallmark":"18K BIS Hallmarked Gold"}'::jsonb,
    '{"gemstoneType":"Natural Colombian Beryl (Emerald / Panna)","naturalStatus":"100% Natural Earth-Mined","caratWeight":"2.65 carats","treatmentDisclosure":"Minor Traditional Colorless Cedarwood Oil (Standard industry practice; polymer/resin-free)","origin":"Muzo / Chivor Basin, Colombia (Verified)","certificate":"Accredited Gemological Laboratory Certificate available","metalPurity":"18K Yellow Gold (750 BIS Hallmarked)","diamondDetails":"None (Clean gold frame)","sizeLength":"18-inch delicate wheat link chain in 18K gold included","customisation":"Can be adapted with a diamond bail or in 22K gold","careInstructions":"Avoid soaking emeralds or exposure to harsh detergents, perfumes, and sudden temperature shifts."}'::jsonb,
    'Atelier Piece: 15-day exchange and inspection guarantee with original certification.',
    'This Colombian emerald features an enchanting natural ''jardin'' that captures morning light. Encased in a smooth, knife-edge bezel, it is designed for the modern collector who wears fine gemstones not just on occasions, but as an everyday signature.',
    'Emeralds are inherently included stones. We disclose the exact level of clarity enhancement and strictly forbid synthetic resins or green dye infusions.',
    'Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'ruby-mozambique-solitaire-18k',
    'Natural Mozambique Ruby (Manik) Solitaire Ring',
    'A story you wear. Fiery crimson ruby brilliance in a classic four-prong gold architecture.',
    'Indicative ₹3,10,000 · Quotation Confirmed on Sizing',
    310000,
    'gemstones',
    'ruby',
    '18k-gold',
    'ring',
    'occasion',
    true,
    false,
    'Bespoke Commission · Untreated Earth-Mined Ruby',
    'Handcrafted to finger size in 10–14 business days',
    '11.8 mm x 9.6 mm crown; 2.8 mm shank',
    'images/ruby-solitaire.jpg',
    'images/bespoke-workshop.jpg',
    '["images/ruby-solitaire.jpg","images/bespoke-workshop.jpg","images/gold-solitaire.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Certificate Available","hallmark":"18K BIS Hallmarked Gold"}'::jsonb,
    '{"gemstoneType":"Natural Corundum (Ruby / Manik)","naturalStatus":"Natural Earth-Mined Ruby","caratWeight":"2.40 carats","treatmentDisclosure":"Completely Unheated / No Additives","origin":"Montepuez, Mozambique (Verified)","certificate":"Reputed Gem Lab Certificate supplied","metalPurity":"18K Solid Yellow Gold (750 Hallmarked)","diamondDetails":"None (Pure solitaire profile)","sizeLength":"Bespoke sizing provided at consultation (Indian Sizes 10-24)","customisation":"Available in 22K yellow gold or with a pavé diamond band","careInstructions":"Clean with warm water and mild soap. Buff with jewelry polishing cloth."}'::jsonb,
    'Bespoke Creation: Exchange and lifetime authenticity support with complimentary first resizing.',
    'Revered across Indian heritage as the gem of the Sun (Surya), this Mozambique ruby offers an intense pigeon-blood red tone. Its faceted pavilion reflects light with a warm inner fire, balanced on a tapered knife-edge 18K band.',
    'Commercial markets often flood with composite glass-filled rubies. At Gulshan Jewellers, we strictly work with earth-mined, genuine rubies with certified treatment disclosure.',
    'Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'kyanite-artisan-silver-ring',
    'Natural Blue Kyanite Artisan Silver Ring',
    'Considered, authentic resonance. Natural pleochroic blue gemstone in hand-bezelled 925 silver.',
    '₹18,500',
    18500,
    'silver',
    'kyanite',
    '925-silver',
    'ring',
    'daily',
    true,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '15.0 mm x 10.0 mm oval bezel; 3.0 mm band',
    'images/kyanite-silver.jpg',
    'images/silver-bangle.jpg',
    '["images/kyanite-silver.jpg","images/silver-bangle.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Natural Gemstone Certificate","hallmark":"925 Sterling Silver"}'::jsonb,
    '{"gemstoneType":"Natural Blue Kyanite","naturalStatus":"100% Earth-Mined Natural","caratWeight":"5.50 carats","treatmentDisclosure":"Completely Untreated (No heating or dyeing)","origin":"Himalayan Belt / Nepal","certificate":"In-house Authenticity Card & Lab Option Available","metalPurity":"925 Solid Sterling Silver (Hallmarked)","diamondDetails":"None","sizeLength":"Available in Indian Sizes 12, 14, 16, 18, 20 (Custom size on request)","customisation":"Available in open-basket ring or pendant mount","careInstructions":"Kyanite has directional cleavage; protect against sharp impact. Store separately."}'::jsonb,
    '15-Day Inspection Period: Complimentary return or exchange with insured return courier.',
    'For clients seeking Saturn alignment or the hypnotic beauty of deep blue without the significant expenditure of an untreated Ceylon sapphire, Blue Kyanite is our master recommendation. Set in textured, hand-burnished 925 sterling silver, this ring makes thoughtful gemstone alignment attainable with dignity.',
    'We never promote synthetic substitutes under misleading names. Kyanite is a genuine, unheated natural mineral celebrated in traditional Up-ratna wisdom.',
    'Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'everyday-diamond-huggie-earrings-14k',
    'Everyday Natural Diamond Huggie Earrings (14K)',
    'Some jewellery waits for an occasion; these don''t. Effortless brilliance for every sunrise.',
    '₹48,000',
    48000,
    'diamonds',
    'diamond',
    '14k-gold',
    'earrings',
    'daily',
    true,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '12.0 mm outer diameter; 1.8 mm width',
    'images/everyday-diamonds.jpg',
    'images/gold-solitaire.jpg',
    '["images/everyday-diamonds.jpg","images/gold-solitaire.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Diamond Certification Available","hallmark":"14K BIS Hallmarked"}'::jsonb,
    '{"gemstoneType":"Natural Earth-Mined Diamonds","naturalStatus":"100% Natural (Not Lab-Grown)","caratWeight":"0.36 ctw (Total Weight for Pair)","treatmentDisclosure":"Completely Natural & Untreated","origin":"Ethically Sourced Conflict-Free","certificate":"Jewellery House Diamond Authenticity Card (IGI Available)","metalPurity":"14K Yellow Gold (585 BIS Hallmarked)","diamondDetails":"Round Brilliant cut, GH Color, SI1-SI2 Eye-Clean clarity","sizeLength":"12 mm outer diameter, secure click-latch closure","customisation":"Also available in 14K Rose Gold or 18K White Gold","careInstructions":"Safe for daily shower and sleep. Periodically clean with warm soapy water."}'::jsonb,
    '15-Day Returnable: Unworn with tamper tag intact. Lifetime cleaning support.',
    'Designed to sleep in, shower in, and live in. These huggie hoops feature micro-pavé hand-set natural diamonds engineered with a smooth hinge and low-profile latch that never snags.',
    'Gulshan Jewellers certifies all natural diamond pieces. We clearly distinguish between earth-mined diamonds and lab-created stones in our documentation.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'minimalist-diamond-solitaire-pendant',
    'Minimalist Bezel Diamond Pendant',
    'From workshop to your heart. A single drop of earth-mined brilliance for daily signature wear.',
    '₹62,000',
    62000,
    'diamonds',
    'diamond',
    '18k-gold',
    'pendant',
    'daily',
    true,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '6.2 mm bezel outer diameter; 18-inch adjustable chain',
    'images/everyday-diamonds.jpg',
    'images/emerald-pendant.jpg',
    '["images/everyday-diamonds.jpg","images/emerald-pendant.jpg","images/gold-solitaire.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Diamond Certificate Available","hallmark":"18K BIS Hallmarked"}'::jsonb,
    '{"gemstoneType":"Natural Solitaire Diamond","naturalStatus":"Natural Earth-Mined Diamond","caratWeight":"0.30 ct (Standard Curation)","treatmentDisclosure":"Untreated Natural Diamond","origin":"Kimberley Process Compliant","certificate":"Diamond Specification Card provided","metalPurity":"18K Solid Gold (750 BIS Hallmarked)","diamondDetails":"Round Brilliant Cut, F-G Color, VS Clarity","sizeLength":"Adjustable 16 to 18-inch fine cable chain","customisation":"Choice of metal purity (14K, 18K) and yellow, white, or rose finish","careInstructions":"Keep away from harsh bleaches. Polish with lint-free soft cloth."}'::jsonb,
    '15-Day Returnable: Unworn with security tag attached.',
    'A modern heirloom stripped of unnecessary ornament. The hand-burnished bezel holds the diamond securely without prongs, maximizing sparkle while sitting flush against the collarbone.',
    'We offer this design across 14K and 18K gold tiers, enabling you to choose the exact balance of gold weight and diamond size that fits your budget.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'handcrafted-18k-gold-solitaire-ring',
    'Handcrafted 18K Gold Solitaire Ring',
    'Sculpted by hand with quiet proportion. A modern knife-edge silhouette with timeless presence.',
    'From ₹1,25,000 · Tailored to Diamond Selection',
    125000,
    'gold',
    'diamond',
    '18k-gold',
    'ring',
    'occasion',
    true,
    true,
    'Made to Order · Bespoke Sizing',
    'Individually hand-forged in 10–12 business days',
    '7.5 mm semi-bezel cup; 2.2 mm knife-edge shank',
    'images/gold-solitaire.jpg',
    'images/bespoke-workshop.jpg',
    '["images/gold-solitaire.jpg","images/bespoke-workshop.jpg","images/everyday-diamonds.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Certificate Available","hallmark":"18K BIS Hallmarked"}'::jsonb,
    '{"gemstoneType":"Natural Diamond Solitaire","naturalStatus":"Earth-Mined Natural Diamond","caratWeight":"0.75 ct (Customizable 0.50 - 1.50 ct)","treatmentDisclosure":"Untreated","origin":"Ethically Sourced","certificate":"IGI / GIA Certificate on request","metalPurity":"18K Yellow Gold (750 BIS Hallmarked)","diamondDetails":"Round Brilliant, Excellent Cut, F-G Color, VVS-VS Clarity","sizeLength":"Made to exact finger measurement (Indian Sizes 10-24)","customisation":"Also forged in Platinum or 18K Rose Gold","careInstructions":"Complimentary lifetime cleaning and prong inspection at our atelier."}'::jsonb,
    'Custom Order: Exchange and resizing support. Lifetime authenticity guarantee.',
    'Forged by hand on the anvil, this ring marries ancient Indian gold purity with sleek mid-century architectural geometry. The semi-bezel cup cradles the stone securely while letting light dance across its facets.',
    'All gold purity is certified through government-approved BIS hallmarking centers. No alloy ambiguity.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'silver-chiseled-cuff-bangle',
    'Hand-Chiseled Sterling Silver Fluted Cuff',
    'Raw texture meets sculptural dignity. Heavy solid 925 silver with oxidized hand fluting.',
    '₹24,500',
    24500,
    'silver',
    'none',
    '925-silver',
    'bangles',
    'daily',
    true,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '14 mm band width; 65 mm inner diameter (flexible open fit)',
    'images/silver-bangle.jpg',
    'images/kyanite-silver.jpg',
    '["images/silver-bangle.jpg","images/kyanite-silver.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":false,"treatment":null,"certification":"Silver Purity Guarantee","hallmark":"925 Handcrafted Sterling"}'::jsonb,
    '{"gemstoneType":"Solid Silver (Unset)","naturalStatus":"N/A","caratWeight":"Approx. 42 grams solid silver weight","treatmentDisclosure":"Natural hand-applied dark patina oxidation","origin":"Indian Artisan Hand-Forged","certificate":"925 Sterling Silver Stamp & Authenticity guarantee","metalPurity":"Solid 92.5% Sterling Silver","diamondDetails":"None","sizeLength":"Slightly malleable open cuff fit (wrist sizes 6.0 - 7.5 in)","customisation":"Custom engraving available inside band","careInstructions":"Avoid chlorine and silver dips that strip hand-oxidized patina. Buff highlights with dry cloth."}'::jsonb,
    '15-Day Returnable: Unworn in original velvet pouch.',
    'Each fluted ridge on this cuff is hand-chiselled with traditional steel chisels, giving it an organic tactile cadence that catches the light like running water. Subtly oxidized to highlight depth.',
    'Solid sterling silver throughout, never silver-plated brass or pot metal. Tested and stamped with the authentic 925 mark.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'mens-silver-signet-ring',
    'Men''s Sterling Silver Classic Signet Ring',
    'Understated but unmistakable. Smooth solid silver face with a substantial comfortable shank.',
    '₹14,500',
    14500,
    'silver',
    'none',
    '925-silver',
    'men',
    'daily',
    false,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '14 mm x 12 mm signet table; 4.5 mm tapered shank',
    'images/silver-bangle.jpg',
    'images/bespoke-workshop.jpg',
    '["images/silver-bangle.jpg","images/bespoke-workshop.jpg","images/kyanite-silver.jpg"]'::jsonb,
    '{"natural":false,"treatment":null,"certification":"Silver Purity Guarantee","hallmark":"925 Sterling Silver"}'::jsonb,
    '{"gemstoneType":"Unset (Blank for Monogram or Family Crest)","naturalStatus":"N/A","caratWeight":"Approx. 14 grams solid silver","treatmentDisclosure":"Hand-Polished High-Lustre Finish","origin":"Handmade in India","certificate":"925 Sterling Hallmark","metalPurity":"925 Sterling Silver","diamondDetails":"None","sizeLength":"Available in Men''s sizes 18 to 26","customisation":"Bespoke monogram hand-engraving available","careInstructions":"Store in airtight pouch when not worn to prevent natural silver tarnishing."}'::jsonb,
    '15-Day Returnable: Standard non-engraved pieces.',
    'A masculine staple designed for everyday wear. Substantial in weight yet contoured for all-day comfort, perfect for solitary wear or personalized monogramming.',
    'Solid 925 silver casting with no hollow voids inside the shank for lasting durability.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'raksha-bandhan-silver-keepsake',
    'Raksha Bandhan Heritage Silver Keepsake Pendant',
    'A talisman of protection and lifelong bonds. Forged in pure 925 sterling silver.',
    '₹16,500',
    16500,
    'silver',
    'none',
    '925-silver',
    'gifts',
    'gifting',
    false,
    true,
    'In Stock · Ready to Ship',
    'Dispatched in 24–48 hours · Delivery in 3–5 business days',
    '22 mm circular talisman; 18-inch chain included',
    'images/silver-bangle.jpg',
    'images/everyday-diamonds.jpg',
    '["images/silver-bangle.jpg","images/everyday-diamonds.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":false,"treatment":null,"certification":"Gift Presentation Box Included","hallmark":"925 Sterling Silver"}'::jsonb,
    '{"gemstoneType":"Solid Silver Keepsake","naturalStatus":"N/A","caratWeight":"Approx. 9 grams","treatmentDisclosure":"Mirror-buffed finish","origin":"Handmade in India","certificate":"Gulshan Jewellers Gift Heritage Card","metalPurity":"925 Sterling Silver","diamondDetails":"None","sizeLength":"Pendant with black silk cord or silver chain option","customisation":"Custom reverse-side initial engraving","careInstructions":"Clean with soft cloth. Avoid direct contact with perfumes."}'::jsonb,
    '15-Day Returnable: Unengraved gift pieces in original presentation box.',
    'Designed specifically for sibling gifting and Raksha Bandhan, this keepsake transitions beyond seasonal rituals into a piece that can be cherished as a daily pendant or bracelet talisman.',
    'Delivered in our signature midnight presentation box with an authenticity certificate.',
    NULL,
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-kundan-polki-choker',
    'Heritage Kundan Polki Choker & Earring Set',
    'Regal Rajputana grandeur crafted in brass with faux uncut polki crystals and emerald-green drops.',
    '₹4,850 · Tax Included',
    4850,
    'artificial',
    'none',
    'brass',
    'choker',
    'wedding',
    true,
    false,
    'Ready to Dispatch · Complimentary Insured Courier',
    'Dispatches within 24–48 hours from New Delhi atelier',
    'Necklace width 38 mm; Earring length 62 mm',
    'images/art-kundan-necklace.jpg',
    'images/art-kundan-necklace.jpg',
    '["images/art-kundan-necklace.jpg","images/art-chandbali-earrings.jpg","images/art-bangle-set.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Synthetic Glass-Kundan","treatmentStatus":"synthetic","certification":"Atelier Quality Verified","hallmark":"Fashion / Imitation (Alloy Mount)"}'::jsonb,
    '{"gemstoneType":"Faux Uncut Polki Glass Crystals & Emerald Green Hydro Beads","naturalStatus":"Fashion / Imitation Jewellery (Non-precious)","caratWeight":"N/A (Costume Jewellery)","treatmentDisclosure":"Glass-Kundan Foil setting with anti-tarnish protective sealant","origin":"Handcrafted in Jaipur & Delhi Artisan Clusters","certificate":"Gulshan Jewellers Quality & Anti-Tarnish Assurance Card","metalPurity":"Lead-Free Brass Alloy with 1-Micron 24K Yellow Gold Finish","diamondDetails":"None (High-Reflectance Kundan Foil Stones)","sizeLength":"Adjustable embroidered zari cord (fits all neck circumferences)","customisation":"Fixed design; dori colour adjustments available upon enquiry","careInstructions":"Keep away from moisture, perfumes, and hairsprays. Store in airtight ziplock pouch provided."}'::jsonb,
    '15-Day Exchange & Inspection Guarantee in original protective packaging.',
    'Designed for grand celebrations without the security concerns of fine jewellery travel, this Kundan Polki choker captures the opulent geometry of traditional Mughal and Rajput court ornaments. Hand-set by seasoned imitation artisans on a skin-safe brass framework.',
    'Gulshan Jewellers strictly discloses all artificial jewellery. This piece contains non-precious brass alloy, synthetic glass stones, and electroplated finish. It does not contain gold, natural emeralds, or BIS hallmarking.',
    'This creation is purely aesthetic fashion jewellery and carries no Vedic astrological recommendation.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-meenakari-chandbali-earrings',
    'Hand-Painted Meenakari Chandbali Statement Earrings',
    'Lyrical crescent chandbalis adorned with cloisonné enamel, faux seed pearls, and glass stones.',
    '₹2,450 · Tax Included',
    2450,
    'artificial',
    'none',
    'brass',
    'earrings',
    'festive',
    true,
    false,
    'Ready to Ship',
    'Ships in 24 hours',
    'Length: 75 mm; Width: 48 mm; Weight: 26g per pair',
    'images/art-chandbali-earrings.jpg',
    'images/art-chandbali-earrings.jpg',
    '["images/art-chandbali-earrings.jpg","images/art-kundan-necklace.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Enamel / Faux Pearl","treatmentStatus":"synthetic","certification":"Hypoallergenic Tested","hallmark":"Imitation Jewellery (Brass Mount)"}'::jsonb,
    '{"gemstoneType":"Faux Shell Pearls, Glass Cabochons, Enamel Colors","naturalStatus":"Fashion / Imitation (Alloy Mount)","caratWeight":"N/A","treatmentDisclosure":"Kiln-cured cloisonné enamel on brass framework","origin":"Crafted in Delhi NCR Atelier Network","certificate":"Quality Inspection Card","metalPurity":"Hypoallergenic Brass Alloy (Nickel & Lead Free)","diamondDetails":"None","sizeLength":"75 mm drop","customisation":"Standard push-back fitting with silicone comfort cushions","careInstructions":"Avoid water contact. Clean with dry lint-free cloth."}'::jsonb,
    '15-Day Inspection & Exchange in sealed packaging.',
    'The crescent chandbali is an enduring motif of royal North Indian evening wear. This pair celebrates vibrant jade-green and ivory enamel paired with delicate seed-pearl clusters.',
    'Disclosed as costume imitation jewellery. Does not contain natural pearls or precious gold.',
    'Purely fashion accessory.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-enamel-bangle-set-rajputi',
    'Rajputi Enamel (Meenakari) Kada Bangle Set (Set of 6)',
    'Vibrant floral meenakari kadas banded with micro-gold lustre—a celebration of royal festive wrists.',
    '₹3,600 · Tax Included',
    3600,
    'artificial',
    'none',
    'brass',
    'bangles',
    'festive',
    true,
    false,
    'In Stock · Multiple Sizes (2.4, 2.6, 2.8)',
    'Ships in 24–48 hours',
    'Sizes available: 2.4 (57.2mm), 2.6 (60.3mm), 2.8 (63.5mm)',
    'images/art-bangle-set.jpg',
    'images/art-bangle-set.jpg',
    '["images/art-bangle-set.jpg","images/art-chandbali-earrings.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Enamel Inlay","treatmentStatus":"synthetic","certification":"Anti-Tarnish Sealed","hallmark":"Fashion / Imitation (Brass Mount)"}'::jsonb,
    '{"gemstoneType":"Multi-Color Cloisonné Floral Enamel Inlay","naturalStatus":"Fashion / Imitation Alloy","caratWeight":"N/A","treatmentDisclosure":"E-coated lacquer over micron gold plating for tarnish resistance","origin":"Jaipur Artisan Cluster","certificate":"Gulshan Jewellers Quality Assured","metalPurity":"High-Grade Eco Brass Alloy","diamondDetails":"Micro Cubic Zirconia accents","sizeLength":"Standard Indian Bangle Sizes 2.4, 2.6, 2.8","customisation":"Choose size at checkout","careInstructions":"Wipe with dry microfiber cloth. Avoid soaps and lotions."}'::jsonb,
    '15-Day Exchange with complimentary size swap.',
    'These bangles echo the heritage enamelling techniques of Rajasthan court jewellery. Finished with durable protective lacquer to safeguard their radiant colors.',
    'Fashion jewellery piece. Contains no gold hallmark or solid gold content.',
    'Purely fashion jewellery.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-temple-matte-collar-necklace',
    'South Indian Temple Motif Matte Collar Necklace',
    'Traditional Lakshmi and peacock motifs finished in warm antique reddish-gold matte texture.',
    '₹5,200 · Tax Included',
    5200,
    'artificial',
    'none',
    'copper',
    'necklace',
    'wedding',
    false,
    false,
    'Ready to Dispatch',
    'Ships within 24–48 hours',
    'Collar span: 180 mm; Central pendant drop: 45 mm',
    'images/art-kundan-necklace.jpg',
    'images/art-chandbali-earrings.jpg',
    '["images/art-kundan-necklace.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Antique Matte Finish","treatmentStatus":"synthetic","certification":"Quality Tested","hallmark":"Imitation Jewellery (Copper Alloy)"}'::jsonb,
    '{"gemstoneType":"Faux Kempu Ruby Cabochons & Synthetic Pearls","naturalStatus":"Fashion / Costume Jewellery","caratWeight":"N/A","treatmentDisclosure":"Antique matte reddish-gold immersion finish","origin":"Traditional Southern Artisan Studio","certificate":"Quality Verification Tag","metalPurity":"Solid Copper-Brass Base Alloy","diamondDetails":"None","sizeLength":"Adjustable back-rope dori","customisation":"Fixed model","careInstructions":"Store flat in dry conditions."}'::jsonb,
    '15-Day Exchange Support.',
    'Capturing the architectural grace of Chola and Vijayanagara temple jewellery, this collar necklace features sculpted auspicious motifs with a velvety antique matte finish.',
    'Costume temple jewellery. Not 22K gold.',
    'Traditional devotional motif; non-prescriptive.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-cz-solitaire-choker-rhodium',
    'Modern American Diamond (CZ) Tennis Choker',
    'Precision-cut cubic zirconia solitaires set in platinum-tone rhodium for high-wattage red carpet glam.',
    '₹3,950 · Tax Included',
    3950,
    'artificial',
    'none',
    'brass',
    'choker',
    'party',
    false,
    false,
    'In Stock · Ready to Ship',
    'Ships in 24 hours',
    'Length: 16 inches + 2-inch extender chain; Stone size: 4 mm round',
    'images/everyday-diamonds.jpg',
    'images/everyday-diamonds.jpg',
    '["images/everyday-diamonds.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Cubic Zirconia (CZ)","treatmentStatus":"synthetic","certification":"Brilliance Certified","hallmark":"Fashion / Imitation (Rhodium Alloy)"}'::jsonb,
    '{"gemstoneType":"5A Grade Machine-Cut Cubic Zirconia","naturalStatus":"Lab-Synthesized Diamond Simulant","caratWeight":"Equivalent approx. 18.0 ctw visual diamond look","treatmentDisclosure":"Triple Rhodium immersion plating for mirror platinum shine","origin":"Precision Crafted in Specialised Workshop","certificate":"Anti-Tarnish Assurance Card","metalPurity":"Brass Alloy with Premium Rhodium Finish","diamondDetails":"Faux Diamond (CZ Simulant)","sizeLength":"16 inches + 2 inches extender","customisation":"Available in Yellow Gold or Rose Gold finish upon order","careInstructions":"Wipe with dry microfiber lens cloth after use."}'::jsonb,
    '15-Day Exchange Guarantee.',
    'Clean, architectural, and effortlessly radiant. Each stone is individually four-prong mounted to reflect maximum ambient light.',
    'Contains cubic zirconia diamond simulants and base metal. Not mined diamonds.',
    'Purely fashion jewellery.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-oxidised-boho-hasli-necklace',
    'Tribal Chiseled Oxidised German Silver Hasli',
    'Rustic bohemian neckpiece featuring geometric tribal stampings and soft chiming ghungroo charms.',
    '₹2,200 · Tax Included',
    2200,
    'artificial',
    'none',
    'german-silver',
    'necklace',
    'daily',
    false,
    true,
    'Ready to Dispatch',
    'Ships in 24 hours',
    'Inner diameter: 125 mm; Torq thickness: 8 mm',
    'images/kyanite-silver.jpg',
    'images/silver-bangle.jpg',
    '["images/kyanite-silver.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Oxidised Antique Finish","treatmentStatus":"synthetic","certification":"Skin-Safe Certified","hallmark":"Fashion / Imitation (German Silver Alloy)"}'::jsonb,
    '{"gemstoneType":"None (Carved metal reliefs)","naturalStatus":"Fashion / Non-Precious Alloy","caratWeight":"N/A","treatmentDisclosure":"Manual oxidation and relief polishing","origin":"Artisan Silversmiths Cluster","certificate":"Hypoallergenic Verification","metalPurity":"German Silver (Copper-Nickel-Zinc alloy; Lead free)","diamondDetails":"None","sizeLength":"Free size flexible torque collar","customisation":"Fixed structure","careInstructions":"Do not use chemical silver dips. Clean with dry cloth."}'::jsonb,
    '15-Day Exchange Guarantee.',
    'A contemporary ode to nomad tribal jewellery of Western India. Perfectly pairs with handloom linens, kurtas, and layered streetwear.',
    'German Silver is a traditional alloy name and contains no 925 sterling silver.',
    'Purely fashion accessory.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-cz-eternity-bangles-pair',
    'American Diamond Dual-Tone Eternity Bangles (Pair)',
    'Classic channel-set CZ eternity bangles blending warm gold accents with cool platinum tones.',
    '₹2,850 · Tax Included',
    2850,
    'artificial',
    'none',
    'brass',
    'bangles',
    'daily',
    false,
    true,
    'Available in Sizes 2.4, 2.6, 2.8',
    'Ships in 24–48 hours',
    'Width: 5 mm; Sizes: 2.4, 2.6, 2.8',
    'images/art-bangle-set.jpg',
    'images/silver-bangle.jpg',
    '["images/art-bangle-set.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Cubic Zirconia","treatmentStatus":"synthetic","certification":"Quality Assured","hallmark":"Fashion / Imitation (Brass Mount)"}'::jsonb,
    '{"gemstoneType":"Round Brilliant Cut Cubic Zirconia","naturalStatus":"Fashion / Imitation Jewellery","caratWeight":"N/A","treatmentDisclosure":"Dual micron electroplating with protective lacquer","origin":"Crafted in Precision Workshop","certificate":"Quality Verification Tag","metalPurity":"Brass Alloy Base","diamondDetails":"Simulated CZ stones","sizeLength":"Indian Sizes 2.4, 2.6, 2.8","customisation":"Select size at purchase","careInstructions":"Store in soft pouch away from cosmetics."}'::jsonb,
    '15-Day Size Exchange Support.',
    'Understated sparkle designed for daily elegance. Seamlessly stacks beside a luxury wristwatch or traditional bangles.',
    'Fashion jewellery piece. Contains no natural diamonds or solid gold.',
    'Purely fashion jewellery.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-pearl-layered-rani-haar',
    'Layered Hyderabadi Faux Pearl Rani Haar Necklace',
    'Seven flowing strands of graduated faux pearls anchored by an intricate Kundan centre pendant.',
    '₹4,400 · Tax Included',
    4400,
    'artificial',
    'none',
    'brass',
    'necklace',
    'wedding',
    false,
    false,
    'Ready to Dispatch',
    'Ships in 24–48 hours',
    'Length: 24 inches + adjustable dori; Pendant: 55 mm x 42 mm',
    'images/art-kundan-necklace.jpg',
    'images/art-chandbali-earrings.jpg',
    '["images/art-kundan-necklace.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Faux Pearl / Kundan","treatmentStatus":"synthetic","certification":"Atelier Verified","hallmark":"Fashion / Imitation (Alloy Mount)"}'::jsonb,
    '{"gemstoneType":"Multi-Row Glass Cultured Pearls & Kundan Stones","naturalStatus":"Costume Jewellery","caratWeight":"N/A","treatmentDisclosure":"Lacquered glass pearl core","origin":"Artisan Workshop Delhi NCR","certificate":"Quality Tag","metalPurity":"Brass Alloy with 22K Gold Tone Electroplate","diamondDetails":"None","sizeLength":"24 inches long","customisation":"Fixed strand count","careInstructions":"Keep flat; avoid folding string strands."}'::jsonb,
    '15-Day Exchange Guarantee.',
    'A dramatic bridal layering piece that evokes the grandeur of Hyderabadi royalty without the weight or insurance demands of heirloom pieces.',
    'Simulated glass pearls and alloy mount.',
    'Purely fashion jewellery.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-jadau-floral-jhumki',
    'Kundan Jadau Floral Bell Jhumkis with Pearl Fringes',
    'Classic bell-shaped jhumkas dripping with micro pearls and petal-shaped glass Kundan stones.',
    '₹2,650 · Tax Included',
    2650,
    'artificial',
    'none',
    'brass',
    'earrings',
    'festive',
    false,
    false,
    'In Stock · Ships Immediately',
    'Ships in 24 hours',
    'Drop length: 65 mm; Bell diameter: 28 mm',
    'images/art-chandbali-earrings.jpg',
    'images/art-kundan-necklace.jpg',
    '["images/art-chandbali-earrings.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Kundan & Enamel","treatmentStatus":"synthetic","certification":"Quality Tested","hallmark":"Imitation Jewellery (Brass Mount)"}'::jsonb,
    '{"gemstoneType":"Faceted Glass Kundan, Meenakari Enamel, Faux Seed Pearls","naturalStatus":"Fashion / Imitation","caratWeight":"N/A","treatmentDisclosure":"Hand-set glass crystals on antiqued gold wash mount","origin":"Jaipur Artisan Guild","certificate":"Quality Assurance Tag","metalPurity":"Brass Alloy Mount","diamondDetails":"None","sizeLength":"65 mm drop","customisation":"Standard push-back mechanism","careInstructions":"Keep in dry container; avoid damp atmospheres."}'::jsonb,
    '15-Day Exchange Support.',
    'The quintessential Indian festive silhouette. Crafted light enough for hours of sangeet dancing while maintaining royal presence.',
    'Costume imitation piece. Contains no hallmarked gold.',
    'Purely fashion accessory.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-sheeshpatti-mathapatti-bridal',
    'Artisan Rajputi Sheeshpatti Mathapatti Headpiece',
    'Handcrafted traditional bridal headpiece set with brilliant glass stones and green bead hangings.',
    '₹3,800 · Tax Included',
    3800,
    'artificial',
    'none',
    'brass',
    'accessories',
    'wedding',
    false,
    false,
    'Ready to Dispatch',
    'Ships in 24–48 hours',
    'Total band length: 280 mm; Central tikka drop: 40 mm',
    'images/art-kundan-necklace.jpg',
    'images/art-chandbali-earrings.jpg',
    '["images/art-kundan-necklace.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Glass Kundan","treatmentStatus":"synthetic","certification":"Quality Assured","hallmark":"Fashion / Imitation (Alloy Mount)"}'::jsonb,
    '{"gemstoneType":"Uncut Look Glass Kundan & Synthetic Green Fluorite Drops","naturalStatus":"Fashion Costume Jewellery","caratWeight":"N/A","treatmentDisclosure":"Flexible brass mesh with gold electroplating","origin":"Rajasthan Traditional Workshop","certificate":"Quality Tag","metalPurity":"Flexible Brass Alloy","diamondDetails":"None","sizeLength":"Universal flexible head contour","customisation":"Fixed design with hair-attachment loops","careInstructions":"Store flat to prevent bending links."}'::jsonb,
    '15-Day Exchange Guarantee.',
    'Framing the hairline with old-world Mewar majesty, this sheeshpatti delivers statement bridal presence with featherlight wearability.',
    'Costume headpiece. Disclosed as artificial imitation alloy.',
    'Purely decorative bridal accessory.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-geometric-brass-statement-cuff',
    'Architectural Handcrafted Brass Open Cuff',
    'Minimalist sculptural cuff with hand-beaten facets in warm satin gold finish.',
    '₹1,850 · Tax Included',
    1850,
    'artificial',
    'none',
    'brass',
    'bangles',
    'daily',
    false,
    true,
    'In Stock · Ready to Ship',
    'Ships in 24 hours',
    'Band width: 18 mm; Inner diameter: 60 mm (Adjustable)',
    'images/silver-bangle.jpg',
    'images/art-bangle-set.jpg',
    '["images/silver-bangle.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Satin Lacquer","treatmentStatus":"synthetic","certification":"Anti-Tarnish Certified","hallmark":"Fashion / Imitation (Solid Eco-Brass)"}'::jsonb,
    '{"gemstoneType":"None (Sculptural metalwork)","naturalStatus":"Fashion / Non-Precious Metal","caratWeight":"N/A","treatmentDisclosure":"Anti-tarnish polymer coating over brass","origin":"Contemporary Delhi Design Studio","certificate":"Quality Verification Tag","metalPurity":"Solid Eco-Brass (Lead & Nickel Free)","diamondDetails":"None","sizeLength":"Adjustable open-cuff format","customisation":"Gently squeeze to adjust fit","careInstructions":"Avoid wearing while swimming or spraying chemicals."}'::jsonb,
    '15-Day Exchange Support.',
    'Clean, sculptural, and unapologetically modern. A versatile day-to-night wrist accessory designed for the modern lifestyle.',
    'Solid brass fashion cuff. Does not contain gold hallmarking.',
    'Purely aesthetic fashion piece.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'art-rose-gold-cz-cocktail-ring',
    'Rose Gold American Diamond Cluster Cocktail Ring',
    'A starburst cluster of brilliant marquise and round cubic zirconia in modern blush rose-gold tone.',
    '₹1,950 · Tax Included',
    1950,
    'artificial',
    'none',
    'copper',
    'ring',
    'party',
    false,
    true,
    'In Stock · Immediate Dispatch',
    'Ships in 24 hours',
    'Crown diameter: 22 mm; Adjustable shank',
    'images/gold-solitaire.jpg',
    'images/everyday-diamonds.jpg',
    '["images/gold-solitaire.jpg"]'::jsonb,
    '{"natural":false,"treatment":"Cubic Zirconia (CZ)","treatmentStatus":"synthetic","certification":"Quality Assured","hallmark":"Fashion / Imitation (Copper Alloy)"}'::jsonb,
    '{"gemstoneType":"5A Marquise and Round Brilliant Cubic Zirconia","naturalStatus":"Lab-Synthesized Diamond Simulant","caratWeight":"N/A (Visual 3.5 ct cluster equivalent)","treatmentDisclosure":"18K Rose Gold Flash Plating with E-coat","origin":"Artisan Workshop","certificate":"Quality Assurance Card","metalPurity":"Copper-Brass Alloy Base","diamondDetails":"Simulated diamond stones","sizeLength":"Adjustable finger ring (fits sizes 10–22)","customisation":"Adjustable band","careInstructions":"Wipe with dry cloth; avoid contact with sanitisers."}'::jsonb,
    '15-Day Exchange Guarantee.',
    'High-sparkle cocktail ring engineered for evening galas, festive brunches, and celebratory dinners.',
    'Fashion jewellery piece. Contains cubic zirconia and alloy base. Not gold or natural diamonds.',
    'Purely fashion jewellery.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'loose-ceylon-pukhraj-422',
    'Unheated Ceylon Yellow Sapphire (Pukhraj) 4.22 ct Loose Gemstone',
    'Vivid canary-golden natural Ceylon corundum with exceptional brilliance and zero thermal enhancement.',
    '₹2,45,000 · Quotation Confirmed on Setting',
    245000,
    'gemstones',
    'pukhraj',
    'none',
    'loose-gemstone',
    'occasion',
    true,
    false,
    'Single Unique Gemstone · Laboratory Certified',
    'Ready for immediate inspection at New Delhi atelier or insured courier',
    '9.8 mm x 8.4 mm x 5.9 mm cushion facet',
    'images/loose-sapphire.jpg',
    'images/pukhraj-hero.jpg',
    '["images/loose-sapphire.jpg","images/pukhraj-hero.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Govt / IIGJ Lab Certified","hallmark":"Natural Earth-Mined Gemstone"}'::jsonb,
    '{"gemstoneType":"Natural Yellow Sapphire (Pukhraj / Corundum)","naturalStatus":"100% Earth-Mined Natural Corundum","caratWeight":"4.22 carats (approx. 4.64 Pakka Ratti)","treatmentDisclosure":"Completely Unheated & Untreated (Verified by Microscopic & FTIR Analysis)","origin":"Ratnapura, Ceylon (Sri Lanka)","certificate":"Independent Gemological Laboratory Certificate Included","metalPurity":"Loose Unset Gemstone (Can be custom set in 22K Gold, 18K Gold, or Panchdhatu)","diamondDetails":"None (Loose Gemstone)","sizeLength":"9.8 x 8.4 mm cushion cut","customisation":"Complimentary ring or pendant setting consultation with our master goldsmiths","careInstructions":"Handle with gem tweezers. Store in padded gemstone display box provided."}'::jsonb,
    '15-Day Inspection Period with 100% money-back authenticity guarantee.',
    'A rare collector-grade Ceylon sapphire showcasing vivid golden saturation without overt secondary tones. Selected for maximum transparency and auspicious eye-clean crystalline clarity.',
    'Never beryllium-diffused, synthetic, or glass-filled. We disclose all treatment parameters unconditionally.',
    'Traditional Vedic Jyotish associates untreated yellow sapphire with Jupiter (Brihaspati). Recommended for wisdom, scholarly growth, and prosperity.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'loose-ceylon-neelam-351',
    'Natural Ceylon Royal Blue Sapphire (Neelam) 3.51 ct Loose Gemstone',
    'Deep velvety royal blue natural corundum with fine crystal silk and radiant pavilion brilliance.',
    '₹3,80,000 · Quotation Confirmed on Setting',
    380000,
    'gemstones',
    'neelam',
    'none',
    'loose-gemstone',
    'occasion',
    true,
    false,
    'Single Unique Gemstone · Laboratory Certified',
    'Available for private viewing or express insured transit',
    '9.2 mm x 7.6 mm x 5.4 mm oval mixed cut',
    'images/loose-sapphire.jpg',
    'images/neelam-sapphire.jpg',
    '["images/loose-sapphire.jpg","images/neelam-sapphire.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"IIGJ Lab Report Available","hallmark":"Natural Earth-Mined Gemstone"}'::jsonb,
    '{"gemstoneType":"Natural Blue Sapphire (Neelam / Corundum)","naturalStatus":"100% Earth-Mined Natural Blue Sapphire","caratWeight":"3.51 carats (approx. 3.86 Pakka Ratti)","treatmentDisclosure":"Completely Natural & Unheated (Tested)","origin":"Ceylon (Sri Lanka)","certificate":"Government Recognized Gemological Lab Report Included","metalPurity":"Loose Unset Gemstone (Setting options in 18K White Gold, Platinum, or 925 Silver)","diamondDetails":"None","sizeLength":"9.2 x 7.6 mm oval facet","customisation":"Custom mounting designed to client specifications","careInstructions":"Store individually in velvet gem capsule."}'::jsonb,
    '15-Day Inspection Guarantee with lifetime authenticity certificate.',
    'This unheated Ceylon Neelam displays the sought-after royal blue hue with balanced chroma and exceptional interior transparency.',
    'Completely free from heat treatments, diffusion, or surface resins.',
    'Traditional Vedic Jyotish associates natural blue sapphire with Saturn (Shani). We recommend trial wearing prior to permanent setting.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'loose-colombian-emerald-352',
    'Certified Natural Colombian Emerald (Panna) 3.52 ct Loose Gemstone',
    'Lush botanical forest green emerald from the legendary Muzo/Chivor deposits with fine jardin.',
    '₹2,65,000 · Quotation Confirmed on Setting',
    265000,
    'gemstones',
    'emerald',
    'none',
    'loose-gemstone',
    'occasion',
    true,
    false,
    'Single Curated Gemstone',
    'Ships in 24 hours via insured diplomatic security courier',
    '9.8 mm x 9.25 mm x 6.1 mm cushion cut',
    'images/loose-emerald.jpg',
    'images/emerald-pendant.jpg',
    '["images/loose-emerald.jpg","images/emerald-pendant.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Oiled, disclosed","treatmentStatus":"oiled_disclosed","certification":"GIA / IIGJ Lab Certified","hallmark":"Natural Earth-Mined Beryl"}'::jsonb,
    '{"gemstoneType":"Natural Emerald (Panna / Beryl)","naturalStatus":"100% Earth-Mined Natural Beryl","caratWeight":"3.52 carats (approx. 3.87 Pakka Ratti)","treatmentDisclosure":"Minor Clarity Enhancement (Traditional Cedarwood Oil Only, Disclosed)","origin":"Colombia (Muzo / Chivor District)","certificate":"Full Gemological Testing Report Accompanied","metalPurity":"Loose Gemstone (Mountable in 18K Yellow Gold or 925 Silver)","diamondDetails":"None","sizeLength":"9.80 x 9.25 mm cushion","customisation":"Bespoke bezel or claw setting available","careInstructions":"Avoid steam and ultrasonic cleaning. Clean solely with damp soft cloth."}'::jsonb,
    '15-Day Inspection Guarantee with authenticity certificate.',
    'Colombian emeralds possess an unmatched inner glow due to trace chromium content. This stone exhibits balanced saturation and authentic jardin inclusions verifying natural provenance.',
    'We strictly disclose traditional minor oil enhancement and reject all synthetic resin-filled or dyed emeralds.',
    'Traditional Vedic Jyotish aligns natural emerald with Mercury (Budha), promoting intellect, communication, and business acumen.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'loose-mozambique-ruby-310',
    'Natural Untreated Mozambique Ruby (Manik) 3.10 ct Loose Gemstone',
    'Vibrant crimson-red corundum with natural fluorescence, untampered by heat or lead-glass flux.',
    '₹2,90,000 · Quotation Confirmed on Setting',
    290000,
    'gemstones',
    'ruby',
    'none',
    'loose-gemstone',
    'occasion',
    true,
    false,
    'Single Curated Gemstone',
    'Available for private appointment in Delhi atelier or insured dispatch',
    '8.6 mm x 7.2 mm x 5.1 mm cushion facet',
    'images/ruby-solitaire.jpg',
    'images/loose-sapphire.jpg',
    '["images/ruby-solitaire.jpg","images/bespoke-workshop.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Lab Report Included","hallmark":"Natural Earth-Mined Corundum"}'::jsonb,
    '{"gemstoneType":"Natural Ruby (Manik / Corundum)","naturalStatus":"100% Earth-Mined Natural Ruby","caratWeight":"3.10 carats (approx. 3.41 Pakka Ratti)","treatmentDisclosure":"Completely Unheated & Untreated (Natural Color & Clarity)","origin":"Montepuez, Mozambique","certificate":"Reputed Gemological Testing Lab Certificate","metalPurity":"Loose Gemstone (Mountable in 22K/18K Gold or Panchdhatu)","diamondDetails":"None","sizeLength":"8.6 x 7.2 mm cushion cut","customisation":"Custom signet or solitaire setting available","careInstructions":"Store individually in gem box provided."}'::jsonb,
    '15-Day Inspection Guarantee with lifetime authenticity documentation.',
    'This unheated Manik displays vivid scarlet-red coloration with lively natural internal glow under sunlight, characteristic of unheated African corundum.',
    'We never sell lead-glass filled composite rubies. Full disclosure of treatment status guaranteed.',
    'Traditional Vedic Jyotish aligns natural ruby with the Sun (Surya), representing vitality, leadership, and self-confidence.',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;

INSERT INTO public.products (
    id, title, poetic_descriptor, price_display, price_amount, primary_category, 
    gemstone, metal, type, occasion, featured, is_daily_wear, availability, lead_time, 
    dimensions, image, secondary_image, gallery, badges, specs, return_eligibility, 
    narrative, transparency_note, astrological_note, status, stock_count
) VALUES (
    'loose-blue-kyanite-540',
    'Natural Untreated Blue Kyanite 5.40 ct Certified Loose Gemstone',
    'Accessible celestial blue blade-facet gemstone, prized as an untreated alternative for Saturn contemplation.',
    '₹16,500 · Tax Included',
    16500,
    'gemstones',
    'kyanite',
    'none',
    'loose-gemstone',
    'daily',
    false,
    true,
    'In Stock · Immediate Dispatch',
    'Ships in 24 hours via complimentary insured courier',
    '12.4 mm x 8.8 mm x 5.2 mm emerald cut',
    'images/kyanite-silver.jpg',
    'images/loose-sapphire.jpg',
    '["images/kyanite-silver.jpg","images/loose-sapphire.jpg"]'::jsonb,
    '{"natural":true,"treatment":"Untreated","treatmentStatus":"untreated","certification":"Govt Lab Tested","hallmark":"Natural Earth-Mined Kyanite"}'::jsonb,
    '{"gemstoneType":"Natural Blue Kyanite (Disthene)","naturalStatus":"100% Earth-Mined Natural Mineral","caratWeight":"5.40 carats (approx. 5.94 Pakka Ratti)","treatmentDisclosure":"Completely Untreated (No Heat, No Dye, No Oil)","origin":"Kali Gandaki Region, Nepal","certificate":"Independent Lab Identification Card Included","metalPurity":"Loose Gemstone (Mountable in 925 Silver or Gold)","diamondDetails":"None","sizeLength":"12.4 x 8.8 mm octagonal step cut","customisation":"Custom silver ring mount available for ₹3,500","careInstructions":"Kyanite possesses anisotropic hardness; avoid heavy mechanical impact."}'::jsonb,
    '15-Day Inspection Period & Money-Back Guarantee.',
    'Blue Kyanite delivers a magnificent deep indigo hue reminiscent of fine sapphire at an accessible valuation. 100% natural and untreated by nature.',
    'Natural earth-mined stone. Zero synthetic alterations.',
    'Traditional Vedic practitioners often suggest natural Blue Kyanite as an accessible alternative (upratna) for Saturn (Shani).',
    'published',
    1
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    price_display = EXCLUDED.price_display,
    price_amount = EXCLUDED.price_amount,
    badges = EXCLUDED.badges,
    specs = EXCLUDED.specs;
