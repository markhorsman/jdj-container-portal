import axios from 'axios';
import app from './main'; // import the instance
import store from './store'

const instance = axios.create();

instance.interceptors.request.use(config => {
    app.$Progress.start(); // for every request start the progress
    return config;
});

instance.interceptors.response.use(response => {
    app.$Progress.finish(); // finish when a response is received
    return response
}, error => {
    // if (error.response.status === 400)
    //   store.commit('logout')
    app.$Progress.finish()
    return Promise.reject(error.response)
});

export default instance; // export axios instance to be imported in your app
