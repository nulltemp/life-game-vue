import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginCypress from 'eslint-plugin-cypress'
import prettierConfig from '@vue/eslint-config-prettier'

export default defineConfigWithVueTs(
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue}'],
  },
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    ...pluginCypress.configs.recommended,
    files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
  },
  prettierConfig,
  {
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['src/components/Note.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
