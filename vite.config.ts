/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  // autoImport: import only the Vuetify components/directives used in templates
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    root: 'src',
    environment: 'jsdom',
    server: {
      // Vuetify ships .css imports inside its components; let Vite process them when mounting in tests
      deps: { inline: ['vuetify'] },
    },
  },
})
