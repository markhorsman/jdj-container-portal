<template>
  <div class="q-pa-md">
    <p
      v-if="!products.length"
    >Voeg artikelen toe met de barcode scanner door de QR code op het artikel te scannen.</p>
    <q-table
      v-if="products.length"
      title="Artikelen in huur nemen"
      :data="products"
      :columns="columns"
      row-key="RECID"
    >
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
                      @click="incrementQty(props.row.__index, 'QTY')"
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
                      @click="decrementQty(props.row.__index, 'QTY')"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
          </q-td>

          <q-td key="STKLEVEL" :props="props">{{ props.row.STKLEVEL }}</q-td>
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
import storage from "electron-json-storage";
import os from "os";
import { eventHub } from "../eventhub";
import log from "electron-log";
import { setTimeout } from "timers";
import { findIndex } from "lodash";
const ioHook = require("iohook");

storage.setDataPath(`${os.tmpdir()}/insphire/stock`);

export default {
  name: "ReadProduct",

  props: ["title", "isOffhire"],

  data() {
    return {
      products: this.$store.state.rentalProducts || [],
      itemnumber: null,
      code: "",
      reading: false,
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
          type: "rentalPickup"
        },
        {
          name: "STKLEVEL",
          required: true,
          label: "Voorraad",
          align: "left",
          field: row => row.STKLEVEL,
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
      ]
    };
  },

  mounted() {
    ioHook.on("keyup", this.getInput);
    ioHook.start();
  },

  methods: {
    incrementQty: function(index, prop) {
      if (
        parseInt(this.products[index].STKLEVEL) <
        parseInt(this.products[index].QTY) + 1
      ) {
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Product met nummer ${this.products[index].ITEMNO} heeft onvoldoende voorraad.`
        });
        return;
      }

      this.products[index][prop]++;
      this.$store.commit("updateRentalProducts", this.products);
    },

    decrementQty: function(index, prop) {
      if (this.products[index][prop] === 1) return;
      this.products[index][[prop]]--;
      this.$store.commit("updateRentalProducts", this.products);
    },

    deleteProduct: function(index) {
      this.products.splice(index, 1);
      this.$store.commit("updateRentalProducts", this.products);
    },

    getInput: function(e) {
      this.$parent.$parent.$parent.nextIsDisabled = true;

      if (e.keycode === 28 && this.code.length >= 5) {
        this.itemnumber = this.code.replace(/\s/g, "").toUpperCase();
        this.getProduct();
        this.code = "";

        setTimeout(() => {
          this.$parent.$parent.$parent.nextIsDisabled = false;
        }, 100);
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
          this.$parent.$parent.$parent.nextIsDisabled = false;
        }, 200);
      }
    },

    notifyNotFound: function() {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Product met nummer ${this.itemnumber} niet gevonden.`
      });
    },

    async addProduct(found) {
      if (!this.$store.state.offline) {
        let result;

        try {
          result = await this.$api.get(
            `${this.$config.api_base_url}stockdepots?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${found.ITEMNO}' and CODE eq '${this.$store.state.user.DEPOT}'&fields=ITEMNO,STKLEVEL`
          );
        } catch (e) {
          log.error(e);
          result = null;
        }

        if (result && result.data && result.data.length) {
          found.STKLEVEL = result.data[0].STKLEVEL;
        }
      }

      const p = this.products.find(p => p.ITEMNO === found.ITEMNO);

      if (p && !p.UNIQUE) {
        if (parseInt(p.STKLEVEL) >= parseInt(p.QTY) + 1) {
          p.QTY = parseInt(p.QTY) + 1;
        } else {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Product met nummer ${p.ITEMNO} heeft onvoldoende voorraad.`
          });
        }
      } else if (p && p.UNIQUE) {
        // notify?
      } else {
        if (found.STKLEVEL > 0) {
          this.products.push(
            Object.assign(found, {
              QTY: 1
            })
          );
        } else {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Product met nummer ${found.ITEMNO} heeft onvoldoende voorraad.`
          });
        }
      }
      this.$store.commit("updateRentalProducts", this.products);
    },

    getProduct: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,ITEMNO,DESC1,DESC2,DESC3,UNIQUE,STKLEVEL,STATUS`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            const found = res.data[0];

            this.addProduct(found);
          } else {
            this.notifyNotFound();
          }
        })
        .catch(e => {
          log.error(e);
          this.notifyNotFound();
        });
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
