import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import VueApexCharts from 'vue3-apexcharts'
import components from './components'

const app = createApp(App)

app.use(router)
app.use(PrimeVue)

for (const [name, component] of Object.entries(components)) {
  app.component(name, component)
}

app.component('ApexChart', VueApexCharts)
app.mount('#app')
