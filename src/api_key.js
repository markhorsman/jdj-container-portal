import config from '../config'
import axios from 'axios';

export default function getAPIKey() {
    return axios.post(`${config.api_base_url}/sessions/logon`, config.api_user)
        .then(response => response)
        .catch(() => {
            return null
        })
}
