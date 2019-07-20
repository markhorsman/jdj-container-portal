import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueProgressBar from 'vue-progressbar'
import Vuelidate from 'vuelidate'
import './quasar'

import axios from './api-axios'
import config from '../config'
import store from './store'

Vue.prototype.$api = axios
Vue.prototype.$config = config

Vue.use(VueProgressBar, {
  thickness: '3px',
  transition: {
    speed: '0.5s',
    opacity: '0.7s',
    termination: 300
  }
})

Vue.use(Vuelidate)

Vue.config.productionTip = false

export default new Vue({
  el: '#app',
  render: h => h(App),
  router,
  store,
})

