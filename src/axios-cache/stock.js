import storage from 'electron-json-storage'
import os from 'os'

import { sortBy } from 'lodash'

storage.setDataPath(`${os.tmpdir()}/insphire/stock`);

const odataFilter = (odata, data) => {
    let rtn = data;
    let total = data.length;

    // filter/sort/paginate the result

    if (odata.$filter) {
        switch (odata.$filter.type) {
            case 'eq':
                rtn = data.filter(o => o[odata.$filter.left.name] === odata.$filter.right.value);
                total = rtn.length;
                break;
        }
    }

    if (odata.$orderby) {
        const orderField = Object.keys(odata.$orderby[0])[0];
        const orderDir = Object.values(odata.$orderby[0])[0];

        rtn = sortBy(rtn, orderField);
        if (orderDir.toLowerCase() === 'desc') {
            rtn = rtn.reverse();
        }
    }

    if (odata.$top) {
        rtn = rtn.slice((odata.$skip ? odata.$skip : 0), odata.$top);
    }

    if (odata.$inlinecount) {
        rtn = {
            results: rtn,
            totalCount: total
        }
    }

    return rtn;
}

const getStock = odata => {
    return new Promise((resolve) => {
        if (odata.$filter && odata.$filter.type === 'eq' && odata.$filter.left.name === 'ITEMNO') {
            storage.get(odata.$filter.right.value, function (error, item) {
                if (error) return resolve([]);
                resolve([item])
            });
        } else {
            storage.get('stock_all', function (error, data) {
                if (error) return resolve([]);
                resolve(odataFilter(odata, data));
            });
        }
    });
};

export default getStock;


