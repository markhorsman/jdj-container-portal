<template>
  <div class="q-px-lg q-pb-md">
    <br />
    <div class="row q-col-gutter-sm">
      <div class="col-xs-12 col-md-8">
        <q-card style="min-height: 200px;">
          <q-card-section>
            <div class="text-h6">Artikelen verplaatsen</div>
            <p>Hier kun je artikelen verplaatsen naar het huidige depot.</p>
            <br />
            <p v-if="!product">Scan een artikel om verder te gaan.</p>
            <q-space />
          </q-card-section>

          <q-card-section v-if="product" class="bg-teal-1 text-grey-8">
            <q-item>
              <q-item-section>
                <q-item-label>{{ product.ITEMNO }}</q-item-label>
                <q-item-label caption lines="2">{{ product.DESC1 }}</q-item-label>
              </q-item-section>

              <q-item-section center>
                <q-item-label>
                  <q-icon name="fas fa-warehouse" style="margin-right: 10px;" />
                  {{ product.CURRDEPOT }}
                </q-item-label>
              </q-item-section>

              <q-item-section v-if="!product.UNIQUE" side>
                <q-item-label caption>
                  <q-btn round color="primary" icon="add" @click="incrementQty()" />
                </q-item-label>
              </q-item-section>

              <q-item-section v-if="!product.UNIQUE" side>
                <q-item-label style="text-align: center;">{{ product.QTY }}</q-item-label>
              </q-item-section>

              <q-item-section v-if="!product.UNIQUE" side>
                <q-item-label>
                  <q-btn round color="primary" icon="remove" @click="decrementQty()" />
                </q-item-label>
              </q-item-section>

              <q-item-section v-if="product.UNIQUE" side>
                <q-item-label caption>
                  <q-chip color="primary" text-color="white">{{ product.QTY }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-card-section>

          <q-card-actions v-if="product">
            <q-btn color="primary" label="Verplaatsen" @click="transfer" style="margin-top: 10px;" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
const ioHook = require("iohook");

export default {
  name: "StockTransfer",

  data() {
    return {
      product: null,
      stockDepotSource: null,
      currentStockDepot: null,
      itemnumber: null,
      code: "",
      reading: false
    };
  },

  mounted() {
    ioHook.on("keyup", this.getInput);
    ioHook.start();
  },

  methods: {
    getInput(e) {
      if (e.keycode === 28 && this.code.length >= 5) {
        this.itemnumber = this.code.replace(/\s/g, "");
        this.getProduct();
        this.code = "";
      } else {
        const char = String.fromCharCode(e.rawcode).replace(/[^0-9a-z]/gi, '');
        if (typeof char !== "undefined" && char.length && char !== ' ') {
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

    getProduct() {
      this.$api
        .get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,ITEMNO,DESC1,DESC2,DESC3,UNIQUE,STKLEVEL,STATUS,CURRDEPOT`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            if (
              this.product &&
              this.product.ITEMNO === res.data[0].ITEMNO &&
              !this.product.UNIQUE
            ) {
              this.product.QTY++;
            } else {
              res.data[0].QTY = res.data[0].STKLEVEL;
              this.product = res.data[0];
            }

            this.getStockDepots();
          } else {
            this.notifyNotFound();
          }
        })
        .catch(() => {
          this.notifyNotFound();
        });
    },

    transfer() {
      this.$api
        .put(
          `${this.$config.container_api_base_url}stocktransfer`,
          {
            CODE: this.$store.state.user.DEPOT,
            ITEMNO: this.product.ITEMNO,
            QTY: this.product.QTY,
            RECID: this.product.RECID,
            STOCK_DEPOT_SOURCE: this.stockDepotSource,
            CURRENT_STOCK_DEPOT: this.currentStockDepot
          },
          {
            auth: this.$config.container_api_basic_auth
          }
        )
        .then(res => {
          this.$q.notify({
            color: "green-4",
            icon: "fas fa-check-circle",
            message: `Artikel met code ${this.itemnumber} is overgeplaatst`
          });

          this.itemnumber = null;
          this.product = null;
          this.stockdepot = null;
        })
        .catch(err => {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message:
              "Er is iets misgegaan tijdens het verplaatsen van het artikel"
          });
        });
    },

    getStockDepots() {
      return this.$api
        .get(
          `${this.$config.api_base_url}/stockdepots?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,CODE`
        )
        .then(res => {
          if (res.data && res.data.length) {
            res.data.forEach(stkdepot => {
              if (
                this.$config.main_depot &&
                stkdepot.CODE === this.$config.main_depot
              ) {
                this.stockDepotSource = stkdepot.RECID;
              } else if (stkdepot.CODE === this.$store.state.user.DEPOT) {
                this.currentStockDepot = stkdepot.RECID;
              }
            });
          }
        });
    },

    incrementQty: function(index) {
      this.product.QTY++;
    },

    decrementQty: function(index) {
      if (this.product.QTY === 1) return;
      this.product.QTY--;
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
