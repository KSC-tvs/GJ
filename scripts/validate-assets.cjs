/**
 * Build-time / CI Media & Asset Validation Script
 * Gulshan Jewellers | Est. 1950
 * Validates that every local asset (images, icons, vectors) referenced in HTML, CSS, JS, and JSON exists.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

function getFiles(dir, exts = ['.html', '.js', '.cjs', '.json', '.css']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.system_generated', 'brain'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = getFiles(rootDir);
const assetRegex = /(?:src=|href=|image["':\s]+|Image["':\s]+|url\()['"]([^'")]+\.(?:jpg|jpeg|png|webp|svg|gif|ico))['"]/gi;

let totalReferences = 0;
let errors = [];

console.log('======================================================');
console.log(' GULSHAN JEWELLERS — ASSET & MEDIA INTEGRITY AUDIT');
console.log('======================================================');

allFiles.forEach(filePath => {
  const relFile = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = assetRegex.exec(content)) !== null) {
    const rawAsset = match[1].trim();
    if (rawAsset.startsWith('http://') || rawAsset.startsWith('https://') || rawAsset.startsWith('data:')) {
      continue;
    }

    totalReferences++;
    const cleanAsset = rawAsset.replace(/^\$\{[^}]+\}/, '').replace(/^(\.\.\/|\.\/|\/)/, '');
    
    // Check possible locations:
    // 1. in public/
    // 2. relative to file
    // 3. relative to root
    const inPublic = fs.existsSync(path.join(publicDir, cleanAsset));
    const inRoot = fs.existsSync(path.join(rootDir, cleanAsset));
    const inRelative = fs.existsSync(path.resolve(path.dirname(filePath), rawAsset));

    if (!inPublic && !inRoot && !inRelative) {
      errors.push({
        file: relFile,
        asset: rawAsset,
        clean: cleanAsset
      });
    }
  }
});

if (errors.length > 0) {
  console.error(`\n❌ ASSET VALIDATION FAILED: Found ${errors.length} broken/missing asset references:`);
  errors.forEach(err => {
    console.error(`  - ${err.file}: Cannot find "${err.asset}"`);
  });
  console.error('\nPlease ensure all referenced assets exist in public/ or local paths.');
  process.exit(1);
} else {
  console.log(`\n✔ ASSET VALIDATION PASSED: Verified ${totalReferences} local media & asset references across ${allFiles.length} project files.`);
  console.log('All images, product gallery assets, favicons, and vector emblems are present and verified.\n');
  process.exit(0);
}
