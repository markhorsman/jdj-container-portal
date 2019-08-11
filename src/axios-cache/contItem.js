import storage from 'electron-json-storage'
import os from 'os'
import parser from 'odata-parser'
import log from 'electron-log'
import config from '../../config'
import { odataFilter, prepOdataInput } from './utils'

const dataPath = `${os.tmpdir()}/insphire/contitems/${config.default_contract_number}`;

const getContItems = url => {
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

        storage.get('contitems_all', { dataPath }, function (error, data) {
            if (error) return resolve([]);
            resolve(odataFilter(odata, data));
        });
    });
};

export default getContItems;