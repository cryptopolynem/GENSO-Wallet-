import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        id: "/",
        name: "GENSO Wallet",
        short_name: "GENSO",
        description: "Polygon専用ウォレット GENSO Wallet",
        theme_color: "#6C4CE0",
        background_color: "#0F0B1E",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
