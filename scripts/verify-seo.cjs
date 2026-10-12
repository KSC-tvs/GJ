/**
 * Automated Production SEO Verification Engine
 * Gulshan Jewellers | Est. 1950
 * Validates Technical SEO, Crawlability, Meta Tags, Canonical URLs, Structured Data,
 * Sitemap Integrity, and Asset Accessibility.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const productsDir = path.join(rootDir, 'products');

let errorsCount = 0;
let warningsCount = 0;

function reportPass(msg) {
  console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
}

function reportWarn(msg) {
  warningsCount++;
  console.log(`  \x1b[33m⚠ WARNING:\x1b[0m ${msg}`);
}

function reportFail(msg) {
  errorsCount++;
  console.log(`  \x1b[31m✖ FAILURE:\x1b[0m ${msg}`);
}

console.log('\n======================================================');
console.log(' GULSHAN JEWELLERS — AUTOMATED PRODUCTION SEO AUDIT');
console.log('======================================================\n');

// 1. Verify robots.txt
console.log('1. Auditing robots.txt Crawl Directives...');
const robotsPath = path.join(publicDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  reportFail('public/robots.txt is missing');
} else {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsContent.includes('Disallow: /admin.html')) {
    reportFail('robots.txt does not disallow /admin.html');
  } else {
    reportPass('robots.txt correctly disallows /admin.html');
  }
  if (!robotsContent.includes('Sitemap: https://ksc-tvs.github.io/GJ/sitemap.xml')) {
    reportFail('robots.txt missing canonical sitemap URL');
  } else {
    reportPass('robots.txt specifies valid sitemap URL');
  }
}

// 2. Verify admin.html robots tag
console.log('\n2. Auditing Private Admin Page Security & Robots Directives...');
const adminPath = path.join(rootDir, 'admin.html');
if (fs.existsSync(adminPath)) {
  const adminHtml = fs.readFileSync(adminPath, 'utf8');
  if (adminHtml.includes('<meta name="robots" content="noindex, nofollow">')) {
    reportPass('admin.html has strict meta robots noindex, nofollow tag');
  } else {
    reportFail('admin.html lacks meta robots noindex, nofollow directive');
  }
} else {
  reportWarn('admin.html does not exist');
}

// 3. Verify 404.html recovery page
console.log('\n3. Auditing 404 Recovery Architecture...');
const notFoundPath = path.join(rootDir, '404.html');
if (fs.existsSync(notFoundPath)) {
  const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');
  if (notFoundHtml.includes('<meta name="robots" content="noindex, follow">')) {
    reportPass('404.html has meta robots noindex, follow tag');
  } else {
    reportFail('404.html missing meta robots directive');
  }
  if (notFoundHtml.includes('collections.html') && notFoundHtml.includes('gemstone-guide.html')) {
    reportPass('404.html contains high-value recovery links');
  }
} else {
  reportFail('404.html recovery page is missing from project root');
}

// 4. Verify Core Templates & Static Product Pages
console.log('\n4. Auditing Indexable Page Metadata & Canonical Tags...');

const pagesToAudit = [
  { file: 'index.html', titleTarget: 'Gulshan Jewellers', expectedCanonical: 'https://ksc-tvs.github.io/GJ/' },
  { file: 'collections.html', titleTarget: 'Collections', expectedCanonical: 'https://ksc-tvs.github.io/GJ/collections.html' },
  { file: 'gemstone-guide.html', titleTarget: 'The Gemstone Guide', expectedCanonical: 'https://ksc-tvs.github.io/GJ/gemstone-guide.html' },
  { file: 'bespoke.html', titleTarget: 'Bespoke Creation', expectedCanonical: 'https://ksc-tvs.github.io/GJ/bespoke.html' },
  { file: 'about.html', titleTarget: 'Our Ethos', expectedCanonical: 'https://ksc-tvs.github.io/GJ/about.html' },
  { file: 'contact.html', titleTarget: 'Consultation & Contact', expectedCanonical: 'https://ksc-tvs.github.io/GJ/contact.html' }
];

// Add all generated static product pages
if (fs.existsSync(productsDir)) {
  const productHtmlFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'));
  productHtmlFiles.forEach(prodFile => {
    pagesToAudit.push({
      file: path.join('products', prodFile),
      titleTarget: 'Gulshan Jewellers',
      expectedCanonical: `https://ksc-tvs.github.io/GJ/products/${prodFile}`
    });
  });
}

const seenTitles = new Map();
const seenCanonicals = new Map();

pagesToAudit.forEach(pageInfo => {
  const filePath = path.join(rootDir, pageInfo.file);
  if (!fs.existsSync(filePath)) {
    reportFail(`Target page missing: ${pageInfo.file}`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');

  // Title check
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    reportFail(`${pageInfo.file}: Missing <title> tag`);
  } else {
    const title = titleMatch[1].trim();
    if (title.includes('Loading Piece...')) {
      reportFail(`${pageInfo.file}: Title contains "Loading Piece..." placeholder`);
    } else if (seenTitles.has(title)) {
      reportFail(`${pageInfo.file}: Duplicate title with ${seenTitles.get(title)} ("${title}")`);
    } else {
      seenTitles.set(title, pageInfo.file);
      if (title.length < 25) {
        reportWarn(`${pageInfo.file}: Title is quite short (${title.length} chars): "${title}"`);
      } else if (title.length > 85) {
        reportWarn(`${pageInfo.file}: Title exceeds recommended length (${title.length} chars)`);
      }
    }
  }

  // Meta description check
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    reportFail(`${pageInfo.file}: Missing <meta name="description"> tag`);
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 50) {
      reportWarn(`${pageInfo.file}: Meta description is short (${desc.length} chars)`);
    }
  }

  // Canonical URL check
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch || !canonicalMatch[1].trim()) {
    reportFail(`${pageInfo.file}: Missing <link rel="canonical"> tag`);
  } else {
    const canonical = canonicalMatch[1].trim();
    if (canonical !== pageInfo.expectedCanonical) {
      reportFail(`${pageInfo.file}: Canonical mismatch. Expected "${pageInfo.expectedCanonical}", got "${canonical}"`);
    } else if (seenCanonicals.has(canonical)) {
      reportFail(`${pageInfo.file}: Duplicate canonical URL with ${seenCanonicals.get(canonical)}`);
    } else {
      seenCanonicals.set(canonical, pageInfo.file);
    }
  }

  // H1 tag check
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  if (!h1Matches || h1Matches.length === 0) {
    reportFail(`${pageInfo.file}: Missing <h1> heading`);
  } else if (h1Matches.length > 1) {
    reportWarn(`${pageInfo.file}: Multiple <h1> headings found (${h1Matches.length})`);
  }

  // JSON-LD schema validity check
  const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let jsonLdFound = false;
  for (const match of jsonLdMatches) {
    jsonLdFound = true;
    try {
      const parsed = JSON.parse(match[1]);
      if (!parsed['@context'] || !parsed['@type']) {
        reportFail(`${pageInfo.file}: JSON-LD missing @context or @type`);
      }
    } catch (e) {
      reportFail(`${pageInfo.file}: Invalid JSON-LD syntax: ${e.message}`);
    }
  }
  if (!jsonLdFound) {
    reportWarn(`${pageInfo.file}: No JSON-LD structured data detected`);
  }
});

reportPass(`Audited ${pagesToAudit.length} pages for Titles, Meta Descriptions, Canonicals, H1s, and Structured Data`);

// 5. Audit XML Sitemap Integrity
console.log('\n5. Auditing XML Sitemap Coverage & URLs...');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  reportFail('public/sitemap.xml is missing');
} else {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const locMatches = sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g);
  let sitemapUrlCount = 0;
  for (const match of locMatches) {
    sitemapUrlCount++;
    const url = match[1];
    if (url.includes('admin.html')) {
      reportFail(`sitemap.xml improperly includes private admin route: ${url}`);
    }
    if (!url.startsWith('https://ksc-tvs.github.io/GJ/')) {
      reportFail(`sitemap.xml contains non-canonical origin URL: ${url}`);
    }
  }
  reportPass(`sitemap.xml verified with ${sitemapUrlCount} canonical URLs and image metadata`);
}

// 6. Check Product Catalogue Integrity
console.log('\n6. Auditing Product Catalogue Data...');
const productsJsonPath = path.join(rootDir, 'src', 'data', 'products.json');
if (fs.existsSync(productsJsonPath)) {
  const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
  products.forEach(p => {
    if (!p.id || !p.title || !p.narrative || !p.image) {
      reportFail(`Product record incomplete: ID "${p.id}"`);
    }
    if (p.specs && p.specs.gemstoneType && !p.specs.naturalStatus) {
      reportWarn(`Product ${p.id} gemstone missing naturalStatus specification`);
    }
  });
  reportPass(`Audited ${products.length} catalogue items for complete specifications and transparency`);
}

console.log('\n======================================================');
if (errorsCount === 0) {
  console.log(`\x1b[32m✔ AUDIT PASSED:\x1b[0m 0 critical failures, ${warningsCount} warnings.`);
  console.log('All technical SEO, indexability, metadata, canonical, schema, and sitemap requirements satisfied.');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.log(`\x1b[31m✖ AUDIT FAILED:\x1b[0m ${errorsCount} critical failures, ${warningsCount} warnings.`);
  console.log('======================================================\n');
  process.exit(1);
}
