import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Login from '../components/Login.vue'
// import ReadCustomer from '../components/ReadCustomer.vue'
// import ReadProduct from '../components/ReadProduct.vue'
import Rental from '../components/Rental.vue'
import Home from '../components/Home.vue'

const routes = [
  {
    path: "/index.html",
    redirect: "/"
  },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'login',
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

      if (to.matched.some(record => record.meta.is_admin)) {
        if (user.is_admin == 1)
          next()
        else
          next({ name: 'home' })
      } else {
        next()
      }
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (localStorage.getItem('api_key') == null)
      next()
    else
      next({ name: 'home' })
  } else {
    next()
  }
})

export default router