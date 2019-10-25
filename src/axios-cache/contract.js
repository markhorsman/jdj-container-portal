import storage from 'electron-json-storage'
import os from 'os'
import parser from 'odata-parser'
import log from 'electron-log'
import { odataFilter, prepOdataInput } from './utils'

const dataPath = `${os.tmpdir()}/insphire/contracts`;

const getContracts = url => {
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

        storage.get('contracts_all', { dataPath }, function (error, data) {
            if (error) return resolve([]);
            resolve(odataFilter(odata, data));
        });
    });
};

export default getContracts;