import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import ReadCustomer from './components/ReadCustomer.vue'
import ReadProduct from './components/ReadProduct.vue'
import Home from './components/Home.vue'

export default new Router({
    routes: [
      {
        path: '/',
        name: 'home',
        component: Home
      },
      {
        path: '/read-customer',
        name: 'readCustomer',
        component: ReadCustomer
      },
      {
        path: '/read-product',
        name: 'readProduct',
        component: ReadProduct
      }
    ]
  })
  