import { resolve } from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

// Dynamically discover all generated static product pages
const productsDir = resolve(__dirname, 'products');
const productInputs = {};
if (fs.existsSync(productsDir)) {
  fs.readdirSync(productsDir)
    .filter(file => file.endsWith('.html'))
    .forEach(file => {
      const name = 'product_' + file.replace('.html', '');
      productInputs[name] = resolve(productsDir, file);
    });
}

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        collections: resolve(__dirname, 'collections.html'),
        product: resolve(__dirname, 'product.html'),
        gemstoneGuide: resolve(__dirname, 'gemstone-guide.html'),
        bespoke: resolve(__dirname, 'bespoke.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        orderConfirmation: resolve(__dirname, 'order-confirmation.html'),
        consultations: resolve(__dirname, 'consultations.html'),
        trackOrder: resolve(__dirname, 'track-order.html'),
        policies: resolve(__dirname, 'policies.html'),
        admin: resolve(__dirname, 'admin.html'),
        notFound: resolve(__dirname, '404.html'),
        ...productInputs
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false
  }
});