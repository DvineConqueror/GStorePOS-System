import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      includeAssets: [
        'favicon.ico', 
        'images/Cashier_Logo.png',
        'splash.css',
        'robots.txt'
      ],
      manifest: {
        name: 'Smart Grocery POS',
        short_name: 'Smart Grocery POS',
        description: 'Professional grocery store point of sale system',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'images/Cashier_Logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'images/Cashier_Logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'images/Cashier_Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'images/Cashier_Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
        screenshots: [],
        shortcuts: [
          {
            name: 'POS System',
            short_name: 'POS',
            description: 'Access the point of sale system',
            url: '/pos',
            icons: [
              {
                src: 'images/Cashier_Logo.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Manager dashboard',
            url: '/dashboard',
            icons: [
              {
                src: 'images/Cashier_Logo.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
