import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Vuelidate from 'vuelidate'
import { Notify } from 'quasar'
import VueOffline from 'vue-offline'
import * as Promise from 'bluebird';
import './quasar'


import axios from './api-axios'
import config from '../config'
import store from './store'
import storage from 'electron-json-storage'
import os from 'os'
import log from 'electron-log'

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

storage.setDataPath(os.tmpdir());

export default new Vue({
  el: '#app',
  data: {
    refreshing: false,
    interval: null,
    refresh: 5 * 60 * 1000, // 5 minutes
    cache: {
      stock: {
        top: 100,
        concurrency: 6,
        fields: ['RECID', 'PGROUP', 'GRPCODE', 'ITEMNO', 'DESC1', 'DESC2', 'DESC3', 'STATUS', 'STKLEVEL', 'CURRDEPOT'],
        total: 0
      }
    }
  },
  methods: {
    refreshSession() {
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
    },

    async buildCache() {
      if (this.isOffline) return;

      let stock = []
      const list = [];

      storage.setDataPath(`${os.tmpdir()}/insphire/stock`);
      this.cache.stock.total = await this.getStockTotal();

      if (!this.cache.stock.total) return;

      const iterations = Math.ceil(this.cache.stock.total / this.cache.stock.top);
      const max = this.cache.stock.top;
      for (let i = 0; i < iterations; i++) {
        list.push(i * max);
      }

      const throat = require('throat')(Promise);
      const data = await Promise.all(list.map(throat(this.cache.stock.concurrency, skip => this.getStockItems(max, skip))));
      stock = data.reduce((acc, a) => {
        acc.push.apply(acc, a);
        return acc;
      }, [])

      storage.set('stock_all', stock, err => {
        if (err) {
          log.error(err);
        }
        else {
          log.info(`${stock.length} stock records saved to disk`);
        }
      });
    },

    async getStockItems(top = 100, skip = 0) {
      if (this.isOffline) return Promise.resolve([]);

      let res;
      try {
        res = await this.$api
          .get(
            `${this.$config.api_base_url}stock?api_key=${
            this.$store.state.api_key
            }&$top=${top}&$skip=${skip}&$filter=CURRDEPOT eq '${this.$store.state.user.DEPOT}'&fields=${this.cache.stock.fields.join(',')}`,
            {
              headers: {
                skipLoader: true,
                skipCache: true
              }
            }
          );
      } catch (e) {
        log.error(e);
      }

      if (!res || !res.data) return [];

      res.data.forEach(item => {
        storage.set(item.ITEMNO, item, err => {
          if (err) {
            log.error(err);
          }
        });
      })

      return res.data;
    },

    async getStockTotal() {
      if (this.isOffline) return Promose.resolve([]);

      let res;
      try {
        res = await this.$api
          .get(
            `${this.$config.api_base_url}stock?api_key=${
            this.$store.state.api_key
            }&$top=1&$skip=0&$inlinecount=allpages&$filter=CURRDEPOT eq '${this.$store.state.user.DEPOT}'`,
            {
              headers: {
                skipLoader: true,
                skipCache: true
              }
            }
          );
      } catch (e) {
        log.error(e);
      }

      if (!res || !res.data) return 0;

      return res.data.totalCount;
    }
  },
  mounted() {
    this.$store.commit("updateNetworkStatus", this.isOffline);
  
    this.$on("offline", () => {
      this.$store.commit("updateNetworkStatus", true);
    });

    this.$on("online", () => {
      this.$store.commit("updateNetworkStatus", false);
    });

    this.refreshSession();
    this.buildCache();

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

