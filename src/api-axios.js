import axios from 'axios';
import store from './store'
import { eventHub } from './eventhub'
import parser from 'odata-parser'
import getStock from './axios-cache/stock';
import getCustomerContact from './axios-cache/customerContact'

const instance = axios.create({
    timeout: 10000
});

const prepOdataInput = url => {
    let parts = url.split('&');
    if (!parts || !parts.length) return false;

    parts = url.split(parts[0]);
    if (!parts || !parts.length) return false;

    return parts[1].replace(/\n|\r/g, "").replace(/\s{2,}/g, "").replace("$fields", "$select").substring(1);
};

const setResponse = conf => () => {
    return Promise.resolve({
        data: conf.data,
        status: 200,
        statusText: "OK",
        headers: conf.headers,
        config: conf,
        request: conf
    });
};

instance.interceptors.request.use(
    conf => {
        if (!conf.headers.skipLoader) {
            eventHub.$emit('before-request');
        } else {
            delete conf.headers.skipLoader;
        }

        if (conf.headers && conf.headers.skipCache || !store.state.offline) {
            if (conf.headers && conf.headers.hasOwnProperty('skipCache')) {
                delete conf.headers.skipCache;
            }

            if (store.state.offline) {
                conf.adapter = setResponse(conf);
                return conf;
            }

            return conf;
        }

        if (conf.method.toLowerCase() !== 'get') {
            // TODO: add some requests to queue
            conf.adapter = setResponse(conf);
            return conf;
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

        if (conf.url.indexOf('stock') === -1) {
            conf.adapter = setResponse(conf);
            return conf;
        }

        const input = prepOdataInput(conf.url);

        if (!input) {
            conf.adapter = setResponse(conf);
            return conf;
        }

        let odata;
        try {
            odata = parser.parse(input);
        } catch (e) {
            console.log(e.message);
            odata = false;
        }
        if (!odata) {
            conf.adapter = setResponse(conf);
            return conf;
        }

        return getStock(odata)
            .then(data => {
                conf.data = data;
                conf.adapter = setResponse(conf);

                return conf;
            });
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
