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

      <q-step :name="2" title="Huren of terugbrengen" icon="compare_arrows" :done="step > 3">
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

      <q-step :name="3" title="Contract kiezen" icon="fas fa-scroll" :done="step > 2">
        <ChooseContract />
      </q-step>

      <q-step :name="4" title="Artikelen scannen" icon="build" :done="step > 4">
        <ReadProduct v-if="rentalType !== 'return'" />
        <ReadContractItem v-if="rentalType === 'return'" />
        <ContractItems
          v-if="rentalType === 'return' && this.$store.state.customer"
          :title="`Momenteel op naam van ${this.$store.state.customer.NAME}`"
        />
      </q-step>

      <q-step
        :name="5"
        title="Controleren en bevestigen"
        icon="playlist_add_check"
        :done="step > 5"
      >
        <p>Controleer de lijst met producten.</p>
        <q-table
          v-if="this.$store.state.rentalProducts.length"
          title="Artikelen"
          :data="this.$store.state.rentalProducts"
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
            ref="stepperNextBtn"
            @click="step === 5 ? (rentalType === 'return' ? returnItems() : rentItems()) : (step === 2 && (hasStaticContract || rentalType === 'return') ? $refs.stepper.goTo(4) : $refs.stepper.next())"
            color="primary"
            :label="step === 5 ? (rentalType === 'return' ? 'Uit huur bevestigen' : 'In huur bevestigen') : 'Volgende'"
            :disabled="(step === 1 && !hasCustomer) || (step === 3 && !hasContract) || (step === 4 && !hasProducts) || nextIsDisabled"
          />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="(step === 4 && (hasStaticContract || rentalType === 'return') ? $refs.stepper.goTo(2) : $refs.stepper.previous())"
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
import ReadContractItem from "./ReadContractItem.vue";
import ContractItems from "./ContractItems.vue";
import ChooseContract from "./ChooseContract.vue";

import { eventHub } from "../eventhub";
const throat = require("throat")(Promise);

