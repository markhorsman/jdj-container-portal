<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col-xs-12 col-sm-6 offset-sm-3 col-lg-4 offset-lg-4">
        <q-card>
          <q-card-section>
            <h5>Instellingen</h5>
            <q-form @submit="handleSubmit" class="q-gutter-md">
              <q-checkbox v-model="staticContract" label="Statisch contract" />

              <div class="row q-col-gutter-sm">
                <div class="col-xs-12 col-md6 col-4">
                  <q-select
                    :disable="!staticContract"
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
                  </q-select>
                </div>
              </div>

              <q-card-actions align="right">
                <p v-show="errored" class="error">Ongeldige invoer</p>
                <q-btn label="Opslaan" type="submit" color="primary" />
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
import { getAllContracts } from "../contracts";

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

    const items = await getAllContracts();

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

  validations: {},
  methods: {
    status(validation) {
      return {
        error: validation.$error,
        dirty: validation.$dirty
      };
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
