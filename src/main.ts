import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'
import './backgrounds/styles/index.css'

createApp(App).use(createPinia()).mount('#app')
