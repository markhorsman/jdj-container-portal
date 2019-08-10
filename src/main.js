import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Vuelidate from 'vuelidate'
import { Notify } from 'quasar'
import VueOffline from 'vue-offline'
import './quasar'


import axios from './api-axios'
import config from '../config'
import store from './store'

Vue.prototype.$api = axios
Vue.prototype.$config = config

Vue.use(Vuelidate)
Vue.use(VueOffline)

Vue.config.productionTip = false

Notify.setDefaults({
  timeout: 0,
  textColor: 'white',
  actions: [{ icon: 'close', color: 'white' }]
})

export default new Vue({
  el: '#app',
  data: {
    refreshing: false,
    interval: null,
    refresh: 5 * 60 * 1000, // 5 minutes
  },
  methods: {
    refreshSession: function () {
      if (!this.$store.state.api_key || this.refreshing) return;
      this.refreshing = true;
      this.$api
        .get(
          `${this.$config.api_base_url}users/?api_key=${this.$store.state.api_key}&top=1`, {
            headers: {
              skipLoader: true
            }
          }
        )
        .finally(() => {
          this.refreshing = false;
        })
    }
  },
  mounted() {
    this.refreshSession();

    this.interval = setInterval(function () {
      this.refreshSession();
    }.bind(this), this.refresh);
  },
  destroyed() {
    if (this.interval) clearInterval(this.interval);
  },
  render: h => h(App),
  router,
  store,
})

