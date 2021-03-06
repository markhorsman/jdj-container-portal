import Vue from 'vue'
import Vuex from 'vuex'
import router from '../router'
import config from '../../config'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        connected: false,
        api_key: localStorage.getItem('api_key') || null,
        user: (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null),
        customer: null,
        contract: null,
        rentalProducts: [],
        stockCount: (localStorage.getItem('stockCount') ? JSON.parse(localStorage.getItem('stockCount')) : null),
        offline: false,
        loaderDisabled: false,
        settings: (localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : { contract: { static: true, number: config.default_contract_number } }),
    },

    mutations: {
        login(state, data) {
            state.user = data
            state.api_key = data.SESSIONID
        },

        logout(state) {
            localStorage.removeItem('user')
            localStorage.removeItem('api_key')
            state.user = null
            state.api_key = null
            state.customer = null
            state.rentalProducts = []
            router.push('/login')
        },

        updateCustomer(state, customer) {
            state.customer = customer
        },

        updateContract(state, contract) {
            state.contract = contract;
        },

        updateRentalProducts(state, products) {
            state.rentalProducts = products
        },

        saveStockCount(state, selected) {
            state.stockCount = selected;
            localStorage.setItem('stockCount', JSON.stringify(selected));
        },

        updateNetworkStatus(state, status) {
            state.offline = status;
        },

        updateLoaderState(state, disabled) {
            state.loaderDisabled = disabled;
        },

        updateSettings(state, settings) {
            state.settings = settings;
            localStorage.setItem('settings', JSON.stringify(state.settings));
        },
    }
})
