// Vuetify: components and directives are imported on demand by
// vite-plugin-vuetify (autoImport in vite.config.ts), so only the ones used are bundled.
// Import the base styles before App, so the components' own CSS comes after them
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

import { createApp } from 'vue'
import App from './App.vue'

const vuetify = createVuetify()

const app = createApp(App)

app.use(vuetify)

app.mount('#app')
