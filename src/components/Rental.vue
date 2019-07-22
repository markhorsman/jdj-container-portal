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
            @click="step === 4 ? (rentalType === 'return' ? returnItems() : rentItems()) : $refs.stepper.next()"
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

const CONTITEM_IN_RENT_STATUS = 1;
const CONTITEM_FROM_RENT_STATUS = 2;
const STOCK_IN_RENT_STATUS = 1;
const STOCK_AVAILABLE_STATUS = 0;
const STOCK_IN_REPAIR_STATUS = 2;

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
    updateContItemRequest: async function(recid, status) {
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
    updateStockRequest: async function(recid, status, quantity, type) {
      let result;
      try {
        result = await this.$api.put(
          `${this.$config.container_api_base_url}stock/${encodeURIComponent(
            recid
          )}/${status}/${quantity}/${type}`,
          {},
          { auth: this.$config.container_api_basic_auth }
        );
      } catch (e) {
        result = e;
      }
      return result;
    },
    createContItemRequest: async function(item) {
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

    returnItems: async function() {
      if (
        !this.$store.state.rentalProducts ||
        !this.$store.state.rentalProducts.length ||
        !this.$store.state.customer
      )
        return;

      this.loading = true;
      const products = [];
      let failed = 0;

      const response = await this.getContractItems();
      const items = response.data;

      if (!items || !items.length) {
        this.$notify({
          group: "api",
          title: `Contract artikelen niet gevonden.`,
          text: `Artikelen van contract (${this.$config.default_contract_number}) niet gevonden`,
          type: "error",
          duration: 5000
        });
        return;
      }

      this.$store.state.rentalProducts.forEach(p => {
        const match = items.find(obj => obj.ITEMNO === p.ITEMNO);
        if (match) products.push(match);
      });

      if (!products.length) {
        this.$notify({
          group: "api",
          title: `Geen match met producten.`,
          text: `De gescande producten hebben geen overeenkomst met de producten in het contract(${this.$config.default_contract_number})`,
          type: "error",
          duration: 5000
        });
        return;
      }

      const updateContItemRequests = products.map(
        async p =>
          await this.updateContItemRequest(p.id, CONTITEM_FROM_RENT_STATUS)
      );

      const contItemUpdates = await Promise.all(updateContItemRequests);

      contItemUpdates.forEach(r => {
        if (!r || r.status > 201) {
          failed++;
          console.log(r);
          this.$notify({
            group: "api",
            title: `Product niet uit huur gehaald`,
            text: "", // TODO: add message from result
            type: "error",
            duration: 5000
          });
        }
      });

      // all failed
      if (failed && failed === products.length) {
        this.loading = false;
        return;
      }

      const updateStockRequests = products.map(
        async p =>
          await this.updateStockRequest(
            p.id,
            p.DAMAGED && p.UNIQUE ? STOCK_IN_REPAIR_STATUS : (p.UNIQUE ? STOCK_AVAILABLE_STATUS : p.STATUS),
            p.QTY,
            "substract"
          )
      );

      const stockUpdates = await Promise.all(updateStockRequests);

      // TODO: notify if one or more stock updates failed?

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.loading = false;

      this.$notify({
        group: "api",
        title: "Contract items",
        text: `Er zijn ${contItemUpdates.length -
          failed} contract items uit huur gehaald.`,
        type: "success",
        duration: 5000
      });
      this.$router.push("/");
    },

    rentItems: async function() {
      if (
        !this.$store.state.rentalProducts ||
        !this.$store.state.rentalProducts.length ||
        !this.$store.state.customer
      )
        return;

      let failed = 0;
      const products = [];
      const stockItems = [];
      this.loading = true;
      const d = moment().format("YYYY-MM-DD HH:mm:ss");

      const res = await this.getContract();
      const contract = res.data;
      if (!contract) {
        this.$notify({
          group: "api",
          title: `Contract niet gevonden.`,
          text: `Contract (${this.$config.default_contract_number}) kon niet worden opgehaald`,
          type: "error",
          duration: 5000
        });
        return;
      }

      const m = moment(contract.ESTRETD);
      if (!m || !m.isValid()) {
        this.$notify({
          group: "api",
          title: `Ongeldige datum.`,
          text: `Het datum veld ESTRETD van het contract (${this.$config.default_contract_number}) is ongeldig.`,
          type: "error",
          duration: 5000
        });
      }

      const estretd = m.format("YYYY-MM-DD HH:mm:ss");

      const createContItemRequests = this.$store.state.rentalProducts.map(
        async p => {
          return await this.createContItemRequest({
            Itemno: p.ITEMNO,
            Qty: p.QTY,
            Sellingprice: 0,
            Istextitem: 0,
            Memo: this.$store.state.customer.NAME,
            Deldate: d,
            Hiredate: d,
            Estretd: estretd
          });
        }
      );

      const contItemResults = await Promise.all(createContItemRequests);

      contItemResults.forEach(r => {
        if (!r || r.status > 201) {
          failed++;
          if (r.data && r.data.Message) {
            const body = JSON.parse(r.config.data);

            this.$notify({
              group: "api",
              title: `${body.Itemno} niet toegevoegd aan contract`,
              text: r.data.Message,
              type: "error",
              duration: 5000
            });
          }
        } else {
          products.push(r.data.RECID);

          // we need the status and quantity of the stock item
          const stock = this.$store.state.rentalProducts.find(
            p => p.ITEMNO === r.data.ITEMNO
          );
          if (stock) stockItems.push(stock);
        }
      });

      // update contitem status (Insphire API does not do this for us)
      const updateContItemRequests = products.map(
        async id =>
          await this.updateContItemRequest(id, CONTITEM_IN_RENT_STATUS)
      );

      // update stock status and quantity (Insphire API does not do this for us)
      const updateStockRequests = stockItems.map(
        async s =>
          await this.updateStockRequest(
            s.RECID,
            (s.UNIQUE ? STOCK_IN_RENT_STATUS : s.STATUS),
            s.QTY,
            "add"
          )
      );

      // get responses of update requests
      const contItemUpdates = await Promise.all(updateContItemRequests);
      const stockUpdates = await Promise.all(updateStockRequests);

      if (failed) {
        this.loading = false;
        return;
      }

      // TODO: notify if one or more updates failed?

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.loading = false;

      this.$notify({
        group: "api",
        title: "Contract items toegevoegd",
        text: `Er zijn ${contItemResults.length - failed} contract items toegevoegd.`,
        type: "success",
        duration: 5000
      });
      this.$router.push("/");
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