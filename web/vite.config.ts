import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/pilgrims-progress/' : './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    // Chunk splitting: separate heavy vendor libs from game code
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-phaser': ['phaser'],
          'vendor-ink': ['inkjs'],
          'vendor-storage': ['localforage'],
          'vendor-audio': ['howler'],
        },
      },
    },
    // Raise warning threshold; Phaser itself is ~2.7 MB
    chunkSizeWarningLimit: 3000,
  },
  server: {
    port: 3000,
    open: false,
  },
});
