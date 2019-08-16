<template>
  <div class="q-pa-md">
    <p
      v-if="!products.length"
    >Voeg artikelen toe met de barcode scanner door de QR code op het artikel te scannen.</p>
    <q-table
      v-if="products.length"
      :title="title"
      :data="products"
      :columns="columns"
      :visible-columns="visibleColumns"
      row-key="RECID"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="ITEMNO" :props="props">{{ props.row.ITEMNO }}</q-td>
          <q-td key="DESC1" :props="props">{{ props.row.DESC1 }}</q-td>
          <q-td
            key="QTY"
            v-if="!isRentalTypeReturn"
            :props="props"
            :class="props.row.UNIQUE ? 'text-bold' : ''"
          >
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

          <q-td
            key="QTYOK"
            v-if="isRentalTypeReturn"
            :props="props"
            :class="props.row.UNIQUE ? 'text-bold' : ''"
          >
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

          <q-td
            key="QTYDAM"
            v-if="isRentalTypeReturn"
            :props="props"
            :class="props.row.UNIQUE ? 'text-bold' : ''"
          >
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

          <q-td
            key="QTYLOST"
            v-if="isRentalTypeReturn"
            :props="props"
            :class="props.row.UNIQUE ? 'text-bold' : ''"
          >
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
          type: "rentalPickup"
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
    document.addEventListener("keypress", this.getInput);

    this.visibleColumns = this.columns.reduce((acc, c) => {
      if (
        !c.type ||
        c.type === (this.isRentalTypeReturn ? "rentalReturn" : "rentalPickup")
      )
        acc.push(c.name);
      return acc;
    }, []);
  },

  computed: {
    isRentalTypeReturn() {
      return this.$parent.$parent.$parent.rentalType === "return";
    }
  },

  methods: {
    incrementQty: function(index, prop) {
      this.products[index][prop]++;
      this.$store.commit("updateRentalProducts", this.products);
    },

    decrementQty: function(index, prop) {
      if (this.products[index][prop] === 1) return;
      this.products[index][[prop]]--;
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

    getInput: function(e) {
      e.stopImmediatePropagation();
      if (e.keyCode === 13 && this.code.length >= 5) {
        this.itemnumber = this.code;
        this.getProduct();
        this.code = "";
      } else {
        this.code += e.key;
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

    notifyNotFound: function() {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Product met nummer ${this.itemnumber} niet gevonden.`
      });
    },

    addProduct(found) {
      const p = this.products.find(p => p.ITEMNO === found.ITEMNO);

      if (p && !p.UNIQUE) {
        p.QTY = parseInt(p.QTY) + 1;
      } else if (p && p.UNIQUE) {
        // notify?
      } else {
        this.products.push(
          Object.assign(found, {
            QTY: 1,
            QTYDAM: 0,
            QTYLOST: 0,
            QTYOK: 1
          })
        );
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

            // send signal
            if (!found.UNIQUE && isOffhire) {
              eventHub.$emit("offhire-check-contitem", found);
              return;
            }

            this.addProduct(found);
          } else {
            this.notifyNotFound();
          }
        })
        .catch(() => {
          this.notifyNotFound();
        });
    }
  },

  created() {
    eventHub.$on("add-product", this.addProduct);
  },

  beforeDestroy() {
    eventHub.$off("add-product", this.addProduct);
  },

  destroyed() {
    document.removeEventListener("keypress", this.getInput);
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
