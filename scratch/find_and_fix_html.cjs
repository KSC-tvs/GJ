const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'collections.html',
  'product.html',
  'gemstone-guide.html',
  'bespoke.html',
  'about.html',
  'contact.html',
  'admin.html'
];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace /images/ with images/
  content = content.replace(/(href|src)=["']\/images\//g, '$1="images/');
  content = content.replace(/"\/images\//g, '"images/').replace(/'\/images\//g, "'images/");

  // Replace /src/ with src/
  content = content.replace(/(href|src)=["']\/src\//g, '$1="src/');
  content = content.replace(/"\/src\//g, '"src/').replace(/'\/src\//g, "'src/");

  // Replace /favicon with favicon
  content = content.replace(/(href|src)=["']\/favicon/g, '$1="favicon');

  // Replace /site.webmanifest with site.webmanifest
  content = content.replace(/(href|src)=["']\/site\.webmanifest["']/g, '$1="site.webmanifest"');

  // Replace /apple-touch-icon with apple-touch-icon
  content = content.replace(/(href|src)=["']\/apple-touch-icon/g, '$1="apple-touch-icon');

  // Remove staff portal links from public customer-facing navigation
  if (file !== 'admin.html') {
    content = content.replace(/<a\s+[^>]*href=["']admin\.html["'][^>]*>.*?<\/a>/gis, '');
  }

  // Set theme color to ivory
  content = content.replace(/<meta name="theme-color" content="[^"]*">/g, '<meta name="theme-color" content="#FAF8F5">');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Processed:', file);
});

console.log('All HTML files normalized successfully.');
