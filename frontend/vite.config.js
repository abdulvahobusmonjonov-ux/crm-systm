import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Next.js'dagi bilan bir xil alias — ko'chirilgan fayllardagi "@/lib/utils"
    // kabi importlar o'zgarishsiz ishlashi uchun.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // strictPort: false — 5173 band bo'lsa Vite keyingi bo'sh portga o'tadi.
    // Backend'ning CORS sozlamasi har qanday localhost portiga ruxsat bergani
    // uchun bu ulanishni buzmaydi (backend/src/server.js).
    port: 5173,
    strictPort: false,
    host: true,
  },
})
