import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// @ts-ignore
import 'vuetify/styles'
// @ts-ignore
import '@mdi/font/css/materialdesignicons.css'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{ path: '/', component: App },
]
const router = createRouter({
	history: createWebHistory(),
	routes,
})

const vuetify = createVuetify({
	components,
	directives,
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')
