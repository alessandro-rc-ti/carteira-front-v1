import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Polling necessário no macOS+Docker Desktop: inotify não propaga
    // eventos de bind mount para dentro da VM Linux. Com usePolling o
    // Vite detecta qualquer alteração de arquivo e dispara HMR.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
