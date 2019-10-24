<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-xs-12 col-sm-6 offset-sm-3 col-lg-4 offset-lg-4">
        <q-card>
          <q-card-section>
            <h5>Instellingen</h5>
            <q-form @submit="handleSubmit" @reset="onReset" class="q-gutter-md">
              <q-checkbox v-model="staticContract" label="Statisch contract" />

              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-md6 col-4">
                  <q-select
                    v-if="staticContract"
                    ref="contract"
                    outlined
                    v-model="contract"
                    use-input
                    hide-selected
                    fill-input
                    input-debounce="0"
                    :options="contractOptions"
                    @filter="filterContracts"
                    @input="(v) => contract = v.value"
                    label="Contract"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">Geen resultaten</q-item-section>
                      </q-item>
                    </template>
                    <template v-slot:append>
                      <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
                    </template>
                  </q-select>
                </div>
              </div>

              <q-card-actions align="right">
                <p v-show="errored" class="error">Ongeldige invoer</p>
                <q-btn label="Opslaan" type="submit" color="primary" />
                <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { required } from "vuelidate/lib/validators";
import { eventHub } from "../eventhub";

const throat = require("throat")(Promise);

export default {
  name: "Settings",

  data() {
    return {
      errored: false,
      staticContract: true,
      contracts: [],
      contractOptions: [],
      contract: null
    };
  },

  async mounted() {
    if (this.$store.state.settings) {
      this.staticContract = this.$store.state.settings.contract.static;
      this.contract = this.$store.state.settings.contract.number;
    }

    await this.getAllContracts();
  },

  validations: {
    // username: { required },
    // password: { required },
    // depot: { required }
  },
  methods: {
    status(validation) {
      return {
        error: validation.$error,
        dirty: validation.$dirty
      };
    },

    onReset(e) {
      this.contract = null;
    },

    async handleSubmit(e) {
      e.preventDefault();
      this.errored = false;

      this.$v.$touch();

      if (!this.$v.$invalid) {
        if (!this.contract && this.staticContract) {
          this.errored = true;
          return;
        } else {
          this.$store.commit("updateSettings", {
            contract: {
              static: this.staticContract,
              number: this.staticContract ? this.contract : null
            }
          });

          this.$q.notify({
            color: "green-4",
            icon: "fas fa-check-circle",
            message: `Instellingen opgeslagen`
          });
        }
      }
    },

    async getContractsCount() {
      let res;

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}contracts?api_key=${this.$store.state.api_key}&$top=1&$skip=0&$inlinecount=allpages&$orderby=CONTNO asc&fields=RECID`
        );

        if (!res || !res.data || !res.data.totalCount) return 0;

        return res.data.totalCount;
      } catch (e) {
        console.log(e);
      }
    },

    async getAllContracts() {
      const list = [];
      let items = [];
      const top = 200;
      const concurrency = 5;

      eventHub.$emit("before-request");
      this.$store.commit("updateLoaderState", true);

      const total = await this.getContractsCount();

      if (!total) {
        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);
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
      this.$store.commit("updateLoaderState", false);

      items = data.reduce((acc, a) => {
        acc.push.apply(acc, a);
        return acc;
      }, []);

      this.contractOptions = items.reduce((acc, c) => {
        acc.push({ label: `${c.CONTNO} - ${c.ACCT}`, value: c.CONTNO });
        return acc;
      }, []);

      this.contracts = this.contractOptions;

      if (this.$config.default_contract_number && !this.contract) {
        const match = this.contractOptions.find(
          c => c.value === this.$config.default_contract_number
        );
        if (match) this.contract = match.value;
      }
    },

    async getContracts(top, skip) {
      let res;

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}contracts?api_key=${this.$store.state.api_key}&$top=${top}&$skip=${skip}&$orderby=CONTNO asc&fields=RECID,CONTNO,ACCT,HIREDATE,ESTRETD`
        );

        return res.data;
      } catch (e) {
        console.log(e);
      }

      return [];
    },

    filterContracts(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.contractOptions = this.contracts.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    }
  }
};
</script>
