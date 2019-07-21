import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueProgressBar from 'vue-progressbar'
import Notifications from 'vue-notification'
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
Vue.use(Notifications)

Vue.config.productionTip = false

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
          `${this.$config.api_base_url}users?api_key=${this.$store.state.api_key}`
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

