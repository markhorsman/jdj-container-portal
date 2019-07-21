<template>
  <div class="q-pa-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step :name="1" title="Klant ophalen" icon="nfc" :done="step > 1">
        <ReadCustomer />
      </q-step>

      <q-step :name="2" title="Producten scannen" icon="build" :done="step > 2">
        <ReadProduct />
      </q-step>

      <q-step :name="3" title="Controleren" icon="playlist_add_check" :done="step > 3">
        <p>Controleer de lijst met producten.</p>
        <q-list bordered separator>
          <q-item
            v-for="(p, index) in this.$store.state.rentalProducts"
            clickable
            v-bind:key="index"
          >
            <q-item-section>
              <q-item-label>{{ p.ITEMNO }}</q-item-label>
              <q-item-label caption lines="2">{{ p.DESC1 }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
              <q-item-label caption>{{ p.QTY }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-step>

      <q-step :name="4" title="Bevestigen" icon="send">
        Bevestig de gekozen producten door op onderstaande knop te drukken.
        <br />
        <br />
        <q-spinner-hourglass v-if="loading" color="purple" size="4em" />
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="step === 4 ? addItemsToContract() : $refs.stepper.next()"
            color="primary"
            :label="step === 4 ? 'Bevestigen' : 'Volgende'"
            :disabled="(step === 1 && !hasCustomer) || (step === 2 && !hasProducts) || loading"
          />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="$refs.stepper.previous()"
            label="Terug"
            class="q-ml-sm"
          />
          <q-btn
            v-if="step > 1"
            color="red"
            @click="cancel()"
            label="Annuleren"
            class="q-ml-sm float-right"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script>
import moment from "moment";
import ReadCustomer from "./ReadCustomer.vue";
import ReadProduct from "./ReadProduct.vue";
import { request } from "http";

export default {
  name: "Rental",
  components: {
    ReadCustomer,
    ReadProduct
  },
  computed: {
    hasCustomer() {
      return !!this.$store.state.customer;
    },
    hasProducts() {
      return !!this.$store.state.rentalProducts.length;
    }
  },
  methods: {
    cancel: function() {
      this.$store.commit("updateRentalProducts", []);
      this.$router.push("/");
    },
    createItemRequest: async function(item) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}/contracts/${this.$config.default_contract_number}/items?api_key=${this.$store.state.api_key}`,
          item
        );
      } catch (e) {
        result = e;
      }
      return result;
    },
    getContract: async function() {
      let result;
      try {
        result = await this.$api.get(
          `${this.$config.api_base_url}/contracts/${this.$config.default_contract_number}?api_key=${this.$store.state.api_key}`
        );
      } catch (e) {
        result = null;
      }
      return result;
    },
    addItemsToContract: async function() {
      this.loading = true;
      const d = moment().format("YYYY-MM-DD HH:mm:ss");

      const res = await this.getContract();
      const contract = res.data;
      if (!contract) {
        // TODO: notify user
        return;
      }

      const estretd = moment(contract.ESTRETD).format("YYYY-MM-DD HH:mm:ss");

      const requests = this.$store.state.rentalProducts.map(async p => {
        return await this.createItemRequest({
          Itemno: p.ITEMNO,
          Qty: p.QTY,
          Sellingprice: 0,
          Istextitem: 0,
          Memo: this.$store.state.customer.NAME,
          Deldate: d,
          Hiredate: d,
          Estretd: estretd
        });
      });

      const results = await Promise.all(requests);
      this.loading = false;
      let failed = 0;

      results.forEach(r => {
        if (!r || r.status > 201) {
          failed++;
          if (r.data && r.data.Message) {
            const body = JSON.parse(r.config.data);

            this.$notify({
              group: "api",
              title: `${body.Itemno} niet toegevoegd`,
              text: r.data.Message,
              type: "error",
              duration: 5000
            });
          }
        }
      });

      if (!failed) {
        this.$store.commit("updateRentalProducts", []);
        this.$notify({
          group: "api",
          title: "Contract items toegevoegd",
          text: `Er zijn ${results.length} contract items toegevoegd.`,
          type: "success",
          duration: 5000
        });
        this.$router.push("/");
      }
    }
  },
  data() {
    return {
      step: 1,
      loading: false
    };
  }
};
</script>