<template>
  <div class="q-pa-md">
    <q-dialog v-model="selectContractItems" full-width full-height>
      <q-card>
        <q-card-section>
          <div class="text-h6">Contract items</div>
        </q-card-section>

        <q-card-section>
          <p>Selecteer de contract items die je uit huur wilt halen</p>

          <q-table
            v-if="contractItems.length"
            :data="contractItems"
            :columns="itemColumns"
            row-key="RECID"
            selection="multiple"
            :selected.sync="selectedContractItems"
          />
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-teal">
          <q-btn flat label="Klaar" v-close-popup @click="processSelection" />
          <q-btn flat label="Annuleren" color="danger" v-close-popup @click="processSelection" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <p
      v-if="!products.length"
    >Voeg artikelen toe met de barcode scanner door de QR code op het artikel te scannen.</p>
    <q-table
      v-if="products.length"
      title="Artikelen terugbrengen"
      :data="products"
      :columns="columns"
      row-key="RECID"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="CONTNO" :props="props">{{ props.row.CONTNO }}</q-td>
          <q-td key="ITEMNO" :props="props">{{ props.row.ITEMNO }}</q-td>
          <q-td key="ITEMDESC" :props="props">{{ props.row.ITEMDESC }}</q-td>
          <q-td key="MEMO" :props="props">{{ props.row.MEMO }}</q-td>
          <q-td key="HIRED" :props="props">{{ props.row.HIRED }}</q-td>
          <q-td key="QTYRETD" :props="props">{{ props.row.QTYRETD }}</q-td>
          <q-td key="QTYOK" :props="props" :class="props.row.UNIQUE ? 'text-bold' : ''">
            <q-icon name="fas fa-edit" v-if="!props.row.UNIQUE" />
            {{ !props.row.UNIQUE ? props.row.QTYOK : '' }}
            <q-popup-edit v-model="props.row.QTYOK" buttons v-if="!props.row.UNIQUE">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="add"
                      @click="incrementQty(props.row.__index, 'QTYOK')"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      style="text-align: center; padding-right: 10px;"
                    >{{ props.row.QTYOK }}</q-item-label>
                  </q-item-section>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="remove"
                      @click="decrementQty(props.row.__index, 'QTYOK')"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
            <q-toggle
              v-if="props.row.UNIQUE"
              :value="!!props.row.QTYOK"
              @input="v => toggleReturnState(v, props.row.__index, 'QTYOK')"
            />
          </q-td>

          <q-td key="QTYDAM" :props="props" :class="props.row.UNIQUE ? 'text-bold' : ''">
            <q-icon name="fas fa-edit" v-if="!props.row.UNIQUE" />
            {{ !props.row.UNIQUE ? props.row.QTYDAM : '' }}
            <q-popup-edit v-model="props.row.QTYDAM" buttons v-if="!props.row.UNIQUE">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="add"
                      @click="incrementQty(props.row.__index, 'QTYDAM')"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      style="text-align: center; padding-right: 10px;"
                    >{{ props.row.QTYDAM }}</q-item-label>
                  </q-item-section>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="remove"
                      @click="decrementQty(props.row.__index, 'QTYDAM')"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
            <q-toggle
              v-if="props.row.UNIQUE"
              :value="!!props.row.QTYDAM"
              @input="v => toggleReturnState(v, props.row.__index, 'QTYDAM')"
            />
          </q-td>

          <q-td key="QTYLOST" :props="props" :class="props.row.UNIQUE ? 'text-bold' : ''">
            <q-icon name="fas fa-edit" v-if="!props.row.UNIQUE" />
            {{ !props.row.UNIQUE ? props.row.QTYLOST : '' }}
            <q-popup-edit v-model="props.row.QTYLOST" buttons v-if="!props.row.UNIQUE">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="add"
                      @click="incrementQty(props.row.__index, 'QTYLOST')"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      style="text-align: center; padding-right: 10px;"
                    >{{ props.row.QTYLOST }}</q-item-label>
                  </q-item-section>
                  <q-item-section>
                    <q-btn
                      round
                      color="primary"
                      icon="remove"
                      @click="decrementQty(props.row.__index, 'QTYLOST')"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
            <q-toggle
              v-if="props.row.UNIQUE"
              :value="!!props.row.QTYLOST"
              @input="v => toggleReturnState(v, props.row.__index, 'QTYLOST')"
            />
          </q-td>
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
import { findIndex, clone } from "lodash";
const ioHook = require("iohook");

storage.setDataPath(`${os.tmpdir()}/insphire/stock`);

