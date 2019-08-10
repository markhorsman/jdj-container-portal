import storage from 'electron-json-storage'
import os from 'os'

const dataPath = `${os.tmpdir()}/insphire/customercontact`;

const getCustomerContact = reference => {
    return new Promise((resolve) => {
        storage.get(reference, { dataPath }, function (error, item) {
            if (error || !item.REFERENCE) return resolve({ data: [], success: false });
            resolve({ data: [item], success: true })
        });
    });
};

export default getCustomerContact;