export default {
  name: "Rental",

  components: {
    ReadCustomer,
    ChooseContract,
    ReadProduct,
    ReadContractItem,
    ContractItems
  },

  computed: {
    hasCustomer() {
      return !!this.$store.state.customer;
    },
    hasContract() {
      if (this.$store.state.settings.contract.static) return true;
      return !!this.$store.state.contract;
    },
    hasStaticContract() {
      return this.$store.state.settings.contract.static;
    },
    hasProducts() {
      return !!this.$store.state.rentalProducts.length;
    }
  },

  mounted() {
    this.$store.commit(
      "updateContract",
      this.$store.state.settings.contract.static
        ? this.$store.state.settings.contract.number
        : null
    );
    this.rentalTypeChanged(this.rentalType);
    this.genRentalQueueOptions();
  },

  data() {
    return {
      nextIsDisabled: false,
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
        }
      ]
    };
  },

  methods: {
    notify(message, type = "error", timeout = 15000, html = false) {
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
      this.$store.commit("updateContract", queueItem.contract);
      this.rentalType = queueItem.type === "hire" ? "pickup" : "return";
      this.step = 5;
    },

    cancel: function() {
      this.confirmCancel = false;
      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      if (!this.$store.state.settings.contract.static) {
        this.$store.commit("updateContract", null);
      }

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

    createContItemRequest: async function(item) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}contracts/${this.$store.state.contract}/items?api_key=${this.$store.state.api_key}`,
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

      try {
        const body = { RECID: recid };
        result.config.data = JSON.stringify(body);
      } catch (e) {
        console.log(e);
      }

      return result;
    },

    offhireContractItem: async function(recid, item) {
      let body = {
        QTYOK: item.QTYOK,
        QTYDAM: item.QTYDAM,
        QTYLOST: item.QTYLOST,
        DAMAGE: "",
        DEPOT: this.$store.state.user.DEPOT,
        DAMAGEPHOTO: ""
      };

      let result;
      try {
        result = await this.$api.post(
          `${this.$config.api_base_url}contractitems/${encodeURIComponent(
            recid
          )}/offhire?api_key=${this.$store.state.api_key}`,
          body
        );
      } catch (e) {
        result = e;
      }

      try {
        body = JSON.parse(result.config.data);
        body.ITEMNO = item.ITEMNO;
        result.config.data = JSON.stringify(body);
      } catch (e) {
        console.log(e);
      }

      return result;
    },

    offhireConfirmItem: async function(contno, item) {
      let result;
      try {
        result = await this.$api.post(
          `${this.$config.container_api_base_url}offhire`,
          {
            CONTNO: item.CONTNO,
            ITEMNO: item.ITEMNO,
            CONTITEM_RECORDER: item.RECORDER,
            CONTITEM_RECID: item.RECID,
            CONTITEM_HIRED: item.HIRED,
            CONTITEM_QTYRETD: item.QTYRETD,
            QTY: item.QTYOK + item.QTYDAM + item.QTYLOST,
            QTYOK: item.QTYOK,
            QTYDAM: item.QTYDAM,
            QTYLOST: item.QTYLOST,
            UNIQUE: item.UNIQUE,
            USERNAME: this.$store.state.user.USERNAME,
            MEMO: `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`,
            DEPOT: this.$store.state.user.DEPOT
          },
          {
            auth: this.$config.container_api_basic_auth
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
          `${this.$config.api_base_url}contracts/${this.$store.state.contract}?api_key=${this.$store.state.api_key}`
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
        customer: this.$store.state.customer,
        contract: this.$store.state.contract
      });
      this.$offlineStorage.set("rental_queue", rentalQueue);
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

      const products = this.$store.state.rentalProducts;
      const processed = [];
      const confirmed = [];
      let failed = 0;

      eventHub.$emit("before-request");
      this.$store.commit("updateLoaderState", true);

      const contItemOffhireResults = await Promise.all(
        products.map(throat(3, p => this.offhireContractItem(p.RECID, p)))
      );

      contItemOffhireResults.forEach(r => {
        let body;

        if (r.config.data) {
          body = JSON.parse(r.config.data);
        }

        if (!r || r.status > 201) {
          failed++;
          if (r.data && r.data.Message) {
            this.notify(r.data.Message);
          } else if (body && body.ITEMNO) {
            this.notify(`${body.ITEMNO} niet uit huur gehaald.`);
          }
        } else {
          if (body && body.ITEMNO) {
            const p = products.find(p => p.ITEMNO === body.ITEMNO);
            if (p) processed.push(p);
          }
        }
      });

      // all failed
      if (failed && failed === products.length) {
        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);
        return;
      }

      failed = 0;

      const offhireConfirmResults = await Promise.all(
        processed.map(
          throat(3, p => this.offhireConfirmItem(this.$store.state.contract, p))
        )
      );

      offhireConfirmResults.forEach(r => {
        let body;
        if (r.config.data) {
          body = JSON.parse(r.config.data);
        }

        if (!r || r.status > 201) {
          failed++;
          console.log(r);
          this.notify(`${body.ITEMNO} niet uit huur gehaald.`);
        } else {
          if (body && body.ITEMNO) {
            const p = products.find(p => p.ITEMNO === body.ITEMNO);
            if (p) confirmed.push(p);
          }
        }
      });

      if (failed) {
        this.notify(
          `Er ${processed.length > 1 ? "zijn" : "is"} ${
            processed.length
          } contract item${
            processed.length > 1 ? "s" : ""
          } uit huur gehaald. Maar niet allemaal bevestigd.`,
          "success"
        );
      } else {
        this.notify(
          `Er ${processed.length > 1 ? "zijn" : "is"} ${
            processed.length
          } contract item${processed.length > 1 ? "s" : ""} uit huur gehaald.`,
          "success"
        );
      }

      // remove from queue
      if (this.rentalQueueSelected) {
        this.updateRentalQueue();
      }

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      if (!this.$store.state.settings.contract.static) {
        this.$store.commit("updateContract", null);
      }

      this.$store.commit("updateLoaderState", false);
      eventHub.$emit("after-response");

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
      const delivered = [];
      const d = moment().format("YYYY-MM-DD HH:mm:ss");

      eventHub.$emit("before-request");
      this.$store.commit("updateLoaderState", true);

      const res = await this.getContract();
      const contract = res.data;
      if (!contract) {
        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);

        this.notify(
          `Contract (${this.$store.state.contract}) kon niet worden opgehaald`
        );

        return;
      }

      const m = moment(contract.ESTRETD);
      if (!m || !m.isValid()) {
        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);

        this.notify(
          `Het datum veld ESTRETD van het contract (${this.$store.state.contract}) is ongeldig.`
        );

        return;
      }

      const estretd = m.format("YYYY-MM-DD HH:mm:ss");

      const contItemResults = await Promise.all(
        this.$store.state.rentalProducts.map(
          throat(3, p =>
            this.createContItemRequest({
              Itemno: p.ITEMNO,
              Qty: p.QTY,
              Sellingprice: 0,
              Istextitem: 0,
              Memo: `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`,
              Deldate: d,
              Hiredate: d,
              Estretd: estretd
            })
          )
        )
      );

      contItemResults.forEach(r => {
        if (!r || r.status > 201) {
          failed++;
          if (r && r.data && r.data.Message) {
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
        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);
        return;
      }

      const contItemDeliverResults = await Promise.all(
        products.map(throat(3, recid => this.deliverContractItem(recid)))
      );

      contItemDeliverResults.forEach(r => {
        let body, stock;

        if (r.config.data) {
          try {
            body = JSON.parse(r.config.data);
            stock = this.$store.state.rentalProducts.find(
              p => p.RECID === body.RECID
            );
          } catch (e) {
            console.log(e);
          }
        }

        if (!r || r.status > 201) {
          deliverFailed++;
          if (r.data && r.data.Message) {
            this.notify(r.data.Message);
          } else if (stock) {
            this.notify(`${stock.ITEMNO} niet afgeleverd.`);
          }
        } else {
          if (stock) delivered.push(stock);
        }
      });

      // remove the ones that succeeded from store
      if (failed && stockItems.length) {
        stockItems.forEach(s => {
          this.removeLocalProductByItemNumber(s.ITEMNO);
        });

        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);
        return;
      }

      // remove from queue
      if (this.rentalQueueSelected) {
        this.updateRentalQueue();
      }

      this.$store.commit("updateRentalProducts", []);
      this.$store.commit("updateCustomer", null);

      if (!this.$store.state.settings.contract.static) {
        this.$store.commit("updateContract", null);
      }

      this.$store.commit("updateLoaderState", false);
      eventHub.$emit("after-response");

      const total = contItemDeliverResults.length - deliverFailed;
      this.notify(
        `Er ${total > 1 ? "zijn" : "is"} ${total} contract item${
          total > 1 ? "s" : ""
        } in huur gezet.`,
        "success"
      );

      this.step = 1;
      this.$router.push("/rental");
    }
  }
};
</script>