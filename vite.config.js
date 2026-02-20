import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    mkcert(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    https: true, // Required for WebRTC/microphone on other devices
    host: true, // Expose on LAN (e.g. https://192.168.40.179:5173)
    proxy: {
      '/api': {
        target: 'https://officeapi.samis.co.ke',
        changeOrigin: true,
        secure: false, // only if you're using self-signed certificates
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})