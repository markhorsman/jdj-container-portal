<template>
  <div class="q-px-lg q-pb-md">
    <q-dialog v-model="confirmCancel" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="cancel" color="primary" text-color="white" />
          <span class="q-ml-sm">Weet je zeker dat je wilt stoppen?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Nee" color="primary" v-close-popup />
          <q-btn flat label="Ja" color="danger" @click="cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

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

      <q-step :name="3" title="Artikelen scannen" icon="build" :done="step > 3">
        <ReadProduct />
        <ContractItems v-if="rentalType === 'return'" />
      </q-step>

      <q-step
        :name="4"
        title="Controleren en bevestigen"
        icon="playlist_add_check"
        :done="step > 4"
      >
        <p>Controleer de lijst met producten.</p>
        <q-table
          v-if="products.length"
          title="Artikelen"
          :data="products"
          :columns="columns"
          :pagination.sync="pagination"
          :rows-per-page-options="[]"
          row-key="RECID"
        />
        <br />
        <br />Bevestig de gekozen producten door op onderstaande knop te drukken.
      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="step === 4 ? (rentalType === 'return' ? returnItems() : rentItems()) : $refs.stepper.next()"
            color="primary"
            :label="step === 4 ? 'Bevestigen' : 'Volgende'"
            :disabled="(step === 1 && !hasCustomer) || (step === 3 && !hasProducts)"
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
            @click="confirmCancel = true"
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
import ContractItems from "./ContractItems.vue";
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
    ReadProduct,
    ContractItems
  },

  computed: {
    hasCustomer() {
      return !!this.$store.state.customer;
    },
    hasProducts() {
      return !!this.$store.state.rentalProducts.length;
    }
  },

  data() {
    return {
      step: 1,
      rentalType: "pickup",
      confirmCancel: false,
      products: this.$store.state.rentalProducts || [],
      pagination: {
        descending: false,
        page: 1,
        rowsPerPage: 1000
      },
      columns: [
        {
          name: "ITEMNO",
          required: true,
          label: "Artikelnummer",
          align: "left",
          field: row => row.ITEMNO,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "DESC1",
          required: true,
          label: "Omschr. 1",
          align: "left",
          field: row => row.DESC1,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "QTY",
          required: true,
          label: "Aantal",
          align: "left",
          field: row => row.QTY,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "STKLEVEL",
          required: true,
          label: "Voorraad",
          align: "left",
          field: row => row.STKLEVEL,
          format: val => `${val}`,
          sortable: true
        }
      ]
    };
  },

  methods: {
    cancel: function() {
      this.confirmCancel = false;
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

    updateStockRequest: async function(recid, status, quantity, type, unqiue) {
      let result;
      try {
        result = await this.$api.put(
          `${this.$config.container_api_base_url}stock/${encodeURIComponent(
            recid
          )}`,
          {
            status,
            quantity,
            type,
            unqiue
          },
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

    deliverContractItem: async function(recid) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}contractitems/${encodeURIComponent(
            recid
          )}/deliver?api_key=${this.$store.state.api_key}`
        );
      } catch (e) {
        result = e;
      }
      return result;
    },

    offhireContractItem: async function(recid, item) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}contractitems/${encodeURIComponent(
            recid
          )}/offhire?api_key=${this.$store.state.api_key}`,
          {
            QTYOK: item.QTYOK,
            QTYDAM: item.QTYDAM,
            QTYLOST: item.QTYLOST,
            DAMAGE: "",
            DEPOT: this.$store.state.user.DEPOT,
            DAMAGEPHOTO: 0
          }
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

    removeLocalProductByItemNumber: function(itemnumber) {
      const products = this.$store.state.rentalProducts;
      const i = products.map(item => item.ITEMNO === itemnumber);

      // remove object
      products.splice(i, 1);
      this.$store.commit("updateRentalProducts", products);
    },

    returnItems: async function() {
      if (
        !this.$store.state.rentalProducts ||
        !this.$store.state.rentalProducts.length ||
        !this.$store.state.customer
      )
        return;

      const products = [];
      const processed = [];
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

      const offhireContItemRequests = products.map(async p => {
        return await this.offhireContractItem(p.RECID, p);
      });

      const contItemOffhireResults = await Promise.all(offhireContItemRequests);

      contItemOffhireResults.forEach(r => {
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
        }
      });

      // all failed
      if (failed && failed === products.length) {
        return;
      }

      // TODO: if one or more failed, and at least one succeeded, remove the succeeded items from store.

      // TODO: notify if one or more stock updates failed?

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.$notify({
        group: "api",
        title: "Contract items",
        text: `Er zijn ${contItemOffhireResults.length -
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
      let deliverFailed = 0;
      const products = [];
      const stockItems = [];
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

      if (failed && failed === contItemResults.length) {
        return;
      }

      const deliverContItemRequests = products.map(async recid => {
        return await this.deliverContractItem(recid);
      });

      const contItemDeliverResults = await Promise.all(deliverContItemRequests);

      contItemDeliverResults.forEach(r => {
        if (!r || r.status > 201) {
          deliverFailed++;
          if (r.data && r.data.Message) {
            const body = JSON.parse(r.config.data);

            this.$notify({
              group: "api",
              title: `${body.Itemno} niet in huur gezet`,
              text: r.data.Message,
              type: "error",
              duration: 5000
            });
          }
        }
      });

      // remove the ones that succeeded from store
      // if (failed && stockItems.length) {
      //   stockItems.forEach(s => {
      //     this.removeLocalProductByItemNumber(s.ITEMNO);
      //   });
      // }

      // TODO: notify if one or more updates failed?

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.$notify({
        group: "api",
        title: "Contract items toegevoegd",
        text: `Er zijn ${contItemDeliverResults.length -
          deliverFailed} contract items in huur gezet.`,
        type: "success",
        duration: 5000
      });
      this.$router.push("/");
    }
  }
};
</script>