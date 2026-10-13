# GULSHAN JEWELLERS — OWNER HANDOVER & ACTION ITEMS (`TODO-OWNER.md`)

> **To the Business Owner (Gulshan Jewellers, New Delhi):**
> The engineering team has resolved all critical technical defects, unified the shopping cart, integrated multi-line commerce (Fine Jewellery, Artificial / Fashion Jewellery, and Certified Gemstones), and built a full Astrology & Gemstone Consultation reservation system.
> 
> To launch publicly on your permanent domain without regulatory or compliance risks, please supply the following authentic business parameters. **Do not fabricate or leave placeholder credentials active in production.**

---

## 1. Credentials & Account Keys (Never Commit to Git)

| Required Configuration | Purpose | Where to Configure |
| :--- | :--- | :--- |
| **Razorpay Live Key ID & Secret** (`VITE_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) | Processing live customer payments (UPI, Debit/Credit Cards, Netbanking, EMI). | Add to `.env` and deployment environment variables (e.g. Cloudflare / Netlify / Vercel). |
| **Supabase Project URL & Anon Key** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | Database storage for orders, customer enquiries, consultation bookings, and catalogue. | Add to `.env`. Schema and SQL migrations ready in `supabase/schema.sql`. |
| **Google Analytics 4 Measurement ID** (`G-XXXXXXXXXX`) | Web traffic analytics and conversion funnel tracking. | Update in `src/data/site-config.json` -> `site.googleAnalyticsId`. |

---

## 2. Business Entity & Location Details

- [ ] **Full Physical Postal Address:** Currently shown as *"New Delhi atelier by prior reservation"*. Please supply:
  - Building Name / Flat No.:
  - Street / Area: (e.g., Karol Bagh / South Extension / Chandni Chowk / Connaught Place)
  - City & PIN Code: (e.g., New Delhi - 110005)
  - Google Maps Share Link: (to embed on `contact.html` and in `LocalBusiness` JSON-LD schema)
- [ ] **GSTIN Number:** Required on retail tax invoices accompanying gold and gemstone courier dispatches.
- [ ] **BIS Registration Number:** Bureau of Indian Standards registration code for hallmarked 22K and 18K gold.
- [ ] **Domain Name:** Move from GitHub Pages temporary URL (`https://ksc-tvs.github.io/GJ/`) to custom domain (e.g., `https://gulshanjewellers.in`). Add `CNAME` in DNS records pointing to GitHub Pages or host server.

---

## 3. Product Media & Catalogue Specifications

- [ ] **Artificial Jewellery Photographs:** 12 structured product listings have been built with transparent alloy disclosures. High-resolution studio photos of your actual stock should replace the temporary editorial demonstration images.
- [ ] **Loose Gemstone Certificates:** Upload official laboratory certificate PDFs / high-res scans (IIGJ / GIA / Govt Lab) for the 5 loose gemstone listings (`loose-ceylon-pukhraj-422`, `loose-ceylon-neelam-351`, `loose-colombian-emerald-352`, etc.).
- [ ] **Gold & Silver Pricing Confirmation:** Review prices in `src/data/products.json` against current market bullion rates. (Optional: Use admin panel bullion rate tool to dynamically compute making charges and net gold weight).

---

## 4. Consultation & Astrologer Staffing

- [ ] **Consulting Astrologer Credentials:** Currently listed as *Pandit Vidya Sagar Shastri (Jyotish Acharya BHU)*. Confirm your active astrologer's name, qualifications, languages, and preferred consultation schedule.
- [ ] **Chief Gemmologist Profile:** Currently listed as *Rajeshwar Gulshan (FGA)*. Confirm active gemmologist profile details.
- [ ] **Consultation Fees & Durations:** Confirm whether the 4 default services match your fee schedule:
  - Vedic Gemstone Recommendation (45 min · ₹2,100 / complimentary against purchase)
  - Kundli-Based Reading (60 min · ₹3,500)
  - Muhurat & Gifting Guidance (30 min · ₹1,500)
  - Bespoke Planning Call (45 min · Complimentary)

---

## 5. Agency & Logistics Verification

- [ ] **Transit Courier Partner:** Confirm your insured courier partner (e.g., Sequel Logistics, BVC Logistics, BlueDart Secured) for the pan-India dispatch workflow.
- [ ] **Agency Credit URL:** Confirm whether `telloramediahq.com` in the site footer is the designated digital agency URL.

---

*Keep this document updated as business parameters are received and verified.*
