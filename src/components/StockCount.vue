<template>
  <div class="q-pa-md">
    <q-dialog v-model="genList" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-calculator" color="primary" text-color="white" />
          <span class="q-ml-sm">Wil je de lijst mailen of printen?</span>
        </q-card-section>

        <q-card-section v-if="listType === 'uncounted'">
          <q-toggle
            :label="exportWithFilter ? 'Alleen gefilterde artikelen' : `Alle artikelen`"
            v-model="exportWithFilter"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Mailen" color="primary" icon="email" @click="chooseEmail = true" />
          <q-btn flat label="Printen" color="primary" icon="print" @click="print" />
          <q-btn
            v-if="listType === 'counted'"
            flat
            label="Lijst leegmaken"
            color="danger"
            v-close-popup
            @click="clear"
          />
          <q-btn flat label="Sluiten" color="danger" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="chooseEmail" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="email" color="primary" text-color="white" />
          <span class="q-ml-sm">Naar wie mag de e-mail verstuurd worden?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-input
            v-model="emailaddress"
            filled
            type="email"
            placeholder="E-mailadres"
            class="full-width"
            error-message="Ongeldig E-mailadres"
            :error="!isValidEmail"
            :rules="[val => !!val || 'E-mailadres is verplicht']"
          />
          <br />
          <q-btn
            flat
            label="Versturen"
            color="primary"
            icon="email"
            @click="email"
            :disabled="!emailaddress.length || !isValidEmail"
          />
          <q-btn flat label="Sluiten" color="danger" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-select
      outlined
      clearable
      v-model="subgroup"
      use-input
      hide-selected
      fill-input
      input-debounce="0"
      :options="subgroupOptions"
      @filter="filterSubgroups"
      @input="onRequest({
      pagination,
      filter
    })"
      @remove="onRequest({
      pagination,
      filter
    })"
      label="Subgroep"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">Geen resultaten</q-item-section>
        </q-item>
      </template>
    </q-select>

    <br />

    <div class="row q-col-gutter-md">
      <div class="col-sm-12 col-md-6">
        <q-table
          title="Niet-geteld"
          :data="tableData"
          :columns="columns"
          row-key="ITEMNO"
          :loading="loading"
          :filter="filter"
          :rows-per-page-options="[3, 5, 7, 10, 15, 25, 50, 100, 200, 300]"
          :pagination.sync="pagination"
          @request="onRequest"
        >
          <template v-slot:top-left>
            <q-btn
              dense
              color="primary"
              :disabled="!tableData.length"
              label="Lijst ongeteld genereren"
              @click="genList = true; listType = 'uncounted';"
            />
          </template>
          <template v-slot:top-right>
            <q-input
              borderless
              dense
              debounce="500"
              v-model="filter"
              placeholder="Zoek op artikelnummer"
              ref="searchStock"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append v-if="filter.length">
                <q-icon name="close" @click="filter = ''" class="cursor-pointer" />
              </template>
            </q-input>
          </template>
        </q-table>
      </div>
      <div class="col-sm-12 col-md-6">
        <q-table
          title="Geteld"
          :data="selected"
          :columns="selectedColumns"
          :rows-per-page-options="[]"
          :pagination.sync="selectedPagination"
          row-key="ITEMNO"
        >
          <template v-slot:top-left>
            <q-btn
              dense
              color="primary"
              :disabled="!selected.length"
              label="Tellijst genereren"
              @click="genList = true; listType = 'counted';"
            />
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="ITEMNO" :props="props">{{ props.row.ITEMNO }}</q-td>
              <q-td key="DESC1" :props="props">{{ props.row.DESC1 }}</q-td>
              <q-td key="QTY" :props="props" :class="props.row.UNIQUE ? 'text-bold' : ''">
                <q-icon name="fas fa-edit" v-if="!props.row.UNIQUE" />
                {{ props.row.QTY }}
                <q-popup-edit
                  v-model="props.row.QTY"
                  buttons
                  v-if="!props.row.UNIQUE"
                  @save="(value, initialValue) => saveQTY(props.row.__index, value, initialValue)"
                >
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
              <q-td key="STKLEVEL" :props="props">{{ props.row.STKLEVEL }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<script>
import { findIndex, clone, sortBy } from "lodash";
import { eventHub } from "../eventhub";
import { emailStockCount } from "../mailer";
import { getStockLevelForProducts } from "../stock";
import printJS from "print-js";
const ioHook = require("iohook");
const throat = require("throat")(Promise);
import log from "electron-log";
import { setTimeout } from "timers";

export default {
  data() {
    return {
      selected: this.$store.state.stockCount,
      selectedPagination: {
        descending: false,
        page: 1,
        rowsPerPage: 25
      },
      pagination: {
        rowsNumber: 0,
        sortBy: "ITEMNO",
        descending: false,
        page: 1,
        rowsPerPage: 25
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
          label: "Ongeteld",
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
      ],
      selectedColumns: [
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
      ],
      tableData: [],
      subgroups: [],
      subgroupOptions: [],
      subgroup: null,
      filter: "",
      loading: false,
      code: "",
      reading: false,
      genList: false,
      listType: "counted",
      chooseEmail: false,
      emailaddress: this.$config.email.default_email,
      exportWithFilter: true
    };
  },

  async mounted() {
    this.$store.commit("saveStockCount", []);

    ioHook.on("keyup", this.getInput);
    ioHook.start();

    await this.getSubGroups();

    this.onRequest({
      pagination: this.pagination,
      filter: undefined
    });
  },

  computed: {
    isValidEmail() {
      var re = /\S+@\S+\.\S+/;
      return re.test(this.emailaddress);
    }
  },

  methods: {
    async onRequest(props) {
      let {
        page,
        rowsPerPage,
        rowsNumber,
        sortBy,
        descending
      } = props.pagination;
      let filter = props.filter;
      let res;

      // calculate starting row of data
      let startRow = (page - 1) * rowsPerPage;

      const buildFilter = () =>
        `CURRDEPOT eq '${this.$store.state.user.DEPOT}'
         and STATUS eq 0
        ${filter ? ` and startswith(ITEMNO, '${filter}')` : ``}
        ${this.subgroup ? ` and GRPCODE eq '${this.subgroup.value}'` : ``}
        `;

      this.loading = true;
      this.$store.commit("updateLoaderState", true);
      eventHub.$emit("before-request");

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}stock?api_key=${
            this.$store.state.api_key
          }&$top=${rowsPerPage}&$skip=${startRow}&$inlinecount=allpages${
            sortBy ? `&$orderby=${sortBy} ${descending ? `desc` : `asc`}` : ``
          }&$filter=${buildFilter()}&fields=PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS,STKLEVEL,UNIQUE`
        );
        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.rowsNumber = res.data.totalCount;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;

        const data = await getStockLevelForProducts(
          this.$store.state.api_key,
          this.$store.state.user.DEPOT,
          res.data.results.slice(0)
        );

        data.forEach(s => {
          const product = res.data.results.find(p => p.ITEMNO === s.ITEMNO);
          if (product) product.STKLEVEL = s.STKLEVEL;
        });

        this.tableData = res.data.results.reduce((acc, p) => {
          const s = this.selected.find(item => item.ITEMNO === p.ITEMNO);

          if (!s) {
            p.QTY = p.STKLEVEL;
            acc.push(p);
            return acc;
          }

          if (p.UNIQUE) {
            return acc;
          } else {
            p.QTY = p.STKLEVEL - s.QTY;
            if (!p.QTY) return acc;

            acc.push(p);
            return acc;
          }
        }, []);
      } catch (e) {
        log.error(e);
      }

      this.loading = false;
      this.$store.commit("updateLoaderState", false);
      eventHub.$emit("after-response");
    },

    async getAll() {
      this.$store.commit("updateLoaderState", true);
      eventHub.$emit("before-request");

      let res,
        data,
        all = [];

      try {
        res = await this.$api.get(
          `${this.$config.container_api_base_url}stock/${this.$store.state.user.DEPOT}`,
          { auth: this.$config.container_api_basic_auth }
        );

        res.data.forEach(p => {
          if (typeof p.STKLEVEL === "undefined") {
            p.STKLEVEL = p.STKLEVEL_OVERALL;
          }
        });

        all = res.data.reduce((acc, p) => {
          const s = this.selected.find(item => item.ITEMNO === p.ITEMNO);

          if (!s) {
            p.QTY = p.STKLEVEL;
            acc.push(p);
            return acc;
          }

          if (p.UNIQUE) {
            return acc;
          } else {
            p.QTY = p.STKLEVEL - s.QTY;
            if (!p.QTY) return acc;

            acc.push(p);
            return acc;
          }
        }, []);
      } catch (e) {
        log.error(e);
      }

      return all;
    },

    async getSubGroups() {
      let res;

      this.$store.commit("updateLoaderState", true);
      eventHub.$emit("before-request");

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}subgroups?api_key=${this.$store.state.api_key}&$orderby=CODE asc&fields=CODE,NAME,PGROUP&$orderby=CODE asc`
        );

        this.subgroups = sortBy(
          res.data.reduce((acc, grp) => {
            acc.push({
              label: `${grp.CODE} - ${grp.NAME}`,
              value: grp.CODE
            });
            return acc;
          }, []),
          "label"
        );

        this.subgroupOptions = this.subgroups;
      } catch (e) {
        log.error(e);
      }
    },

    async getProduct(itemnumber) {
      let res;

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${itemnumber}' and STATUS eq 0&fields=PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS,STKLEVEL,UNIQUE`
        );
      } catch (e) {}
      return res.data ? res.data[0] : null;
    },

    async getInput(e) {
      if (e.keycode === 28 && this.code.length >= 5) {
        // if (this.$refs.searchStock.focused) {
        //   this.code = "";
        //   return;
        // }

        await this.updateSelected(this.code.replace(/\s/g, "").toUpperCase());
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

    async updateSelected(itemnumber) {
      let s = this.selected.find(p => p.ITEMNO === itemnumber);
      let p = this.tableData.find(p => p.ITEMNO === itemnumber);

      if (s && !s.UNIQUE) {
        s.QTY++;
        if (p) {
          p.QTY--;
          if (!p.QTY) {
            const index = findIndex(this.tableData, { ITEMNO: itemnumber });
            this.tableData.splice(index, 1);
          }
        }
        this.$store.commit("saveStockCount", this.selected);
        return;
      } else if (s) {
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Het unieke artikel met nummer (${itemnumber}) staat al in de tellijst`
        });
        return;
      }

      if (p) {
        s = clone(p);
        s.QTY = 1;
        p.QTY--;
        this.selected.push(s);
        this.$store.commit("saveStockCount", this.selected);
        const index = findIndex(this.tableData, { ITEMNO: itemnumber });

        if (p.UNIQUE || !p.QTY) {
          this.tableData.splice(index, 1);
        }

        return;
      }

      p = await this.getProduct(itemnumber);
      if (!p) {
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Artikel met nummer (${itemnumber}) niet gevonden`
        });
        return;
      }

      p.QTY = p.STKLEVEL;
      this.selected.push(p);
      this.$store.commit("saveStockCount", this.selected);
    },

    incrementQty: function(index) {
      this.selected[index].QTY++;
    },

    decrementQty: function(index) {
      if (this.selected[index].QTY === 1) return;
      this.selected[index].QTY--;
    },

    saveQTY(index, value, initialValue) {
      let p = this.tableData.find(
        p => p.ITEMNO === this.selected[index].ITEMNO
      );

      if (p) {
        p.QTY = p.STKLEVEL - value;
        if (!p.QTY) {
          const pIndex = findIndex(this.tableData, { ITEMNO: p.ITEMNO });
          this.tableData.splice(pIndex, 1);
        }
      } else {
        // put back product on uncounted list
        p = clone(this.selected[index]);
        p.QTY = p.STKLEVEL - value;
        this.tableData.push(p);

        this.onRequest({
          pagination: this.pagination,
          filter: undefined
        });
      }

      this.$store.commit("saveStockCount", this.selected);
    },

    filterSubgroups(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.subgroupOptions = this.subgroups.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    async print() {
      let data;

      if (!this.exportWithFilter && this.listType === "uncounted") {
        data = await this.getAll();
      } else {
        data = this.listType === "counted" ? this.selected : this.tableData;
      }

      const properties = [
        { field: "ITEMNO", displayName: "Artikelnummer" },
        { field: "PGROUP", displayName: "Productgroep" },
        { field: "GRPCODE", displayName: "Subgroep" },
        { field: "DESC1", displayName: "Omschrijving" },
        { field: "STKLEVEL", displayName: "Voorraad" }
      ];

      if (this.listType === "counted") {
        properties.push({ field: "QTY", displayName: "Telling" });
      }

      printJS({
        printable: data,
        type: "json",
        properties,
        documentTitle:
          this.listType === "counted"
            ? "Tellijst artikelen"
            : "Ongetelde artikelen"
      });

      eventHub.$emit("after-response");
      this.$store.commit("updateLoaderState", false);
    },

    clear() {
      this.$store.commit("saveStockCount", []);
      this.selected = [];

      this.onRequest({
        pagination: this.pagination,
        filter: undefined
      });
    },

    async email() {
      let list;

      if (!this.exportWithFilter && this.listType === "uncounted") {
        list = await this.getAll();
      } else {
        list = this.listType === "counted" ? this.selected : this.tableData;
      }

      const subject =
        this.listType === "counted"
          ? "Tellijst artikelen"
          : "Ongetelde artikelen";

      const intro =
        this.listType === "counted"
          ? "Hierbij ontvangt u een tellijst van artikelen"
          : "Hierbij ontvangt u een lijst met ongetelde artikelen:";

      this.chooseEmail = false;
      eventHub.$emit("before-request");

      return emailStockCount(list, this.emailaddress, subject, intro)
        .then(() => {
          this.$q.notify({
            color: "green-4",
            icon: "fas fa-exclamation-triangle",
            message: `De lijst met ${list.length} producten is verzonden.`
          });
        })
        .catch(e => {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Email sturen mislukt.`
          });
        })
        .finally(() => {
          eventHub.$emit("after-response");
          this.$store.commit("updateLoaderState", false);
        });
    }
  },

  destroyed() {
    ioHook.stop();
    ioHook.removeListener("keyup", this.getInput);
  }
};
</script>