const throat = require("throat")(Promise);
import log from "electron-log";
import axios from './api-axios'
import config from '../config'

const buildItemNumberFilter = data => data.reduce((filter, p, i) => {
    if (!filter.length) filter = `(ITEMNO eq '${p.ITEMNO}'`;
    else filter += ` or ITEMNO eq '${p.ITEMNO}'`;

    if (i === (data.length - 1)) filter += ')';
    return filter;
}, '')
    ;

const getStockLevel = async (key, depot, products) => {
    let result;

    try {
        result = await axios.get(
            `${config.api_base_url}stockdepots?api_key=${key}&$filter=${buildItemNumberFilter(products)} and CODE eq '${depot}'&fields=ITEMNO,STKLEVEL`
        );
    } catch (e) {
        log.error(e);
        result = null;
    }

    return result ? result.data : [];
};

const getStockLevelForProducts = async (key, depot, products) => {
    const max = 50;
    const iterations = Math.ceil(products.length / max);
    const chunks = [];

    for (let i = 0; i < iterations; i++) {
        chunks.push(products.splice(0, max));
    }

    const data = await Promise.all(
        chunks.map(throat(3, c => getStockLevel(key, depot, c)))
    );

    return [].concat.apply([], data);
};

export {
    getStockLevelForProducts
}