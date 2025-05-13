import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SONAR_URL
const isDev = process.env.NODE_ENV !== 'production'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: isDev
    ? {
        proxy: {
          '/api': {
            target: url,
          },
        },
      }
    : undefined,
})
