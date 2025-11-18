// main.js
import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import "@fortawesome/fontawesome-free/js/all";
import './axios';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { Chart, registerables } from 'chart.js';

// Register all components of Chart.js globally
Chart.register(...registerables);

// Create the Vue application
const app = createApp(App);

// Create Pinia instance
const pinia = createPinia();

// Create Vuetify instance
const vuetify = createVuetify();

// Use vue-toastification with optional configuration options
app.use(Toast, {
  position: "top-right",
  timeout: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideCloseButton: false,
  closeButton: "button",
  icon: true,
  rtl: false,
});

// Use Vuetify, Pinia, and Router in the app
app.use(vuetify);
app.use(pinia);
app.use(router);

// Mount the app to the DOM element with id="app"
app.mount('#app');