export default {
  name: "ReadContractItem",

  data() {
    return {
      products: this.$store.state.rentalProducts || [],
      contractItems: [],
      selectedContractItems: [],
      selectContractItems: false,
      itemnumber: null,
      code: "",
      reading: false,
      memo: null,
      columns: [
        {
          name: "CONTNO",
          required: true,
          label: "Contractnummer",
          align: "left",
          field: row => row.CONTNO,
          format: val => `${val}`,
          sortable: true
        },
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
          name: "ITEMDESC",
          required: true,
          label: "Omschrijving",
          align: "left",
          field: row => row.ITEMDESC,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "MEMO",
          required: true,
          label: "Memo",
          align: "left",
          field: row => row.MEMO,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "HIRED",
          required: true,
          label: "Verhuurd",
          align: "left",
          field: row => row.HIRED,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "QTYRETD",
          required: true,
          label: "Teruggebracht",
          align: "left",
          field: row => row.QTYRETD,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "QTYOK",
          label: "Goedgekeurd",
          align: "left",
          field: row => row.QTYOK,
          format: val => `${val}`,
          sortable: true,
          type: "rentalReturn"
        },
        {
          name: "QTYDAM",
          label: "Beschadigd",
          align: "left",
          field: row => row.QTYDAM,
          format: val => `${val}`,
          sortable: true,
          type: "rentalReturn"
        },
        {
          name: "QTYLOST",
          label: "Vermist",
          align: "left",
          field: row => row.QTYLOST,
          format: val => `${val}`,
          sortable: true,
          type: "rentalReturn"
        },
        {
          name: "DELETE",
          required: true,
          label: "Verwijderen",
          align: "left",
          sortable: false
        }
      ],
      itemColumns: [
        {
          name: "CONTNO",
          required: true,
          label: "Contractnummer",
          align: "left",
          field: row => row.CONTNO,
          format: val => `${val}`,
          sortable: true
        },
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
          name: "ITEMDESC",
          required: true,
          label: "Omschrijving",
          align: "left",
          field: row => row.ITEMDESC,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "MEMO",
          required: true,
          label: "Memo",
          align: "left",
          field: row => row.MEMO,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "HIRED",
          required: true,
          label: "Verhuurd",
          align: "left",
          field: row => row.HIRED,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "QTYRETD",
          required: true,
          label: "Teruggebracht",
          align: "left",
          field: row => row.QTYRETD,
          format: val => `${val}`,
          sortable: true
        }
      ]
    };
  },

  mounted() {
    ioHook.on("keyup", this.getInput);
    ioHook.start();

    if (this.$store.state.customer) {
      this.memo = `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`;
    }
  },

  methods: {
    incrementQty: function(index, prop) {
      const p = this.products[index];
      if (
        parseInt(p.QTYDAM) + parseInt(p.QTYLOST) + parseInt(p.QTYOK) >=
        parseInt(p.HIRED) - parseInt(p.QTYRETD)
      ) {
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Het ingestelde aantal van het artikel met nummer ${p.ITEMNO} is hoger dan het aantal momenteel in huur.`
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

    incrementOffhireProduct: function(data) {
      this.products[data.index][data.prop]++;
      this.$store.commit("updateRentalProducts", this.products);
    },

    toggleReturnState: function(val, index, prop) {
      switch (prop) {
        case "QTYOK":
          this.products[index][prop] = val
            ? 1
            : !this.products[index].QTYDAM && !this.products[index].QTYLOST
            ? 1
            : 0;
          this.products[index].QTYDAM = 0;
          this.products[index].QTYLOST = 0;
          break;
        case "QTYDAM":
          this.products[index][prop] = val
            ? 1
            : !this.products[index].QTYOK && !this.products[index].QTYLOST
            ? 1
            : 0;
          this.products[index].QTYOK = 0;
          this.products[index].QTYLOST = 0;
          break;
        case "QTYLOST":
          this.products[index][prop] = val
            ? 1
            : !this.products[index].QTYOK && !this.products[index].QTYDAM
            ? 1
            : 0;
          this.products[index].QTYOK = 0;
          this.products[index].QTYDAM = 0;
          break;
      }
    },

    deleteProduct: function(index) {
      this.products.splice(index, 1);
      this.$store.commit("updateRentalProducts", this.products);
    },

    async getInput(e) {
      this.$parent.$parent.$parent.nextIsDisabled = true;

      if (e.keycode === 28 && this.code.length >= 5) {
        this.itemnumber = this.code.replace(/\s/g, "").toUpperCase();
        await this.getContractItems();
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

    notifyNoContractItems: function() {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Geen contract items gevonden voor artikel met nummer ${this.itemnumber}`
      });
    },

    async findProduct(itemno) {
      let result;
      try {
        this.$store.commit("updateLoaderState", true);
        result = await this.$api.get(
          `${this.$config.api_base_url}stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${itemno}'&fields=UNIQUE`
        );

        if (result && result.data && result.data.length) {
          return result.data[0];
        } else {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Product met nummer ${itemno} niet gevonden.`
          });
          return;
        }
      } catch (e) {
        log.error(e);
      }

      return null;
    },

    async addProduct(found) {
      const p = this.products.find(p => p.RECID === found.RECID);

      if (p && !p.UNIQUE) {
        if (
          parseInt(p.QTYDAM) + parseInt(p.QTYLOST) + parseInt(p.QTYOK) >=
          parseInt(p.HIRED) - parseInt(p.QTYRETD)
        ) {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Het ingestelde aantal van het artikel met nummer ${p.ITEMNO} is hoger dan het aantal momenteel in huur.`
          });
        } else {
          p.QTYOK += 1;
        }
      } else if (p && p.UNIQUE) {
        // notify?
      } else {
        this.products.push(
          Object.assign(found, {
            QTYDAM: 0,
            QTYLOST: 0,
            QTYOK: 1
          })
        );
      }
    },

    async getContractItems() {
      let res;

      this.$store.commit("updateLoaderState", true);
      eventHub.$emit("before-request");

      try {
        let baseURL = `${this.$config.api_base_url}contractitems`;

        if (
          this.$store.state.settings.contract.static &&
          this.$store.state.contract
        ) {
          baseURL = `${this.$config.api_base_url}contracts/${this.$store.state.contract}/items`;
        }

        res = await this.$api.get(
          `${baseURL}?api_key=${this.$store.state.api_key}&$orderby=ROWORDER desc&$filter=ITEMNO eq '${this.itemnumber}' and STATUS eq 1&fields=RECID,RECORDER,CONTNO,ITEMNO,ITEMDESC,MEMO,QTY,QTYRETD`
        );

        if (!res || !res.data || !res.data.length) {
          this.notifyNoContractItems();
          eventHub.$emit("after-response");
          this.$store.commit("updateLoaderState", false);
          return;
        }

        const items = [];
        const mismatches = [];

        const p = await this.findProduct(res.data[0].ITEMNO);

        eventHub.$emit("after-response");
        this.$store.commit("updateLoaderState", false);
        if (!p) return;

        // find stock for each item
        res.data.forEach(item => {
          item.UNIQUE = p.UNIQUE;
          // check if bulk, static contract and memo match
          if (
            this.$store.state.contract &&
            !item.UNIQUE &&
            item.MEMO !== this.memo
          ) {
            mismatches.push(item);
          } else {
            items.push(item);
          }
        });

        if (mismatches.length && !items.length) {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Product met nummer ${res.data[0].ITEMNO} en memo ${res.data[0].MEMO} niet in huur bij huidige klant.`
          });
        }

        if (items.length > 1) {
          // get current matching products
          const matches = res.data.reduce((acc, item) => {
            const p = this.products.find(p => p.RECID === item.RECID);
            if (p) acc.push(p);
            return acc;
          }, []);

          items.forEach(item => {
            item.DESC1 = item.ITEMDESC;
            item.HIRED = item.QTY;
            delete item.QTY;
            if (
              matches.length &&
              this.products.find(p => p.RECID === item.RECID)
            ) {
              this.addProduct(item);
            } else {
              this.contractItems.push(item);
            }
          });

          if (!matches.length) {
            this.selectContractItems = true;
          } else {
            this.$store.commit("updateRentalProducts", this.products);
          }

          eventHub.$emit("after-response");
          this.$store.commit("updateLoaderState", false);

          return;
        } else {
          items.forEach(item => {
            item.DESC1 = item.ITEMDESC;
            item.HIRED = item.QTY;
            delete item.QTY;
            this.addProduct(item);
          });

          this.$store.commit("updateRentalProducts", this.products);
        }
      } catch (e) {
        log.error(e);
        this.notifyNoContractItems();
      }

      eventHub.$emit("after-response");
      this.$store.commit("updateLoaderState", false);
    },

    async processSelection() {
      if (!this.selectedContractItems.length) {
        this.contractItems = [];
        return;
      }

      this.$store.commit("updateLoaderState", true);
      eventHub.$emit("before-request");

      this.selectedContractItems.forEach(async item => {
        const p = clone(item);
        await this.addProduct(p);
      });

      this.selectedContractItems = [];
      this.contractItems = [];
      this.$store.commit("updateRentalProducts", this.products);

      eventHub.$emit("after-response");
      this.$store.commit("updateLoaderState", false);
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
