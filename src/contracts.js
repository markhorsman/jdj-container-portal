import { eventHub } from "./eventhub";
import store from './store'
import config from '../config'
import axios from './api-axios'
const throat = require("throat")(Promise);

const methods = {
  async getContractsCount() {
    let res;

    try {
      res = await axios.get(
        `${config.api_base_url}contracts?api_key=${store.state.api_key}&$top=1&$skip=0&$inlinecount=allpages&$orderby=CONTNO asc&$filter=STATUS eq 2&fields=RECID`
      );

      if (!res || !res.data || !res.data.totalCount) return 0;

      return res.data.totalCount;
    } catch (e) {
      console.log(e);
    }
  },

  async getAllContracts() {
    const list = [];
    const top = 50;
    const concurrency = 5;

    eventHub.$emit("before-request");
    store.commit("updateLoaderState", true);

    const total = await this.getContractsCount();

    if (!total) {
      eventHub.$emit("after-response");
      store.commit("updateLoaderState", false);
      return;
    }

    const iterations = Math.ceil(total / top);
    const max = top;
    for (let i = 0; i < iterations; i++) {
      list.push(i * max);
    }

    const data = await Promise.all(
      list.map(throat(concurrency, skip => this.getContracts(max, skip)))
    );

    eventHub.$emit("after-response");
    store.commit("updateLoaderState", false);

    return data.reduce((acc, a) => {
      acc.push.apply(acc, a);
      return acc;
    }, []);
  },

  async getContracts(top, skip) {
    let res;

    try {
      res = await axios.get(
        `${config.api_base_url}contracts?api_key=${store.state.api_key}&$top=${top}&$skip=${skip}&$orderby=CONTNO asc&$filter=STATUS eq 2&fields=RECID,CONTNO,ACCT`
      );

      return res.data;
    } catch (e) {
      console.log(e);
    }

    return [];
  },
}

const getAllContracts = async () => await methods.getAllContracts();

export { getAllContracts };