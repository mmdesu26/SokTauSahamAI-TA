// Import fungsi defineConfig dari Vite
// Digunakan untuk mendefinisikan konfigurasi project
import { defineConfig } from 'vite'

// Import plugin React untuk Vite
// Agar Vite bisa compile JSX dan fitur React lainnya
import react from '@vitejs/plugin-react'

// Import plugin Tailwind CSS untuk integrasi dengan Vite
import tailwindcss from '@tailwindcss/vite'

// Import path untuk resolve path folder
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // =========================
  // PLUGINS
  // =========================
  plugins: [
    react(),        // Plugin React
    tailwindcss(),  // Plugin Tailwind CSS
  ],

  // =========================
  // DEV SERVER CONFIG
  // =========================
  server: {
    // Port default Vite dev server
    port: 5173,

    // host: true → agar bisa diakses dari jaringan luar (LAN / ngrok)
    host: true,

    // Proxy API (frontend → backend Flask)
    proxy: {
      '/api': {
        // Semua request ke /api akan diteruskan ke backend
        target: 'http://127.0.0.1:5000',

        // Mengubah origin header agar sesuai target
        changeOrigin: true,

        // disable SSL verification (untuk development)
        secure: false,
      }
    },

    // Daftar host yang diizinkan (contoh: untuk akses via ngrok)
    allowedHosts: [
      'flukey-donald-unsubscribing.ngrok-free.dev'
    ],
  },

  // =========================
  // PATH RESOLUTION
  // =========================
  resolve: {
    alias: {
      // Alias '@' → ke folder src
      // Jadi import bisa seperti:
      // import Component from '@/components/Component'
      '@': path.resolve(__dirname, './src'),
    },

    // Mencegah duplicate instance React (bug umum di Vite)
    dedupe: ['react', 'react-dom'],
  },

  // =========================
  // DEPENDENCY OPTIMIZATION
  // =========================
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'recharts', // library chart → pre-bundle biar lebih cepat
    ],
  },

  // =========================
  // BUILD CONFIG
  // =========================
  build: {
    commonjsOptions: {
      // Pastikan semua node_modules bisa di-handle CommonJS
      include: [/node_modules/],
    },
  },
})