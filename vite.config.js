import { resolve } from 'path';
import { defineConfig } from 'vite';

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
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false
  }
});
