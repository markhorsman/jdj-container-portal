<template>
  <div class="q-pa-md">
    <q-dialog v-model="confirmToggleDepot" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-exchange-alt" color="primary" text-color="white" />
          <span
            class="q-ml-sm"
          >Weet je zeker dat je richting wilt veranderen? De huidige producten dien je opnieuw toe te voegen.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Ja" color="danger" @click="reset" v-close-popup />
          <q-btn flat label="Nee" color="primary" @click="cancelToggleDepot" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-banner class="bg-grey-3" style="margin-bottom: 20px;">
      <div class="text-h6" style="margin-bottom: 10px;">Artikelen verplaatsen</div>
      <p>Scan een of meerdere artikelen met een barcode scanner en klik op onderstaande knop om ze te verplaatsen van of naar het huidige depot.</p>
    </q-banner>

    <q-table
      title="Artikelen verplaatsen"
      :data="products"
      :columns="columns"
      row-key="RECID"
      :pagination.sync="pagination"
    >
      <template v-slot:top-left>
        <q-btn
          dense
          color="primary"
          :disabled="!products.length"
          label="Verplaatsen"
          @click="transfer"
        />
      </template>

      <template v-slot:top-right>
        <q-toggle
          @input="toggleDepot"
          v-model="to_current_depot"
          :label=" `Van ${source_depot} naar ${destination_depot}`"
        />
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="ITEMNO" :props="props">{{ props.row.ITEMNO }}</q-td>
          <q-td key="DESC1" :props="props">{{ props.row.DESC1 }}</q-td>
          <q-td key="QTY" :props="props" :class="props.row.UNIQUE ? 'text-bold' : ''">
            <q-icon name="fas fa-edit" v-if="!props.row.UNIQUE" />
            {{ props.row.QTY }}
            <q-popup-edit v-model="props.row.QTY" buttons v-if="!props.row.UNIQUE">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="add"
                      @click="incrementQty(props.row.__index)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      style="text-align: center; padding-right: 10px;"
                    >{{ props.row.QTY }}</q-item-label>
                  </q-item-section>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="remove"
                      @click="decrementQty(props.row.__index)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
          </q-td>

          <q-td key="CURRENT_DEPOT_STKLEVEL" :props="props">{{ props.row.CURRENT_DEPOT_STKLEVEL }}</q-td>
          <q-td key="MAIN_DEPOT_STKLEVEL" :props="props">{{ props.row.MAIN_DEPOT_STKLEVEL }}</q-td>
          <q-td key="DELETE" :props="props">
            <q-icon
              name="delete"
              style="font-size: 1.5em; cursor: pointer;"
              @click="deleteProduct(props.row.__index)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
const ioHook = require("iohook");
import log from "electron-log";
import { findIndex } from "lodash";
const throat = require("throat")(Promise);

