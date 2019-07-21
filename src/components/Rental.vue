<template>
  <div class="q-pa-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step :name="1" title="Klant ophalen" icon="nfc" :done="step > 1">
        <ReadCustomer />
      </q-step>

      <q-step :name="2" title="Huren of terugbrengen" icon="compare_arrows" :done="step > 2">
        <q-btn-toggle
          v-model="rentalType"
          push
          rounded
          glossy
          toggle-color="primary"
          :options="[
          {value: 'pickup', slot: 'pickup'},
          {value: 'return', slot: 'return'},
        ]"
        >
          <template v-slot:pickup>
            <div class="row items-center no-wrap">
              <div class="text-center">Producten ophalen (in huur)</div>
            </div>
          </template>

          <template v-slot:return>
            <div class="row items-center no-wrap">
              <div class="text-center">Producten terugbrengen (uit huur)</div>
            </div>
          </template>
        </q-btn-toggle>
        <br />
        <br />
      </q-step>

      <q-step :name="3" title="Producten scannen" icon="build" :done="step > 3">
        <ReadProduct />
      </q-step>

      <q-step
        :name="4"
        title="Controleren en bevestigen"
        icon="playlist_add_check"
        :done="step > 4"
      >
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

            <q-item-section side bottom>
              <q-item-label caption>{{ p.QTY }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <br />
        <br />Bevestig de gekozen producten door op onderstaande knop te drukken.
        <br />
        <br />
        <q-spinner-hourglass v-if="loading" color="purple" size="4em" />
      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="step === 4 ? (rentalType === 'return' ? removeItemsFromContract() : addItemsToContract()) : $refs.stepper.next()"
            color="primary"
            :label="step === 4 ? 'Bevestigen' : 'Volgende'"
            :disabled="(step === 1 && !hasCustomer) || (step === 3 && !hasProducts) || loading"
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
      this.$store.commit("updateCustomer", null);
      this.$router.push("/");
    },
    updateItemRequest: async function(recid, status) {
      let result;
      try {
        result = await this.$api.put(
          `${this.$config.container_api_base_url}contitem/${encodeURIComponent(
            recid
          )}/${status}`,
          {},
          { auth: this.$config.container_api_basic_auth }
        );
      } catch (e) {
        result = e;
      }
      return result;
    },
    createItemRequest: async function(item) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}contracts/${this.$config.default_contract_number}/items?api_key=${this.$store.state.api_key}`,
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
          `${this.$config.api_base_url}contracts/${this.$config.default_contract_number}?api_key=${this.$store.state.api_key}`
        );
      } catch (e) {
        result = null;
      }
      return result;
    },
    getContractItems: async function() {
      let result;
      try {
        result = await this.$api.get(
          `${this.$config.api_base_url}contracts/${this.$config.default_contract_number}/items?api_key=${this.$store.state.api_key}`
        );
      } catch (e) {
        result = null;
      }
      return result;
    },

    removeItemsFromContract: async function() {
      this.loading = true;
      const res = await this.getContractItems();
      const items = res.data;
      if (!items || !items.length) {
        // TODO: notify user
        return;
      }

      const products = [];
      this.$store.state.rentalProducts.forEach(p => {
        const match = items.find(obj => obj.ITEMNO === p.ITEMNO);
        if (match) products.push(match.RECID);
      });

      const requests = products.map(
        async id => await this.updateItemRequest(id, 2)
      );
      const results = await Promise.all(requests);
      this.loading = false;
      let failed = 0;

      results.forEach(r => {
        if (!r || r.status > 201) {
          failed++;
          if (r.data && r.data.Message) {
            console.log(r);
            // const body = JSON.parse(r.config.data);

            this.$notify({
              group: "api",
              title: `Product niet verwijderd`,
              text: r.data.Message,
              type: "error",
              duration: 5000
            });
          }
        }
      });

      // TODO: update status property of damaged stock items

      if (!failed) {
        this.$store.commit("updateRentalProducts", []);
        this.$store.commit("updateCustomer", null);
        this.$notify({
          group: "api",
          title: "Contract items aangepast",
          text: `Er zijn ${results.length -
            failed} contract items uit huur gehaald.`,
          type: "success",
          duration: 5000
        });
        this.$router.push("/");
      }
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
      const products = [];

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
        } else {
          products.push(r.data.RECID);
        }
      });

      if (!failed) {
        const updateRequests = products.map(
          async id => await this.updateItemRequest(id, 1)
        );

        const updates = await Promise.all(updateRequests);

        this.$store.commit("updateRentalProducts", []);
        this.$store.commit("updateCustomer", null);
        this.$notify({
          group: "api",
          title: "Contract items toegevoegd",
          text: `Er zijn ${results.length - failed} contract items toegevoegd.`,
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
      loading: false,
      rentalType: "pickup"
    };
  }
};
</script>