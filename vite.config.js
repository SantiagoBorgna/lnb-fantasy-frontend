import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'screenshots/*.png'],
      manifest: false,  // Usamos nuestro manifest.json manual
      workbox: {
        // Cachear assets estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Estrategia de cache para la API — Network First
        // (siempre intenta red, fallback a cache si no hay conexión)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lnb-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,  // 1 hora
              },
            },
          },
        ],
      },
    }),
  ],
})