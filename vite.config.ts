/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // Fonts precache too, so the meadow looks right offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // The heavy 3D-garden chunk is NOT precached on install (that would
        // bloat the PWA install for kids who may never open the garden) — it's
        // cached on first visit to the garden instead.
        globIgnores: ['**/Garden3D-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/Garden3D-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'garden-3d',
              expiration: { maxEntries: 4 },
            },
          },
        ],
      },
      manifest: {
        name: 'Number Meadow',
        short_name: 'Meadow',
        description: 'A gentle, audio-first counting game for young children.',
        theme_color: '#7C5CFF',
        background_color: '#FFE9C7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    // Pure-logic unit tests (generators, mastery gate). jsdom lets future
    // component tests share the same runner.
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
