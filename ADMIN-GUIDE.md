# Gulshan Jewellers | Est. 1950
## Atelier Management & Operations Guide (`ADMIN-GUIDE.md`)

This guide is for the boutique owner, atelier managers, consulting astrologers, and client support staff of **Gulshan Jewellers (Est. 1950, New Delhi)**.

---

## 1. Portal Architecture & Security

The Atelier Management Portal is located at:
`https://ksc-tvs.github.io/GJ/admin.html` (or your custom production domain at `/admin.html`).

### Key Security Safeguards:
- **Zero Public Search Indexing**: Blocked via `<meta name="robots" content="noindex, nofollow">` and strict `robots.txt` disallow rules.
- **Client-Side & Server-Side Gates**: The management workspace is hidden behind an authenticated gate. Data access is enforced through **Supabase Row Level Security (RLS)**.
- **DPDP Act (2023) Compliance**: Customer telephone numbers, shipping addresses, and birth chart data (DOB, TOB, POB) cannot be read by anonymous web visitors. Only authenticated staff sessions can access private tables.
- **Audit Logging**: Sensitive status transitions and price adjustments are recorded in `public.audit_logs`.

---

## 2. One-Time Setup Instructions

### Step 2.1: Supabase PostgreSQL Setup
1. Log in to [Supabase](https://supabase.com) and create or open your project (e.g. `gulshan-jewellers-prod`).
2. Go to the **SQL Editor** in the left sidebar.
3. Open [`supabase/schema.sql`](file:///c:/Users/Abhay/Documents/GitHub/GJ/supabase/schema.sql), copy the entire contents, paste them into the SQL Editor, and click **Run**.
   - This creates all core tables (`products`, `orders`, `consultations`, `enquiries`, `store_settings`, `audit_logs`).
   - It activates Row Level Security (RLS) on all 6 tables.
   - It automatically seeds all 28 authentic catalogue pieces and default boutique bullion rates.

### Step 2.2: Create Your First Owner Account
1. In the Supabase Dashboard, go to **Authentication &rarr; Users &rarr; Add User**.
2. Create your administrative user (e.g. `owner@gulshanjewellers.in`) with a strong password.
3. Under User Metadata, optionally add:
   ```json
   { "role": "owner", "name": "Gulshan Jewellers Owner" }
   ```
4. Enable Multi-Factor Authentication (TOTP 2FA) in Supabase Auth settings for all executive accounts.

### Step 2.3: Environment & Credentials
In your deployment environment (GitHub Pages, Cloudflare Pages, or Netlify), set these environment variables:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Alternatively, on your first visit to `admin.html`, switch to the **Database & Cloud Sync** tab to configure and test the live connection.

---

## 3. Daily Atelier Operations

### 3.1 Managing & Fulfilling Customer Orders
1. Click the **Orders & Fulfillment** tab in the navigation bar.
2. The KPI cards show **Total Orders Placed**, **Pending Dispatch**, and **Fulfilled Gross Value**.
3. For each order:
   - Inspect customer details, delivery address, 6-digit PIN code, and ordered jewellery pieces.
   - Update **Fulfillment Status** from `New / Unpacked` &rarr; `Packed & Sealed` &rarr; `Shipped / In Transit` &rarr; `Delivered`.
   - Enter the **Logistics Tracking Number** (e.g., Blue Dart Apex waybill number).
   - Click **Save Logistics**. The customer can now track their shipment on `track-order.html` using their Order ID and telephone number.

### 3.2 Managing Astrology & Gemstone Consultations
1. Click the **Astrology & Consultations** tab.
2. Review scheduled slots by date and time (e.g., *11:00 AM – 11:45 AM IST*).
3. **Confidential Birth Intake Data**: Click `▶ View Birth Chart Data` to reveal the client's Date of Birth, Time of Birth, Place of Birth, and primary spiritual/gemological query.
4. After completing the session, update the session status to `Completed` and record internal notes (recommended gemstone, carat weight, or remedial metal).
5. Click **Update**.

### 3.3 Handling Client Enquiries & Bespoke Leads
1. Click the **Enquiries & CRM** tab.
2. Review inbound enquiries submitted from product pages, bespoke requests, and private viewing bookings.
3. Update status: `New` &rarr; `In Discussion` &rarr; `Quote Sent` &rarr; `Won` &rarr; `Closed`.

### 3.4 Adding or Editing Catalogue Pieces
1. Click the **Catalogue & Inventory** tab.
2. Search pieces using the instant search bar or filter by category (Gemstones, Diamonds, Gold, Silver, Artificial Jewellery, Loose Gemstones).
3. **Edit a Piece**: Click **Edit** to modify pricing, stock status, treatment disclosure, or certificate details.
4. **Add a Piece**: Click **+ Add New Piece** to input title, gemstone, metal, price, origin, and high-resolution photography.
5. Click **Save Piece**. Changes reflect instantly in the storefront.

### 3.5 Updating Daily Bullion Market Rates
1. Click the **Store Settings & Rates** tab.
2. Enter the prevailing daily market rates:
   - **24K Fine Gold** (e.g. ₹76,500 / 10g)
   - **22K 916 Hallmarked Gold** (e.g. ₹70,150 / 10g)
   - **18K 750 Fine Gold** (e.g. ₹57,400 / 10g)
   - **925 Sterling Silver** (e.g. ₹9,200 / 100g)
3. Click **Save Boutique Settings & Rates**. Storefront banners, calculation notes, and quotation widgets update automatically.

---

## 4. Staff Roles & Permissions

| Role | Access Level | Responsibilities |
| :--- | :--- | :--- |
| **Owner** | Full Unrestricted | Master settings, bullion rates, user management, audit logs, order cancellations. |
| **Manager** | Catalogue, Orders, CRM | Daily catalogue updates, order fulfillment, customer communications. |
| **Astrologer / Gemmologist** | Consultations, Certifications | Consulting slot reviews, confidential birth chart analysis, gemological reports. |
| **Support / Concierge** | Read & Update Enquiries | Customer inquiry triage, order tracking assistance. |

---

## 5. Backups & Disaster Recovery

### Manual One-Click Export:
1. In the top navigation bar of `admin.html`, click **Export Catalogue JSON**.
2. This downloads a complete snapshot of all products and metadata to your local computer.

### Supabase Automated Backups:
- Supabase automatically takes daily physical and logical backups of your PostgreSQL database.
- To export your entire database from Supabase, run:
  ```bash
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```
- To restore in an emergency:
  ```bash
  supabase db reset
  psql -h <host> -U postgres -d postgres -f backup_<date>.sql
  ```

---

*Gulshan Jewellers Atelier Operations &bull; Est. 1950 &bull; New Delhi, India*
