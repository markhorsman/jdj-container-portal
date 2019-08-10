import storage from 'electron-json-storage'
import os from 'os'
import odataFilter from './utils'

const dataPath = `${os.tmpdir()}/insphire/stock`;

const getStock = odata => {
    return new Promise((resolve) => {
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