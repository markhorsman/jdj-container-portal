<template>
  <div class="q-pa-md">
    <h5>Contract kiezen</h5>

    <q-select
      :disable="staticContract"
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
      <template v-slot:append>
        <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
      </template>
    </q-select>
  </div>
</template>

<script>
import { eventHub } from "../eventhub";
import { getAllContracts } from "../contracts";

const throat = require("throat")(Promise);

export default {
  name: "ChooseContract",

  data() {
    return {
      contracts: [],
      contractOptions: [],
      contract: null
    };
  },

  async mounted() {
    if (this.$store.state.settings) {
      this.contract = this.$store.state.settings.contract.number;
    }

    const items = await getAllContracts();

    this.contractOptions = items.reduce((acc, c) => {
      acc.push({ label: `${c.CONTNO} - ${c.ACCT}`, value: c.CONTNO });
      return acc;
    }, []);

    this.contracts = this.contractOptions;
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
