import axios from 'axios';
import store from './store'
import { eventHub } from './eventhub'

const instance = axios.create();

instance.interceptors.request.use(
    conf => {
        if (!conf.headers.skipLoader) {
            eventHub.$emit('before-request');
        } else {
            delete conf.headers.skipLoader;
        }

        return conf;
    },
    error => {
        eventHub.$emit('request-error');
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(function (response) {
    eventHub.$emit('after-response');
    return response;
}, function (error) {
    eventHub.$emit('response-error');
    if (error.response.status === 400 && error.response.data && error.response.data.Message && error.response.data.Message.toLowerCase().indexOf('invalid session id') >= 0) {
        store.commit('logout')
    }
    return Promise.reject(error.response)
})

export default instance;
