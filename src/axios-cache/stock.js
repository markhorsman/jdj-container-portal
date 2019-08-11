import storage from 'electron-json-storage'
import os from 'os'
import parser from 'odata-parser'
import log from 'electron-log'
import { odataFilter, prepOdataInput } from './utils'

const dataPath = `${os.tmpdir()}/insphire/stock`;

const getStock = url => {
    return new Promise((resolve) => {
        const input = prepOdataInput(url);

        if (!input) {
            return resolve([]);
        }

        let odata;
        try {
            odata = parser.parse(input);
        } catch (e) {
            log.error(e);
            odata = false;
        }
        if (!odata) {
            return resolve([]);
        }

        if (odata.$filter && odata.$filter.type === 'eq' && odata.$filter.left.name === 'ITEMNO') {
            storage.get(odata.$filter.right.value, { dataPath }, function (error, item) {
                if (error || !item.ITEMNO) return resolve([]);
                resolve([item])
            });
        } else {
            storage.get('stock_all', { dataPath }, function (error, data) {
                if (error) return resolve([]);
                resolve(odataFilter(odata, data));
            });
        }
    });
};

export default getStock;