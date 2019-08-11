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

        <div style="max-width: 400px; margin-top: 30px;">
          <q-select
            v-if="rentalQueueOptions.length && isOnline"
            filled
            v-model="rentalQueueSelected"
            :options="rentalQueueOptions"
            stack-label
            label="Niet-verzonden taken"
            @input="loadQueueTask"
          ></q-select>
        </div>
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
          @input="rentalTypeChanged"
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
          :visible-columns="visibleColumns"
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

  mounted() {
    this.rentalTypeChanged(this.rentalType);
    this.genRentalQueueOptions();
  },

  data() {
    return {
      step: 1,
      rentalType: "pickup",
      confirmCancel: false,
      products: this.$store.state.rentalProducts || [],
      rentalQueue: this.$offlineStorage.get("rental_queue") || [],
      rentalQueueSelected: null,
      rentalQueueOptions: [],
      visibleColumns: [],
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
          label: "Aantal",
          align: "left",
          field: row => row.QTY,
          format: val => `${val}`,
          sortable: true,
          type: "pickup"
        },
        {
          name: "QTYOK",
          label: "Goedgekeurd",
          align: "left",
          field: row => row.QTYOK,
          format: val => `${val}`,
          sortable: true,
          type: "return"
        },
        {
          name: "QTYDAM",
          label: "Beschadigd",
          align: "left",
          field: row => row.QTYDAM,
          format: val => `${val}`,
          sortable: true,
          type: "return"
        },
        {
          name: "QTYLOST",
          label: "Vermist",
          align: "left",
          field: row => row.QTYLOST,
          format: val => `${val}`,
          sortable: true,
          type: "return"
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
    notify(message, type = "error", timeout = 0, html = false) {
      this.$q.notify({
        color: type === "error" ? "red-5" : "green-4",
        icon:
          type === "error"
            ? "fas fa-exclamation-triangle"
            : "fas fa-check-circle",
        message,
        timeout,
        html
      });
    },

    genRentalQueueOptions() {
      this.rentalQueueOptions = this.rentalQueue.reduce((acc, q, i) => {
        acc.push({
          label: `${
            q.type === "hire" ? "Huur opdracht" : "Uithuur opdracht"
          } (${q.products.length} ${
            q.products.length > 1 ? "producten" : "product"
          }) voor ${q.customer.NAME}`,
          value: i
        });
        return acc;
      }, []);
    },

    loadQueueTask(q) {
      if (!q) return;

      const queueItem = this.rentalQueue[q.value];
      this.products = queueItem.products;
      this.$store.commit("updateRentalProducts", queueItem.products);
      this.$store.commit("updateCustomer", queueItem.customer);
      this.rentalType = queueItem.type === "hire" ? "pickup" : "return";
      this.step = 4;
    },

    cancel: function() {
      this.confirmCancel = false;
      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);
      this.$router.push("/rental");
      this.step = 1;
      
      if (this.rentalQueueSelected) {
        this.updateRentalQueue();
      }
    },

    rentalTypeChanged(type) {
      this.visibleColumns = this.columns.reduce((acc, c) => {
        if (!c.type || c.type === type) acc.push(c.name);
        return acc;
      }, []);
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
            DAMAGEPHOTO: ""
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

    queueTask(type) {
      let rentalQueue = this.$offlineStorage.get("rental_queue") || [];
      rentalQueue.push({
        type,
        products: this.$store.state.rentalProducts,
        customer: this.$store.state.customer
      });
      this.$offlineStorage .set("rental_queue", rentalQueue);
      this.rentalQueue = rentalQueue;
      this.genRentalQueueOptions();
      this.rentalQueueSelected = null;

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.$q.notify({
        color: "orange-4",
        icon: "fas fa-exclamation",
        message: `<h5>Er is momenteel geen internet.</h5>
        <p>Je kunt het ${
          type === "hire" ? "verhuur" : "uithuur"
        } verzoek bevestigen zodra je weer online bent.<br />
        Alle niet verzonden taken vindt je terug in de verhuur module (alleen zichtbaar wanneer je online bent).</p>`,
        timeout: 15000,
        html: true
      });

      this.step = 1;
    },

    updateRentalQueue() {
      this.rentalQueue.splice(this.rentalQueueSelected.value, 1);
      this.rentalQueueOptions.splice(this.rentalQueueSelected.value, 1);
      this.$offlineStorage.set("rental_queue", this.rentalQueue);
      this.rentalQueueSelected = null;
    },

    returnItems: async function() {
      if (
        !this.$store.state.rentalProducts ||
        !this.$store.state.rentalProducts.length ||
        !this.$store.state.customer
      )
        return;

      // save job to local storage
      if (this.isOffline) {
        return this.queueTask("offhire");
      }

      const products = [];
      const processed = [];
      let failed = 0;

      const response = await this.getContractItems();
      const items = response.data;

      if (!items || !items.length) {
        this.notify(
          `Artikelen van contract (${this.$config.default_contract_number}) niet gevonden`
        );
        return;
      }

      this.$store.state.rentalProducts.forEach(p => {
        const match = items.find(obj => obj.ITEMNO === p.ITEMNO);
        if (match) products.push(Object.assign(p, { RECID: match.RECID }));
      });

      if (!products.length) {
        this.notify(
          `De gescande producten hebben geen overeenkomst met de producten in het contract(${this.$config.default_contract_number})`
        );
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
            this.notify(`${body.Itemno} niet toegevoegd aan contract`);
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

      // remove from queue
      if (this.rentalQueueSelected) {
        this.updateRentalQueue();
      }

      this.notify(
        `Er zijn ${contItemOffhireResults.length -
          failed} contract items uit huur gehaald.`,
        "success",
        5000
      );

      this.step = 1;
      this.$router.push("/rental");
    },

    rentItems: async function() {
      if (
        !this.$store.state.rentalProducts ||
        !this.$store.state.rentalProducts.length ||
        !this.$store.state.customer
      )
        return;

      // save job to local storage
      if (this.isOffline) {
        return this.queueTask("hire");
      }

      let failed = 0;
      let deliverFailed = 0;
      const products = [];
      const stockItems = [];
      const d = moment().format("YYYY-MM-DD HH:mm:ss");

      const res = await this.getContract();
      const contract = res.data;
      if (!contract) {
        this.notify(
          `Contract (${this.$config.default_contract_number}) kon niet worden opgehaald`
        );
        return;
      }

      const m = moment(contract.ESTRETD);
      if (!m || !m.isValid()) {
        this.notify(
          `Het datum veld ESTRETD van het contract (${this.$config.default_contract_number}) is ongeldig.`
        );
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
            this.notify(r.data.Message);
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
            this.notify(r.data.Message);
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

      // remove from queue
      if (this.rentalQueueSelected) {
        this.updateRentalQueue();
      }

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      this.notify(
        `Er zijn ${contItemDeliverResults.length -
          deliverFailed} contract items in huur gezet.`,
        "success",
        5000
      );

      this.step = 1;
      this.$router.push("/rental");
    }
  }
};
</script>