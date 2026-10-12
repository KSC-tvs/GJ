const fs = require('fs');
const path = require('path');

function getFiles(dir, exts = ['.html', '.js', '.cjs', '.json']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('.');
const imgRegex = /(?:src=|href=|image["':\s]+|Image["':\s]+|url\()['"]([^'")]+\.(?:jpg|jpeg|png|webp|svg|gif|ico))['"]/gi;
const referencedImages = new Map();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const imgPath = match[1];
    if (imgPath.startsWith('http')) continue;
    if (!referencedImages.has(imgPath)) referencedImages.set(imgPath, []);
    referencedImages.get(imgPath).push(f);
  }
});

console.log('Referenced local image paths:');
let missingCount = 0;
for (const [img, refFiles] of referencedImages.entries()) {
  const cleanPath = img.replace(/^(\.\.\/|\.\/|\/)/, '');
  const inPublic = fs.existsSync(path.join('public', cleanPath));
  const inRoot = fs.existsSync(cleanPath);
  const exists = inPublic || inRoot;
  if (!exists) {
    console.log(`MISSING: ${img} in ${refFiles.join(', ')}`);
    missingCount++;
  } else {
    console.log(`EXISTS: ${img}`);
  }
}
console.log(`Total missing: ${missingCount}`);
