import axios from 'axios';
import store from './store'

const instance = axios.create();

instance.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (error.response.status === 400 && error.response.data && error.response.data.Message && error.response.data.Message.toLowerCase().indexOf('invalid session id') >= 0) {
        store.commit('logout')
    }
    return Promise.reject(error.response)
})

export default instance; // export axios instance to be imported in your app
