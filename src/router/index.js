import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Login from '../components/Login.vue'
import Rental from '../components/Rental.vue'
import Items from '../components/Items.vue'
import Home from '../components/Home.vue'
import Stock from '../components/Stock.vue'
import StockCount from '../components/StockCount.vue'
import CustomerContact from '../components/CustomerContact.vue'
import StockTransfer from '../components/StockTransfer.vue'
import Settings from '../components/Settings.vue'

const routes = [
  {
    path: "/index.html",
    redirect: "/"
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      guest: true
    }
  },
  {
    path: '/rental',
    name: 'Rental',
    component: Rental,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/items',
    name: 'Items',
    component: Items,
    meta: {
      requiresAuth: true,
      isAdmin: true
    }
  },
  {
    path: '/stock',
    name: 'Stock',
    component: Stock,
    meta: {
      requiresAuth: true,
      isAdmin: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      requiresAuth: true,
      isAdmin: true
    }
  },
  {
    path: '/stocktransfer',
    name: 'StockTransfer',
    component: StockTransfer,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/stockcount',
    name: 'StockCount',
    component: StockCount,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/customercontact',
    name: 'CustomerContact',
    component: CustomerContact,
    meta: {
      requiresAuth: true,
      isAdmin: true
    }
  },
]

const router = new Router({
  mode: 'history',
  base: __dirname,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (localStorage.getItem('api_key') == null) {
      next({
        path: '/login',
        params: { nextUrl: to.fullPath }
      })
    } else {
      let user = JSON.parse(localStorage.getItem('user'))

      if (to.matched.some(record => !record.meta.isAdmin)) {
        if (!user.GRPCODE || user.GRPCODE === 'API') {
          next()
        } else {
          next({ name: 'Home' })
        }

      } else {
        next()
      }
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (localStorage.getItem('api_key') == null)
      next()
    else
      next({ name: 'Home' })
  } else {
    next()
  }
})

export default router