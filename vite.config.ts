/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

const SITE_URL = 'https://life-game-vue.nulltemp.com/'

// The date (YYYY-MM-DD) of the last commit, falling back to the build date
// when git history isn't available
const lastModified = (): string => {
  try {
    const date = execSync('git log -1 --format=%cs', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
  } catch {
    // not a git checkout
  }
  return new Date().toISOString().slice(0, 10)
}

// Writes dist/sitemap.xml at build time, so <lastmod> never goes stale
const sitemap = (): Plugin => ({
  name: 'sitemap',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${lastModified()}</lastmod>
  </url>
</urlset>
`,
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  // autoImport: import only the Vuetify components/directives used in templates
  plugins: [vue(), vuetify({ autoImport: true }), sitemap()],
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