export default {
  name: "StockTransfer",

  data() {
    return {
      pagination: {
        rowsNumber: 0,
        rowsPerPage: 100
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
          label: "Aantal",
          align: "left",
          field: row => row.QTY,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "CURRENT_DEPOT_STKLEVEL",
          required: true,
          label: `Voorraad ${this.$store.state.user.DEPOT}`,
          align: "left",
          field: row => row.CURRENT_DEPOT_STKLEVEL,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "MAIN_DEPOT_STKLEVEL",
          required: true,
          label: `Voorraad ${this.$config.main_depot}`,
          align: "left",
          field: row => row.MAIN_DEPOT_STKLEVEL,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "DELETE",
          required: true,
          label: "Verwijderen",
          align: "left",
          sortable: false
        }
      ],

      products: [],
      to_current_depot: true,
      source_depot: this.$config.main_depot,
      destination_depot: this.$store.state.user.DEPOT || null,
      itemnumber: null,
      code: "",
      reading: false,
      confirmToggleDepot: false
    };
  },

  mounted() {
    ioHook.on("keyup", this.getInput);
    ioHook.start();
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
    toggleDepot(v) {
      if (this.products.length) this.confirmToggleDepot = true;

      if (v) {
        this.destination_depot = this.$store.state.user.DEPOT;
        this.source_depot = this.$config.main_depot;
      } else {
        this.destination_depot = this.$config.main_depot;
        this.source_depot = this.$store.state.user.DEPOT;
      }
    },

    reset() {
      this.products = [];
    },

    cancelToggleDepot() {
      this.to_current_depot = !this.to_current_depot;
    },

    incrementQty: function(index) {
      this.products[index].QTY++;
    },

    decrementQty: function(index) {
      if (this.products[index].QTY === 1) return;
      this.products[index].QTY--;
    },

    deleteProduct: function(index) {
      this.products.splice(index, 1);
    },

    getInput(e) {
      if (e.keycode === 28 && this.code.length >= 5) {
        this.itemnumber = this.code.replace(/\s/g, "").toUpperCase();
        this.getProduct();
        this.code = "";
      } else {
        const char = String.fromCharCode(e.rawcode).replace(/[^0-9a-z]/gi, "");
        if (typeof char !== "undefined" && char.length && char !== " ") {
          this.code += char;
        }
      }

      //run a timeout of 200ms at the first read and clear everything
      if (!this.reading) {
        this.reading = true;
        setTimeout(() => {
          this.code = "";
          this.reading = false;
        }, 200);
      }
    },

    notifyNotFound() {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Artikel met nummer ${this.itemnumber} niet gevonden.`
      });
    },

    async getProduct() {
      let res;
      let p;

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,ITEMNO,DESC1,DESC2,DESC3,UNIQUE,STKLEVEL,STATUS,CURRDEPOT`
        );

        if (res && res.data && res.data.length) {
          p = this.products.find(p => p.ITEMNO === res.data[0].ITEMNO);

          if (p && !p.UNIQUE) {
            p.QTY = parseInt(p.QTY) + 1;
          } else if (p && p.UNIQUE) {
            // notify?
          } else {
            p = Object.assign(res.data[0], {
                QTY: 1,
                DESTINATION_STKDEPOT_RECID: null,
                CURRENT_DEPOT_STKLEVEL: 0,
                SOURCE_STKDEPOT_RECID: null,
                MAIN_DEPOT_STKLEVEL: 0
              });
            this.products.push(p);
          }

          await this.getStockDepots();

          if (p.UNIQUE && p.CURRENT_DEPOT_STKLEVEL && this.to_current_depot) {
            this.$q.notify({
              color: "red-5",
              icon: "fas fa-exclamation-triangle",
              message: `Uniek artikel met nummer ${this.itemnumber} staat al in ${this.$store.state.user.DEPOT}.`
            });

            const index = findIndex(this.products, { ITEMNO: p.ITEMNO });
            if (typeof index !== 'undefined') this.products.splice(index, 1);
          } else if (
            p.UNIQUE &&
            p.MAIN_DEPOT_STKLEVEL &&
            !this.to_current_depot
          ) {
            this.$q.notify({
              color: "red-5",
              icon: "fas fa-exclamation-triangle",
              message: `Uniek artikel met nummer ${this.itemnumber} staat al in ${this.$config.main_depot}.`
            });

            const index = findIndex(this.products, { ITEMNO: p.ITEMNO });
            if (typeof index !== 'undefined') this.products.splice(index, 1);
          }
        } else {
          this.notifyNotFound();
        }
      } catch (e) {
        this.log.error(e);
        this.notifyNotFound();
      }
    },

    async transferItem(item) {
      let result;

      try {
        result = await this.$api.put(
          `${this.$config.container_api_base_url}stocktransfer`,
          {
            CODE: this.$store.state.user.DEPOT,
            ITEMNO: item.ITEMNO,
            QTY: item.QTY,
            RECID: item.RECID,
            STOCK_DEPOT_SOURCE: item.SOURCE_STKDEPOT_RECID,
            CURRENT_STOCK_DEPOT: item.DESTINATION_STKDEPOT_RECID
          },
          {
            auth: this.$config.container_api_basic_auth
          }
        );
      } catch (e) {
        log.error(e);
      }

      return result;
    },

    async transfer() {
      let failed = 0,
        success = 0;

      const results = await Promise.all(
        this.products.map(throat(10, p => this.transferItem(p)))
      );

      results.forEach(r => {
        let body;

        if (r && r.data) {
          try {
            body = JSON.parse(r.config.data);
          } catch (e) {
            log.error(e);
          }
        }

        if (!r || r.status > 201) {
          failed++;
          if (body && body.ITEMNO) {
            this.$q.notify({
              color: "red-5",
              icon: "fas fa-exclamation-triangle",
              message: `Artikel met nummer ${body.ITEMNO} kon niet worden verplaatst.`
            });
          }
        } else if (body && body.ITEMNO) {
          success++;
          const index = findIndex(this.products, { ITEMNO: body.ITEMNO });
          if (index >= 0) this.products.splice(index, 1);
        }
      });

      if (success) {
        this.$q.notify({
          color: "green-4",
          icon: "fas fa-check-circle",
          message: `Er ${success > 1 ? "zijn" : "is"} ${success} ${
            success > 1 ? "artikelen" : "artikel"
          } overgeplaatst.`
        });
      }
    },

    async getStockDepots() {
      // get Stkdepot for CMAG
      let main, current, result;
      const p = this.products.find(p => p.ITEMNO === this.itemnumber);
      if (!p) return;

      try {
        result = await this.$api.get(
          `${this.$config.api_base_url}/stockdepots?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}' and CODE eq '${this.$config.main_depot}'&fields=RECID,CODE,STKLEVEL`
        );

        if (result && result.data && result.data.length) {
          main = result.data[0];
          if (this.to_current_depot) {
            p.SOURCE_STKDEPOT_RECID = main.RECID;
          } else {
            p.DESTINATION_STKDEPOT_RECID = main.RECID;
          }

          p.MAIN_DEPOT_STKLEVEL = main.STKLEVEL;
        }
      } catch (e) {
        log.error(e);
      }

      try {
        result = await this.$api.get(
          `${this.$config.api_base_url}/stockdepots?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}' and CODE eq '${this.$store.state.user.DEPOT}'&fields=RECID,CODE,STKLEVEL`
        );
        if (result && result.data && result.data.length) {
          current = result.data[0];

          if (this.to_current_depot) {
            p.DESTINATION_STKDEPOT_RECID = current.RECID;
          } else {
            p.SOURCE_STKDEPOT_RECID = current.RECID;
          }

          p.CURRENT_DEPOT_STKLEVEL = current.STKLEVEL;
        }
      } catch (e) {
        log.error(e);
      }
    }
  },

  destroyed() {
    ioHook.stop();
    ioHook.removeListener("keyup", this.getInput);
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
