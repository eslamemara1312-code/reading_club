import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Reading Club — نادي القراءة اليومي',
        short_name: 'ReadingClub',
        description: 'تطبيق متابعة القراءة اليومية والجماعية',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'ar',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // The PDF engine is only needed on the reader route. Cache it after the
        // first reader visit instead of downloading several megabytes when the
        // service worker is installed.
        globIgnores: [
          '**/*.wasm',
          '**/assets/pdf-reader-*.js',
          '**/assets/direct-engine-*.js',
          '**/assets/worker-engine-*.js',
          '**/assets/browser-*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(?:pdf-reader-|direct-engine-|worker-engine-|browser-|pdfium-)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-reader-assets',
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@embedpdf/') || id.includes('pdfjs-dist') || id.includes('react-pdf')) {
            return 'pdf-reader';
          }
        },
      },
    },
  },
});
