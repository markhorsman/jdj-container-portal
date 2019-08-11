import { sortBy } from 'lodash'

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

const prepOdataInput = url => {
    let parts = url.split('&');
    if (!parts || !parts.length) return false;

    parts = url.split(parts[0]);
    if (!parts || !parts.length) return false;

    let rtn = parts[1].replace(/\n|\r/g, "").replace(/\s{2,}/g, "").substring(1);

    if (rtn.indexOf('&fields') >= 0) {
        rtn = rtn.replace('&fields', '&$select');
    }

    if (rtn.indexOf('&$fields') >= 0) {
        rtn = rtn.replace('&$fields', '&$select');
    }

    return rtn;
};


export {
    odataFilter,
    prepOdataInput
};