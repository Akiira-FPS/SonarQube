import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import VueApexCharts from 'vue3-apexcharts'
import components from './components'

const app = createApp(App)

app.use(router)

// Preset "Rose" : remplace la palette primaire par les tokens `rose.*`
const RosePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{rose.50}',
      100: '{rose.100}',
      200: '{rose.200}',
      300: '{rose.300}',
      400: '{rose.400}',
      500: '{rose.500}',
      600: '{rose.600}',
      700: '{rose.700}',
      800: '{rose.800}',
      900: '{rose.900}',
      950: '{rose.950}',
    },
  },
})

app.use(PrimeVue, {
  theme: {
    preset: RosePreset,
    options: {
      // Garder une config simple : les variables CSS PrimeVue seront préfixées en `--p-*`
      prefix: 'p',
      darkModeSelector: 'system',
    },
  },
})

for (const [name, component] of Object.entries(components)) {
  app.component(name, component)
}

app.component('ApexChart', VueApexCharts)
app.mount('#app')
