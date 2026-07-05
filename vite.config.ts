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
        // Recorded VO clips (public/vo/*.mp3) must work offline too.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,mp3}'],
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
