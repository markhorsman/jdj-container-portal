import axios from 'axios';
import store from './store'
import { eventHub } from './eventhub'
import getStock from './axios-cache/stock';
import getCustomerContact from './axios-cache/customerContact'
import getContItems from './axios-cache/contItem'
import getContracts from './axios-cache/contract'
import getFAQ from './axios-cache/faq'

const instance = axios.create({
    timeout: 60000
});


const setResponse = (conf, status = 200, statusText = "OK") => () => {
    const o = {
        data: conf.data,
        status,
        statusText,
        headers: conf.headers,
        config: conf,
        request: conf
    };

    if (status !== 200) {
        return Promise.reject(o);
    }
    return Promise.resolve(o);
};

instance.interceptors.request.use(
    conf => {
        if (!conf.headers.skipLoader && !store.state.loaderDisabled) {
            eventHub.$emit('before-request');
        } else {
            if (conf.headers && conf.headers.skipLoader) {
                delete conf.headers.skipLoader;
            }
        }

        if (conf.headers && conf.headers.skipCache || !store.state.offline) {
            if (conf.headers && conf.headers.hasOwnProperty('skipCache')) {
                delete conf.headers.skipCache;
            }

            if (store.state.offline) {
                conf.adapter = setResponse(conf, 500, "");
                return conf;
            }

            return conf;
        }

        if (conf.method.toLowerCase() !== 'get') {
            conf.adapter = setResponse(conf, 500, "");
            return conf;
        }

        if (conf.url.indexOf('spreadsheets.google.com') >= 0) {
            return getFAQ()
                .then(data => {
                    conf.data = data;
                    conf.adapter = setResponse(conf);

                    return conf;
                })
        }

        if (conf.url.indexOf('customercontact') >= 0) {
            const urlParts = conf.url.split('/');
            return getCustomerContact(urlParts[urlParts.length - 1])
                .then(data => {
                    conf.data = data;
                    conf.adapter = setResponse(conf);

                    return conf;
                })
        }

        if (conf.url.indexOf('stock') >= 0) {
            return getStock(conf.url)
                .then(data => {
                    conf.data = data;
                    conf.adapter = setResponse(conf);

                    return conf;
                });
        }

        if (conf.url.indexOf('contracts') >= 0 && conf.url.indexOf('items') >= 0) {
            return getContItems(conf.url)
                .then(data => {
                    conf.data = data;
                    conf.adapter = setResponse(conf);

                    return conf;
                });
        } else if (conf.url.indexOf('contracts') >= 0 && conf.url.indexOf('items') < 0) {
            return getContracts(conf.url)
                .then(data => {
                    conf.data = data;
                    conf.adapter = setResponse(conf);

                    return conf;
                });
        }

        conf.adapter = setResponse(conf, 500, "");
        return conf;
    },
    error => {
        eventHub.$emit('request-error');
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(function (response) {
    if (!store.state.loaderDisabled) {
        eventHub.$emit('after-response');
    }

    return response;
}, function (error) {
    if (!store.state.loaderDisabled) {
        eventHub.$emit('response-error');
    }

    if (error.response &&
        error.response.status === 400 &&
        error.response.data &&
        error.response.data.Message &&
        error.response.data.Message.toLowerCase().indexOf('invalid session id') >= 0
    ) {
        store.commit('logout')
    }
    return Promise.reject(error.response)
})

export default instance;
