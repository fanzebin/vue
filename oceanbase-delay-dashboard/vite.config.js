import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: ['@antv/g2', 'datav-vue3']
  }
})
