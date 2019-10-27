<template>
  <div class="q-pa-md">
    <h5>Contract kiezen</h5>

    <q-select
      :disable="disabled"
      ref="contract"
      outlined
      v-model="contract"
      use-input
      hide-selected
      fill-input
      input-debounce="0"
      :options="contractOptions"
      @filter="filterContracts"
      @input="updateContract"
      label="Contract"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">Geen resultaten</q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script>
import { eventHub } from "../eventhub";
import { getAllContracts } from "../contracts";
import { get } from "lodash";

const throat = require("throat")(Promise);

export default {
  name: "ChooseContract",

  data() {
    return {
      disabled: get(this.$store.state, "settings.contract.static", true),
      contracts: [],
      contractOptions: [],
      contract: null
    };
  },

  async mounted() {
    if (get(this.$store.state, "settings.contract.static", true)) {
      this.contract = get(
        this.$store.state,
        "settings.contract.number",
        this.$config.default_contract_number
      );
      this.contractOptions = [{ label: this.contract, value: this.contract }];
      this.$store.commit("updateContract", this.contract);
    } else {
      const items = await getAllContracts();

      this.contractOptions = items.reduce((acc, c) => {
        acc.push({ label: `${c.CONTNO} - ${c.ACCT}`, value: c.CONTNO });
        return acc;
      }, []);

      this.contracts = this.contractOptions;

      if (this.$store.state.contract) {
        const match = this.contractOptions.find(
          c => c.value === this.$store.state.contract
        );
        if (match) this.contract = match.value;
      }
    }
  },

  methods: {
    filterContracts(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.contractOptions = this.contracts.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    updateContract(v) {
      this.contract = v.value;
      this.$store.commit("updateContract", this.contract);
    }
  }
};
</script>
