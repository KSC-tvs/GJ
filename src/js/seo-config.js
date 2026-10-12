/**
 * SEO & Canonical URL Configuration Engine
 * Gulshan Jewellers | Est. 1950
 * Centralized Domain, Canonical, Metadata & Schema Provider
 */

import siteConfig from '../data/site-config.json';

export const SITE = {
  name: siteConfig.brand.name,
  tagline: siteConfig.brand.tagline,
  established: siteConfig.brand.established,
  productionOrigin: siteConfig.site?.productionOrigin || 'https://ksc-tvs.github.io',
  basePath: siteConfig.site?.basePath || '/GJ/',
  customDomain: siteConfig.site?.customDomain || null,
  currentBaseUrl: siteConfig.site?.currentBaseUrl || 'https://ksc-tvs.github.io/GJ/',
  language: siteConfig.site?.language || 'en-IN',
  locale: siteConfig.site?.locale || 'en_IN',
  themeColor: siteConfig.site?.themeColor || '#FAF8F5',
  contact: siteConfig.contact,
  policies: siteConfig.policies
};

/**
 * Generates an absolute, canonical URL for any site path
 * @param {string} relativePath - e.g. 'collections.html', 'gemstone-guide.html', 'products/pukhraj-cushion-signet-22k.html'
 * @returns {string} Fully-qualified canonical URL
 */
export function getCanonicalUrl(relativePath = '') {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const base = SITE.customDomain 
    ? `${SITE.customDomain.replace(/\/+$/, '')}/` 
    : SITE.currentBaseUrl.replace(/\/+$/, '') + '/';
  return `${base}${cleanPath}`;
}

/**
 * Generates an absolute URL for an asset/image
 * @param {string} imagePath - e.g. 'images/pukhraj-hero.jpg'
 * @returns {string} Fully-qualified absolute image URL
 */
export function getAbsoluteImageUrl(imagePath = '') {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return getCanonicalUrl(cleanPath);
}

/**
 * Schema.org Organization JSON-LD
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': getCanonicalUrl('#organization'),
    'name': SITE.name,
    'alternateName': 'Gulshan Jewellers Est. 1950',
    'url': getCanonicalUrl(''),
    'logo': {
      '@type': 'ImageObject',
      'url': getAbsoluteImageUrl('images/logo.png'),
      'width': 512,
      'height': 512,
      'caption': 'Gulshan Jewellers Golden Monogram Logo'
    },
    'image': getAbsoluteImageUrl('images/pukhraj-hero.jpg'),
    'description': siteConfig.brand.aboutShort,
    'foundingDate': '1950',
    'telephone': SITE.contact.whatsappNumber,
    'email': SITE.contact.email,
    'priceRange': '₹₹₹₹',
    'currenciesAccepted': 'INR, USD, AED, GBP, EUR',
    'paymentAccepted': 'Bank Transfer, Card, UPI, Cheque, Private Invoice',
    'openingHours': 'Mo-Sa 11:00-19:30',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'New Delhi',
      'addressRegion': 'Delhi',
      'addressCountry': 'IN'
    },
    'sameAs': [
      SITE.contact.instagramUrl,
      `https://wa.me/${SITE.contact.whatsappNumber.replace(/[^0-9]/g, '')}`
    ]
  };
}

/**
 * Schema.org WebSite JSON-LD with Sitelinks Searchbox
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': getCanonicalUrl('#website'),
    'url': getCanonicalUrl(''),
    'name': SITE.name,
    'description': siteConfig.brand.heroSubtitle,
    'inLanguage': SITE.language,
    'publisher': {
      '@id': getCanonicalUrl('#organization')
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${getCanonicalUrl('collections.html')}?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Schema.org BreadcrumbList JSON-LD
 * @param {Array<{ name: string, url: string }>} items
 */
export function getBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': getCanonicalUrl(item.url)
    }))
  };
}

/**
 * Schema.org Product JSON-LD
 * Strictly accurate: quotation items labeled correctly, authentic materials disclosed
 */
export function getProductSchema(product) {
  if (!product) return null;

  const productUrl = getCanonicalUrl(`product.html?id=${product.id}`);
  const imageUrl = getAbsoluteImageUrl(product.image);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    'name': product.title,
    'description': product.poeticDescriptor || product.narrative,
    'image': imageUrl,
    'url': productUrl,
    'sku': product.id,
    'brand': {
      '@type': 'Brand',
      'name': SITE.name
    },
    'category': product.primaryCategory,
    'material': product.specs?.metalPurity || product.metal,
    'offers': {
      '@type': 'Offer',
      'url': productUrl,
      'priceCurrency': 'INR',
      'price': product.priceAmount || undefined,
      'priceSpecification': {
        '@type': 'PriceSpecification',
        'priceCurrency': 'INR',
        'price': product.priceAmount || undefined,
        'description': product.priceDisplay || 'Quotation on Request'
      },
      'availability': 'https://schema.org/InStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': {
        '@type': 'Organization',
        'name': SITE.name
      }
    }
  };

  if (product.specs?.gemstoneType) {
    schema['additionalProperty'] = [
      {
        '@type': 'PropertyValue',
        'name': 'Gemstone Type',
        'value': product.specs.gemstoneType
      },
      {
        '@type': 'PropertyValue',
        'name': 'Natural Status',
        'value': product.specs.naturalStatus || 'Natural Earth-Mined'
      },
      {
        '@type': 'PropertyValue',
        'name': 'Carat Weight',
        'value': product.specs.caratWeight
      },
      {
        '@type': 'PropertyValue',
        'name': 'Treatment Disclosure',
        'value': product.specs.treatmentDisclosure
      },
      {
        '@type': 'PropertyValue',
        'name': 'Origin',
        'value': product.specs.origin
      },
      {
        '@type': 'PropertyValue',
        'name': 'Hallmark',
        'value': product.badges?.hallmark || product.specs?.metalPurity
      }
    ].filter(prop => Boolean(prop.value));
  }

  return schema;
}
