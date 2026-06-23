import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('chart.js') || id.includes('vue-chartjs')) {
            return 'charts'
          }

          if (id.includes('vuetify') || id.includes('@mdi/font')) {
            return 'vuetify'
          }

          if (id.includes('vue')) {
            return 'vue-core'
          }
        },
      },
    },
  },
})
