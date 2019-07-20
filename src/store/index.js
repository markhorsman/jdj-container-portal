import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        connected: false,
        api_key: localStorage.getItem('api_key') || null,
        customer: null,
    },
    mutations: {
        updateAPIKey(state, key) {
            state.api_key = key
            localStorage.setItem('api_key', key)
        },
        updateCustomer(state, customer) {
            state.customer = customer
        }
    }
})
