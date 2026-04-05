import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png", "hero.jpg"],
      manifest: {
        name: "RouteWeigh",
        short_name: "RouteWeigh",
        description: "Know Before You Go — compare driving scenarios by time and cost",
        theme_color: "#1F2937",
        background_color: "#D5DFEB",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icon-192.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "google-maps",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
});
