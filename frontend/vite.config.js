import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0',        // ให้ Docker network เข้าถึงได้
    strictPort: true,
    watch: {
      usePolling: true,      // ใช้ polling สำหรับ Docker volumes (Windows/macOS)
    },
    proxy: {
      // Local dev: /api/* → backend ที่ localhost:5000/api/*
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
