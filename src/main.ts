// Vuetify: components and directives are imported on demand by
// vite-plugin-vuetify (autoImport in vite.config.ts), so only the ones used are bundled.
// Import the base styles before App, so the components' own CSS comes after them.
// Only the core styles: the utility and color classes in use are in ./styles/utilities.css
import 'vuetify/styles/core'
import './styles/utilities.css'
import { createVuetify } from 'vuetify'

import { createApp } from 'vue'
import App from './App.vue'

const vuetify = createVuetify()

const app = createApp(App)

app.use(vuetify)

app.mount('#app')
