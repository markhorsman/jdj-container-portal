import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import Router from './router'
import axios from 'axios';
import getAPIKey from './api_key';
import VueAxios from 'vue-axios';
import './quasar'

import config from '../config'
import store from './store'

Vue.prototype.$config = config

Vue.use(VueRouter)
Vue.use(VueAxios, axios)

Vue.config.productionTip = false

getAPIKey().then(res => {
  store.commit('updateAPIKey', res.data.SESSIONID)
})

new Vue({
  el: '#app',
  render: h => h(App),
  router: Router,
  store,
})

