import storage from 'electron-json-storage'
import os from 'os'

const getFAQ = () => {
    return new Promise((resolve) => {
        storage.get('FAQ', { dataPath: `${os.tmpdir()}/insphire/FAQ` }, function (error, data) {
            if (error) return resolve(null);
            resolve(data)
        });
    });
};

export default getFAQ;