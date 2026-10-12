/**
 * Build-time Static Product Page Generator
 * Gulshan Jewellers | Est. 1950
 * Generates fully crawlable, static HTML files for all products in src/data/products.json
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const productsFilePath = path.join(rootDir, 'src', 'data', 'products.json');
const siteConfigPath = path.join(rootDir, 'src', 'data', 'site-config.json');
const outputDir = path.join(rootDir, 'products');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));

// Canonical base must end with a single slash
const canonicalBase = siteConfig.site.currentBaseUrl.replace(/\/+$/, '') + '/';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCategoryLabel(cat) {
  switch (cat) {
    case 'gemstones': return 'Natural Gemstones';
    case 'diamonds': return 'Fine Diamonds';
    case 'gold': return 'Fine Gold';
    case 'silver': return 'Sterling Silver';
    default: return 'Jewellery Creations';
  }
}

function getMetaDescription(product) {
  if (product.specs && product.specs.gemstoneType) {
    return `${product.title}: Certified natural ${product.specs.gemstoneType} set in ${product.specs.metalPurity || 'fine hallmarked gold'}. ${product.specs.treatmentDisclosure || 'Complete material disclosure'}. Heritage atelier creation since 1950.`;
  }
  return `${product.title}: Handcrafted ${product.specs?.metalPurity || 'solid gold/silver'} piece from Gulshan Jewellers (Est. 1950). Verified purity, transparent craftsmanship, and bespoke consultation.`;
}

products.forEach(product => {
  const productCanonicalUrl = `${canonicalBase}products/${product.id}.html`;
  const metaDesc = getMetaDescription(product);
  const categoryLabel = getCategoryLabel(product.primaryCategory);

  // Collect all gallery images with accurate deployed base URL
  const galleryList = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
  const galleryImageUrls = galleryList.map(img => `${canonicalBase}${img.replace(/^\/+/, '')}`);
  const primaryImageUrl = galleryImageUrls[0];

  // Find 3 complementary products
  const relatedProducts = products
    .filter(p => p.id !== product.id)
    .sort((a, b) => {
      if (a.primaryCategory === product.primaryCategory && b.primaryCategory !== product.primaryCategory) return -1;
      if (b.primaryCategory === product.primaryCategory && a.primaryCategory !== product.primaryCategory) return 1;
      return 0;
    })
    .slice(0, 3);

  // Schema: Product
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productCanonicalUrl}#product`,
    "name": product.title,
    "description": product.poeticDescriptor || product.narrative,
    "image": galleryImageUrls,
    "url": productCanonicalUrl,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Gulshan Jewellers"
    },
    "category": product.primaryCategory,
    "material": product.specs?.metalPurity || product.metal,
    "offers": {
      "@type": "Offer",
      "url": productCanonicalUrl,
      "priceCurrency": "INR",
      "price": product.priceAmount || undefined,
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "INR",
        "price": product.priceAmount || undefined,
        "description": product.priceDisplay || "Quotation on Request"
      },
      "availability": product.availability === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Gulshan Jewellers"
      }
    }
  };

  if (product.specs?.gemstoneType) {
    productSchema["additionalProperty"] = [
      { "@type": "PropertyValue", "name": "Gemstone Type", "value": product.specs.gemstoneType },
      { "@type": "PropertyValue", "name": "Natural Status", "value": product.specs.naturalStatus || "Natural Earth-Mined" },
      { "@type": "PropertyValue", "name": "Carat Weight", "value": product.specs.caratWeight },
      { "@type": "PropertyValue", "name": "Treatment Disclosure", "value": product.specs.treatmentDisclosure },
      { "@type": "PropertyValue", "name": "Origin", "value": product.specs.origin },
      { "@type": "PropertyValue", "name": "Metal Purity", "value": product.specs.metalPurity },
      { "@type": "PropertyValue", "name": "Hallmark", "value": product.badges?.hallmark || product.specs?.metalPurity }
    ].filter(p => Boolean(p.value));
  }

  // Schema: BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": canonicalBase
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Collections",
        "item": `${canonicalBase}collections.html`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryLabel,
        "item": `${canonicalBase}collections.html?category=${product.primaryCategory}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.title,
        "item": productCanonicalUrl
      }
    ]
  };

  // Badges markup
  const badgesHtml = [
    product.badges?.natural ? `<span class="badge badge-natural">Natural Earth-Mined</span>` : `<span class="badge badge-natural">Artisan Crafted</span>`,
    product.badges?.treatment ? `<span class="badge badge-cert">${escapeHtml(product.badges.treatment)}</span>` : '',
    product.badges?.certification ? `<span class="badge badge-cert">${escapeHtml(product.badges.certification)}</span>` : '',
    product.badges?.hallmark ? `<span class="badge badge-hallmark">${escapeHtml(product.badges.hallmark)}</span>` : ''
  ].filter(Boolean).join('\n            ');

  // Specs rows markup
  const specsRowsHtml = product.specs ? Object.entries({
    "Gemstone Type": product.specs.gemstoneType,
    "Natural / Lab-Grown": product.specs.naturalStatus,
    "Carat / Ratti Weight": product.specs.caratWeight,
    "Treatment Disclosure": product.specs.treatmentDisclosure,
    "Verified Origin": product.specs.origin,
    "Lab Certification": product.specs.certificate,
    "Metal & Purity": product.specs.metalPurity,
    "Natural Diamond Details": product.specs.diamondDetails,
    "Dimensions / Size": product.dimensions || product.specs.sizeLength,
    "Estimated Lead Time": product.leadTime,
    "Return / Exchange Eligibility": product.returnEligibility,
    "Atelier Care Instructions": product.careInstructions,
    "Customisation Options": product.specs.customisation
  }).filter(([_, val]) => Boolean(val))
    .map(([label, val]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`)
    .join('\n                ') : '';

  // Gallery thumbnails
  const thumbsHtml = galleryList.map((img, idx) => `
          <div class="pdp-thumb ${idx === 0 ? 'active' : ''}" data-src="../${escapeHtml(img.replace(/^\/+/, ''))}">
            <img src="../${escapeHtml(img.replace(/^\/+/, ''))}" alt="${escapeHtml(product.title)} View ${idx + 1}" width="80" height="80">
          </div>`).join('\n');

  // Related products markup
  const relatedHtml = relatedProducts.map(rel => `
        <article class="product-card">
          <div class="product-card-media">
            <a href="${rel.id}.html" aria-label="View ${escapeHtml(rel.title)}">
              <img src="../${escapeHtml(rel.image.replace(/^\/+/, ''))}" alt="${escapeHtml(rel.title)}" loading="lazy" width="400" height="400">
            </a>
          </div>
          <div class="product-card-content">
            <h3 class="product-card-title">
              <a href="${rel.id}.html">${escapeHtml(rel.title)}</a>
            </h3>
            <p class="product-card-desc">${escapeHtml(rel.poeticDescriptor)}</p>
            <div class="product-card-footer">
              <span class="product-price">${escapeHtml(rel.priceDisplay)}</span>
              <a href="${rel.id}.html" class="product-card-view-btn">
                <span>View Piece</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </article>`).join('\n');

  // Hybrid CTAs markup
  let ctaHtml = '';
  if (product.commerceMode === 'direct') {
    ctaHtml = `
        <div class="pdp-cta-group" data-commerce-mode="direct">
          ${product.type === 'ring' || product.specs?.sizeLength ? `
          <div class="pdp-size-selection" style="margin-bottom: var(--space-4);">
            <label for="pdp-size-select" style="display:block; font-size: var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom: 6px;">Select Size / Length</label>
            <select id="pdp-size-select" class="form-control" style="max-width: 280px;" aria-label="Select Size or Length">
              <option value="${escapeHtml(product.dimensions || product.specs?.sizeLength || 'Standard Size')}">${escapeHtml(product.dimensions || product.specs?.sizeLength || 'Standard Size')} (Standard)</option>
              <option value="custom">Custom Sizing (Confirm via Atelier Concierge)</option>
            </select>
          </div>` : ''}
          <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: var(--space-3);">
            <button type="button" id="pdp-buy-now-btn" class="btn btn-gold btn-lg" data-buy-now data-id="${escapeHtml(product.id)}" data-title="${escapeHtml(product.title)}" data-price="${product.priceAmount || 0}" data-image="${escapeHtml(product.image)}">
              ⚡ Buy Now
            </button>
            <button type="button" id="pdp-add-to-bag-btn" class="btn btn-outline btn-lg" data-add-to-cart data-id="${escapeHtml(product.id)}" data-title="${escapeHtml(product.title)}" data-price="${product.priceAmount || 0}" data-image="${escapeHtml(product.image)}">
              👜 Add to Bag
            </button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3);">
            <button type="button" id="pdp-add-tray-btn" class="btn btn-outline btn-sm" data-id="${escapeHtml(product.id)}">
              + Save to Curated Tray
            </button>
            <a href="https://wa.me/919582841454?text=${encodeURIComponent(`Hello Gulshan Jewellers, I would like to order "${product.title}" (SKU: ${product.id}, Price: ${product.priceDisplay}).`)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
              WhatsApp Concierge
            </a>
          </div>
        </div>`;
  } else {
    ctaHtml = `
        <div class="pdp-cta-group" data-commerce-mode="enquire">
          <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: var(--space-3);">
            <button type="button" id="pdp-primary-enquire-btn" class="btn btn-gold btn-lg" data-trigger-consultation data-product-id="${escapeHtml(product.id)}">
              Request Private Consultation
            </button>
            <button type="button" id="pdp-add-tray-btn" class="btn btn-outline btn-lg" data-id="${escapeHtml(product.id)}">
              + Add to Curated Tray
            </button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3);">
            <button type="button" id="pdp-custom-quote-btn" class="btn btn-outline btn-sm" data-trigger-consultation data-consultation-type="bespoke">
              Bespoke Setting Enquiry
            </button>
            <a href="https://wa.me/919582841454?text=${encodeURIComponent(`Hello Gulshan Jewellers, I would like to consult on "${product.title}" (SKU: ${product.id}).`)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
              WhatsApp Specialist
            </a>
          </div>
        </div>`;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(product.title)} | Gulshan Jewellers · Est. 1950</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <link rel="canonical" href="${productCanonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Gulshan Jewellers">
  <meta property="og:title" content="${escapeHtml(product.title)} | Gulshan Jewellers">
  <meta property="og:description" content="${escapeHtml(product.poeticDescriptor || metaDesc)}">
  <meta property="og:url" content="${productCanonicalUrl}">
  <meta property="og:image" content="${primaryImageUrl}">
  <meta property="og:image:alt" content="${escapeHtml(product.title)} - Gulshan Jewellers Atelier Archive">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(product.title)} | Gulshan Jewellers">
  <meta name="twitter:description" content="${escapeHtml(product.poeticDescriptor || metaDesc)}">
  <meta name="twitter:image" content="${primaryImageUrl}">
  <meta name="twitter:image:alt" content="${escapeHtml(product.title)}">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="../src/css/tokens.css">
  <link rel="stylesheet" href="../src/css/base.css">
  <link rel="stylesheet" href="../src/css/components.css">
  <link rel="stylesheet" href="../src/css/pages.css">
  <link rel="stylesheet" href="../src/css/animations.css">

  <!-- Favicons -->
  <link rel="icon" type="image/png" href="../favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
  <link rel="shortcut icon" href="../favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content="GJ " />
  <link rel="manifest" href="../site.webmanifest" />
  <meta name="theme-color" content="#FAF8F5">

  <!-- Structured Data: Product -->
  <script type="application/ld+json">
  ${JSON.stringify(productSchema, null, 2)}
  </script>

  <!-- Structured Data: BreadcrumbList -->
  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>
</head>
<body>
  <!-- Accessible Skip Link -->
  <a href="#main-content" class="skip-to-content">Skip to content</a>

  <!-- Top Announcement Bar (Slim Luxury Utility Strip) -->
  <div class="top-bar">
    <div class="top-bar-inner">
      <div class="top-bar-left">
        <span class="top-bar-tagline">Est. 1950 &middot; Untreated Natural Gemstones &middot; BIS Hallmarked Gold</span>
        <div class="currency-selector-wrap">
          <label class="sr-only" for="currency-selector-pdp-${escapeHtml(product.id)}">Select Currency</label>
          <select id="currency-selector-pdp-${escapeHtml(product.id)}" class="currency-selector" aria-label="Select Currency">
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
      <div class="top-bar-links">
        <a href="https://wa.me/919582841454" target="_blank" rel="noopener noreferrer" class="top-bar-link">
          <span>WhatsApp Specialist: +91 95828 41454</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Main Sticky Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="brand-logo" aria-label="Gulshan Jewellers Home">
        <img src="../images/logo.png" alt="Gulshan Jewellers Emblem" class="brand-logo-img" width="46" height="46">
        <div class="brand-logo-text">
          <span class="brand-name">Gulshan Jewellers</span>
          <span class="brand-subline">Est. 1950 · Years of Crafting Legacies</span>
        </div>
      </a>

      <nav class="main-nav" aria-label="Main Navigation">
        <a href="../collections.html" class="nav-link">Collections</a>
        <a href="../gemstone-guide.html" class="nav-link">Gemstone Guide</a>
        <a href="../bespoke.html" class="nav-link">Bespoke Creation</a>
        <a href="../about.html" class="nav-link">Our Ethos</a>
        <a href="../contact.html" class="nav-link">Consultation</a>
      </nav>

      <div class="header-actions">
        <!-- Search Trigger -->
        <button type="button" class="header-icon-btn" data-trigger-search aria-label="Search atelier catalogue" title="Search (⌘K)">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span class="header-search-kbd">⌘K</span>
        </button>

        <!-- Curated Tray Trigger -->
        <button type="button" class="header-icon-btn" data-trigger-tray aria-label="Curated Tray" title="Curated Tray">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="6 3 18 3 22 9 12 22 2 9"></polygon>
            <line x1="2" y1="9" x2="22" y2="9"></line>
            <line x1="12" y1="22" x2="6" y2="9"></line>
            <line x1="12" y1="22" x2="18" y2="9"></line>
            <line x1="6" y1="3" x2="12" y2="9"></line>
            <line x1="18" y1="3" x2="12" y2="9"></line>
          </svg>
          <span class="tray-counter-pill" style="display: none;">0</span>
        </button>

        <!-- Shopping Bag Trigger -->
        <button type="button" class="header-icon-btn" data-trigger-cart aria-label="Shopping Bag" title="Shopping Bag">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span class="cart-counter-pill" style="display: none;">0</span>
        </button>

        <button type="button" class="btn btn-gold btn-sm nav-primary-cta" data-trigger-consultation>
          Book Consultation
        </button>

        <button class="mobile-nav-toggle" aria-label="Toggle navigation menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Product Detail Container -->
  <main id="main-content" class="container" tabindex="-1">
    <nav style="padding: var(--space-6) 0 var(--space-2); font-size: var(--text-xs); color: var(--color-text-muted);" aria-label="Breadcrumb">
      <a href="../index.html">Home</a> &nbsp;/&nbsp;
      <a href="../collections.html">Collections</a> &nbsp;/&nbsp;
      <a href="../collections.html?category=${escapeHtml(product.primaryCategory)}">${escapeHtml(categoryLabel)}</a> &nbsp;/&nbsp;
      <span style="color: var(--color-text-primary);">${escapeHtml(product.title)}</span>
    </nav>

    <div class="pdp-grid">
      <!-- Left: Zoomable Macro Media Gallery -->
      <div class="pdp-gallery">
        <div class="pdp-main-image-wrap" title="Inspect piece craftsmanship">
          <img id="pdp-main-img" src="../${escapeHtml(product.image.replace(/^\/+/, ''))}" alt="${escapeHtml(product.title)} - Handcrafted Fine Jewellery" loading="eager" width="600" height="600">
        </div>
        <div class="pdp-thumbs-row" id="pdp-thumbs-row">
          ${thumbsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-3);">
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">
            Macro studio capture &middot; Authentic colour representation
          </span>
          ${product.type === 'ring' ? `
          <button type="button" id="pdp-size-guide-btn" class="btn-link" style="font-size: 0.75rem;">
            &#128207; Ring Size Guide
          </button>` : ''}
        </div>
      </div>

      <!-- Right: Product Information & Specifications -->
      <div class="pdp-details">
        <div class="pdp-header">
          <div id="pdp-badges" style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3);">
            ${badgesHtml}
          </div>
          <h1 id="pdp-title" class="pdp-title">${escapeHtml(product.title)}</h1>
          <p id="pdp-poetic" class="pdp-poetic">${escapeHtml(product.poeticDescriptor)}</p>
          <div class="pdp-price-row">
            <span id="pdp-price" class="pdp-price">${escapeHtml(product.priceDisplay)}</span>
            <span style="font-size: var(--text-xs); color: var(--color-text-muted);">· BIS Hallmarking &amp; Independent Certification Included</span>
          </div>

          <div style="display: flex; gap: var(--space-3); align-items: center; margin-top: var(--space-2); flex-wrap: wrap;">
            ${product.availability === 'in_stock'
              ? '<span class="badge" style="background:#EBF5EB; color:#1B5E20; border-color:#C8E6C9; font-weight: 600;">✓ In Stock · Ready to Dispatch</span>'
              : '<span class="badge" style="background:#FFF9EB; color:#855B0A; border-color:#FFE8A3; font-weight: 600;">◈ Handcrafted to Order</span>'}
            <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">
              <strong>Lead Time:</strong> ${escapeHtml(product.leadTime || '3–5 business days')}
            </span>
          </div>
          ${product.priceExplanation ? `<p style="font-size: var(--text-xs); color: var(--color-gold-deep); margin-top: 6px; font-style: italic;">${escapeHtml(product.priceExplanation)}</p>` : ''}
        </div>

        <!-- Conversational CTAs with Hybrid Commerce Integration -->
        ${ctaHtml}

        <!-- Narrative: Why this piece -->
        <div style="border-top: 1px solid var(--color-border-hairline); padding-top: var(--space-5);">
          <h3 style="font-size: 1.15rem; color: var(--color-text-primary); margin-bottom: var(--space-2);">Why This Piece</h3>
          <p id="pdp-narrative" style="font-size: 0.92rem; line-height: 1.8; color: var(--color-text-secondary);">
            ${escapeHtml(product.narrative)}
          </p>
        </div>

        <!-- Transparency & Hallmark Box -->
        <div class="transparency-callout-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="transparency-callout-title">&#10003; Crafted with Transparency</span>
            <a href="../gemstone-guide.html" class="btn-link" style="font-size: 0.72rem;">
              Inspect Certification Standards &rarr;
            </a>
          </div>
          <p id="pdp-transparency-note" class="transparency-callout-text">
            ${escapeHtml(product.transparencyNote || 'Every creation at Gulshan Jewellers is accompanied by a transparent disclosure of natural status and any treatment. We do not use simulated or lab-grown substitutes under misleading names.')}
          </p>
        </div>

        ${product.astrologicalNote ? `
        <!-- Astrological Non-Promissory Note -->
        <div id="pdp-astro-container" style="background-color: var(--color-bg-surface); border-left: 3px solid var(--color-gold-champagne); padding: var(--space-4); border-radius: var(--radius-xs); margin-top: var(--space-4);">
          <span style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-gold-deep); display: block; margin-bottom: 4px;">
            Astrological &amp; Heritage Tradition
          </span>
          <p id="pdp-astro-note" style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.6;">
            ${escapeHtml(product.astrologicalNote)}
          </p>
        </div>` : ''}

        <!-- Material Specifications Accordion -->
        <div class="spec-accordion">
          <div class="accordion-item open">
            <button type="button" class="accordion-trigger">
              <span>Material Specifications</span>
              <span class="icon">&#8722;</span>
            </button>
            <div class="accordion-content">
              <table class="spec-table" id="pdp-specs-table">
                ${specsRowsHtml}
              </table>
            </div>
          </div>

          <div class="accordion-item">
            <button type="button" class="accordion-trigger">
              <span>Certification &amp; Delivery</span>
              <span class="icon">&#43;</span>
            </button>
            <div class="accordion-content">
              <p style="color: var(--color-text-secondary); font-size: var(--text-sm); line-height: 1.7;">
                Independent gemological testing certificates (e.g. IIGJ or equivalent accredited testing laboratory) accompany every natural gemstone upon request. All gold jewellery carries official government BIS Hallmarking. Handover via insured direct courier across India or private atelier appointment in New Delhi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Products -->
    <section style="padding: var(--space-16) 0; border-top: 1px solid var(--color-border-hairline);">
      <div class="section-header" style="text-align: left; margin-bottom: var(--space-8);">
        <span class="section-eyebrow">Complementary Curations</span>
        <h2 class="section-title">You May Also Appreciate</h2>
      </div>
      <div class="product-grid" id="pdp-related-grid">
        ${relatedHtml}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand-col">
          <div class="footer-brand-header">
            <img src="../images/logo.png" alt="Gulshan Jewellers Emblem" class="footer-brand-logo-img" width="48" height="48">
            <div>
              <span class="footer-brand-title">Gulshan Jewellers</span>
              <span class="footer-brand-sub">Est. 1950 · Years of Crafting Legacies</span>
            </div>
          </div>
          <p class="footer-brand-bio">
            Intimate, gem-focused Indian fine jewellery house offering fine gold, natural diamonds, rare untreated gemstones, and handcrafted sterling silver.
          </p>
        </div>
        <div>
          <h4 class="footer-col-title">Atelier</h4>
          <ul class="footer-links">
            <li><a href="../collections.html">All Pieces</a></li>
            <li><a href="../gemstone-guide.html">Gemstone Guide</a></li>
            <li><a href="../bespoke.html">Bespoke Journey</a></li>
            <li><a href="../about.html">Heritage Ethos</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-col-title">Client Care &amp; Trust</h4>
          <ul class="footer-links">
            <li><a href="../policies.html">Shipping &amp; Insured Transit</a></li>
            <li><a href="../policies.html#returns">Returns &amp; Exchanges</a></li>
            <li><a href="../policies.html#hallmarking">BIS Hallmarking Policy</a></li>
            <li><a href="../policies.html#care">Jewellery Care Guide</a></li>
            <li><a href="../policies.html#privacy">Privacy &amp; Terms</a></li>
          </ul>
        </div>
        <div>
          <h4 class="footer-col-title">Boutique Viewings</h4>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6;">
            Monday &ndash; Saturday<br>
            11:00 AM &ndash; 7:30 PM IST<br>
            Private viewings by appointment in New Delhi.<br>
            <a href="https://wa.me/919582841454" target="_blank" rel="noopener noreferrer" style="color: var(--color-gold-champagne);">WhatsApp Concierge: +91 95828 41454</a>
          </p>
        </div>
      </div>

      <div class="footer-disclaimer-box">
        <p style="margin-bottom: var(--space-2);"><strong>Gemstone &amp; Astrological Advisory Note:</strong> Gemstone traditions and astrological preferences are personal. Our consultation is designed to help you understand the stone, its quality, and your setting options; it does not guarantee outcomes.</p>
        <p><strong>Atelier &amp; Service Standards:</strong> Boutique visits available on private appointment in New Delhi. Independent gemological testing laboratory certificates (e.g. IIGJ or equivalent accredited labs) available per stone upon request. Insured express delivery with tamper-evident packaging across India. For full terms, inspect our <a href="../policies.html" style="color: var(--color-gold-champagne); text-decoration: underline;">Client Policies &amp; Standards</a>.</p>
      </div>

      <div class="footer-bottom">
        <span>&copy; 1950&ndash;2026 Gulshan Jewellers. All rights reserved.</span>
        <a href="https://telloramediahq.com" target="_blank" rel="noopener noreferrer" class="footer-credit">
          <span>Made by</span>
          <img src="https://telloramediahq.com/tellora-logo.png" alt="Tellora Media" class="footer-credit-logo" width="16" height="16">
          <span>Tellora Media</span>
        </a>
        <span>Years of Crafting Legacies</span>
      </div>
    </div>
  </footer>

  <script type="module" src="../src/js/main.js"></script>
  <script type="module" src="../src/js/product-static.js"></script>
</body>
</html>`;

  const targetFile = path.join(outputDir, `${product.id}.html`);
  fs.writeFileSync(targetFile, htmlContent, 'utf8');
  console.log(`Generated: products/${product.id}.html`);
});

console.log(`Successfully generated all ${products.length} static product pages in products/`);
