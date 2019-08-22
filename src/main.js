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
Vue.use(require('vue-shortkey'))

Vue.config.productionTip = false

Notify.setDefaults({
  timeout: 15000,
  textColor: 'white',
  actions: [{ icon: 'close', color: 'white' }]
})

storage.setDataPath(os.tmpdir());
const throat = require('throat')(Promise);

export default new Vue({
  el: '#app',
  data: {
    caching: false,
    cacheInterval: null,
    cacheTime: 15 * 60 * 1000,
    cache: {
      stock: {
        top: 100,
        concurrency: 3,
        fields: ['RECID', 'PGROUP', 'GRPCODE', 'ITEMNO', 'DESC1', 'DESC2', 'DESC3', 'STATUS', 'STKLEVEL', 'CURRDEPOT', 'UNIQUE'],
        total: 0
      },
      contitems: {
        top: 100,
        concurrency: 3,
        fields: ['RECID', 'RECORDER', 'CONTNO', 'ITEMNO', 'ITEMDESC', 'ITEMDESC2', 'ITEMDESC3', 'STATUS', 'QTY', 'QTYRETD', 'MEMO'],
        total: 0
      }
    }
  },
  methods: {

    async setStorage(key, val) {
      return await new Promise((resolve, reject) => {
        storage.set(key, val, err => {
          if (err) return reject(err);
          resolve();
        });
      });
    },

    async buildCache() {
      if (this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT ||
        this.caching
      ) return;

      await this.cacheFAQItems();
      await this.buildContItemCache();
      await this.buildStockCache();
      await this.buildCustomerContactCache();
    },

    async cacheFAQItems() {
      let result;
      try {
        result = await this.$api
          .get(
            `https://spreadsheets.google.com/feeds/cells/${this.$config.spreadsheet_id}/1/public/full?alt=json`,
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

      if (!result || !result.data) return;

      storage.setDataPath(`${os.tmpdir()}/insphire/FAQ`);

      try {
        await this.setStorage('FAQ', result.data);
        log.info(`FAQ data saved to disk`);
      } catch (e) {
        log.error(e);
      }
    },

    async buildStockCache() {
      if (this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) return [];

      let stock = []
      const list = [];

      this.cache.stock.total = await this.getStockTotal();

      if (!this.cache.stock.total) return [];

      storage.setDataPath(`${os.tmpdir()}/insphire/stock/${this.$store.state.user.DEPOT}`);

      const iterations = Math.ceil(this.cache.stock.total / this.cache.stock.top);
      const max = this.cache.stock.top;
      for (let i = 0; i < iterations; i++) {
        list.push(i * max);
      }

      const data = await Promise.all(list.map(throat(this.cache.stock.concurrency, skip => this.getStockItems(max, skip))));
      stock = data.reduce((acc, a) => {
        acc.push.apply(acc, a);
        return acc;
      }, [])

      try {
        await this.setStorage('stock_all', stock);
        log.info(`${stock.length} stock records saved to disk`);
      } catch (e) {
        log.error(e);
      }
    },

    async buildContItemCache() {
      if (this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) return [];

      let items = []
      const list = [];

      this.cache.contitems.total = await this.getContItemsTotal();

      if (!this.cache.contitems.total) return;

      storage.setDataPath(`${os.tmpdir()}/insphire/contitems/${this.$config.default_contract_number}`);

      const iterations = Math.ceil(this.cache.contitems.total / this.cache.contitems.top);
      const max = this.cache.contitems.top;
      for (let i = 0; i < iterations; i++) {
        list.push(i * max);
      }

      const data = await Promise.all(list.map(throat(this.cache.contitems.concurrency, skip => this.getContItems(max, skip))));
      items = data.reduce((acc, a) => {
        acc.push.apply(acc, a);
        return acc;
      }, [])

      try {
        await this.setStorage('contitems_all', items);
        log.info(`${items.length} contitem records saved to disk`);
      } catch (e) {
        log.error(e);
      }
    },

    async buildCustomerContactCache() {
      storage.setDataPath(`${os.tmpdir()}/insphire/customercontact`);
      const customerContacts = await this.getCustomerContacts();
      try {
        await this.setStorage('customercontact_all', customerContacts);
        log.info(`${customerContacts.length} customercontact records saved to disk`);
      } catch (e) {
        log.error(e);
      }
    },

    async getStockItems(top = 100, skip = 0) {
      if (
        this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) {
        return Promise.resolve([]);
      }

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

      res.data.forEach(async item => {
        try {
          if (item.ITEMNO) {
            await this.setStorage(item.ITEMNO, item);
          }
        } catch (e) {
          log.error(e);
        }
      });

      return res.data;
    },

    async getStockTotal() {
      if (
        this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) {
        return Promise.resolve(0);
      }

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
    },

    async getCustomerContacts() {
      if (this.isOffline) return Promise.resolve([]);

      let res;

      try {
        res = await this.$api
          .get(
            `${this.$config.container_api_base_url}customercontact`,
            {
              auth: this.$config.container_api_basic_auth,
              headers: {
                skipLoader: true,
                skipCache: true
              }
            }
          )
      } catch (e) {
        log.error(e);
      }

      if (res && res.data && res.data.data) {
        res.data.data.forEach(async item => {
          try {
            if (item.REFERENCE) {
              await this.setStorage(item.REFERENCE, item);
            }
          } catch (e) {
            log.error(e);
          }
        });

        return res.data.data;
      }

      return [];
    },

    async getContItems(top = 100, skip = 0) {
      if (
        this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) {
        return Promise.resolve([]);
      }

      let res;

      try {
        res = await this.$api
          .get(
            `${this.$config.api_base_url}contracts/${
            this.$config.default_contract_number
            }/items?api_key=${
            this.$store.state.api_key
            }&$top=${top}&$skip=${skip}&fields=${this.cache.contitems.fields.join(',')}`
            , {
              headers: {
                skipLoader: true,
                skipCache: true
              }
            })
      } catch (e) {
        log.error(e);
      }

      if (res && res.data) {
        return res.data;
      }

      return [];
    },

    async getContItemsTotal() {
      if (
        this.isOffline ||
        !this.$store.state.api_key ||
        !this.$store.state.user ||
        !this.$store.state.user.DEPOT
      ) {
        return Promise.resolve(0);
      }

      let res;
      try {
        res = await this.$api
          .get(
            `${this.$config.api_base_url}contracts/${
            this.$config.default_contract_number
            }/items?api_key=${
            this.$store.state.api_key
            }&$top=1&$skip=0&$inlinecount=allpages&fields=RECID,ITEMNO`
            , {
              headers: {
                skipLoader: true,
                skipCache: true
              }
            });
      } catch (e) {
        log.error(e);
      }

      if (!res || !res.data) return 0;

      return res.data.totalCount;
    },
  },
  async mounted() {
    this.$store.commit("updateNetworkStatus", this.isOffline);

    this.$on("offline", () => {
      this.$store.commit("updateNetworkStatus", true);
    });

    this.$on("online", () => {
      this.$store.commit("updateNetworkStatus", false);
    });

    await this.buildCache();

    this.cacheInterval = setInterval(async function () {
      await this.buildCache();
    }.bind(this), this.cacheTime);
  },
  destroyed() {
    if (this.cacheInterval) clearInterval(this.cacheInterval);
  },
  render: h => h(App),
  router,
  store,
})

