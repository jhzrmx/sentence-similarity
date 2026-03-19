import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'

const crossOriginHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
} as const

const repositoryTarget = 'sentence-similarity/'

// COOP/COEP enable SharedArrayBuffer for Wllama multi-thread WASM
export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Sentence Similarity',
        short_name: 'Sentence Similarity',
        description:
          'Compare sentences to a target with local embeddings (Wllama, browser-only)',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: `/${repositoryTarget}`,
        scope: `/${repositoryTarget}`,
        icons: [
          {
            src: `/${repositoryTarget}favicon.ico`,
            sizes: 'any',
            type: 'image/ico',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.gguf'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'model-cache',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === 'cdn.jsdelivr.net' &&
              url.pathname.includes('@wllama/wllama') &&
              url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wllama-wasm',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: `/${repositoryTarget}`,
  build: {
    target: 'esnext',
  },
  server: {
    headers: crossOriginHeaders,
  },
  preview: {
    headers: crossOriginHeaders,
  },
  optimizeDeps: {
    exclude: ['@wllama/wllama'],
  },
})