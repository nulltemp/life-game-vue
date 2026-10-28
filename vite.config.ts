/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// Regenerates public/sitemap.xml at build time so <lastmod> is always current
// instead of a hand-maintained date that drifts out of sync on deploy.
function sitemapPlugin(): Plugin {
  return {
    name: 'life-game-sitemap',
    apply: 'build',
    closeBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://life-game-vue.nulltemp.com/</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`
      writeFileSync(resolve(rootDir, 'public', 'sitemap.xml'), sitemap)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), sitemapPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    server: {
      // Vuetify ships .css imports inside its components; let Vite process them when mounting in tests
      deps: { inline: ['vuetify'] },
    },
  },
})
