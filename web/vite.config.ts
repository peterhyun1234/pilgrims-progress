import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/pilgrims-progress/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
    open: true,
  },
});
