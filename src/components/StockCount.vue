<template>
  <div class="q-pa-md">
    <q-dialog v-model="genList" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-calculator" color="primary" text-color="white" />
          <span class="q-ml-sm">Wil je de tellijst mailen of printen?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Mailen" color="primary" icon="email" @click="chooseEmail = true" />
          <q-btn flat label="Printen" color="primary" icon="print" @click="print" />
          <q-btn flat label="Lijst leegmaken" color="danger" v-close-popup @click="clear" />
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
      class="float-left"
      style="width: 49%;"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="500"
          v-model="filter"
          placeholder="Zoek op artikelnummer"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
    </q-table>

    <q-table
      title="Geteld"
      :data="selected"
      :columns="selectedColumns"
      :rows-per-page-options="[]"
      :pagination.sync="selectedPagination"
      row-key="ITEMNO"
      class="float-right"
      style="width: 49%;"
    >
      <template v-slot:top-left>
        <q-btn
          dense
          color="primary"
          :disabled="!selected.length"
          label="Tellijst genereren"
          @click="genList = true"
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
          <q-td key="STKLEVEL" :props="props">{{ props.row.STKLEVEL }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import { findIndex } from "lodash";
import { eventHub } from "../eventhub";
import emailStockCount from "../mailer";
import printJS from "print-js";

export default {
  data() {
    return {
      selected: this.$store.state.stockCount,
      selectedPagination: {
        descending: false,
        page: 1,
        rowsPerPage: 10
      },
      pagination: {
        rowsNumber: 0,
        sortBy: "ITEMNO",
        descending: false,
        page: 1,
        rowsPerPage: 10
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
      chooseEmail: false,
      emailaddress: this.$config.email.default_email
    };
  },

  mounted() {
    this.$store.commit("saveStockCount", []);
    document.addEventListener("keypress", this.getInput);

    this.getSubGroups();

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
    onRequest(props) {
      let {
        page,
        rowsPerPage,
        rowsNumber,
        sortBy,
        descending
      } = props.pagination;
      let filter = props.filter;
      this.loading = true;

      // calculate starting row of data
      let startRow = (page - 1) * rowsPerPage;

      const buildFilter = () =>
        `CURRDEPOT eq '${this.$store.state.user.DEPOT}'
         and STATUS eq 0
        ${filter ? ` and startswith(ITEMNO, '${filter}')` : ``}
        ${this.subgroup ? ` and GRPCODE eq '${this.subgroup.value}'` : ``}
        `;

      return this.$api
        .get(
          `${this.$config.api_base_url}stock?api_key=${
            this.$store.state.api_key
          }&$top=${rowsPerPage}&$skip=${startRow}&$inlinecount=allpages${
            sortBy ? `&$orderby=${sortBy} ${descending ? `desc` : `asc`}` : ``
          }&$filter=${buildFilter()}&fields=PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS,STKLEVEL,UNIQUE`
        )
        .then(res => {
          this.pagination.page = page;
          this.pagination.rowsPerPage = rowsPerPage;
          this.pagination.rowsNumber = res.data.totalCount;
          this.pagination.sortBy = sortBy;
          this.pagination.descending = descending;

          this.tableData = res.data.results.reduce((acc, p) => {
            const s = this.selected.find(s => s.ITEMNO === p.ITEMNO);
            if (s) return acc;
            p.QTY = 0;
            acc.push(p);
            return acc;
          }, []);
        })
        .catch(() => {})
        .finally(() => (this.loading = false));
    },

    getSubGroups: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}subgroups?api_key=${this.$store.state.api_key}&$filter=DEPOT eq '${this.$store.state.user.DEPOT}'&fields=CODE,NAME,PGROUP`
        )
        .then(res => {
          this.subgroups = res.data.reduce((acc, grp) => {
            acc.push({ label: grp.NAME, value: grp.CODE });
            return acc;
          }, []);

          this.subgroupOptions = this.subgroups;
        })
        .catch(() => {});
    },

    getProduct: function(itemnumber) {
      return this.$api
        .get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${itemnumber}' and STATUS eq 0&fields=PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS,STKLEVEL,UNIQUE`
        )
        .then(res => (res.data ? res.data[0] : null));
    },

    getInput: function(e) {
      e.stopImmediatePropagation();
      if (e.keyCode === 13 && this.code.length >= 5) {
        this.updateSelected(this.code);
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

    updateSelected(itemnumber) {
      const s = this.selected.find(p => p.ITEMNO === itemnumber);
      if (s && !s.UNIQUE) {
        s.QTY += 1;
        this.$store.commit("saveStockCount", this.selected);
        return;
      } else if (s) {
        this.$notify({
          group: "api",
          title: `Artikel in tellijst`,
          text: `Het unieke artikel met nummer (${itemnumber}) staat al in de tellijst`,
          type: "error",
          duration: 5000
        });
        return;
      }

      let p = this.tableData.find(p => p.ITEMNO === itemnumber);
      if (p) {
        p.QTY = 1;
        this.selected.push(p);
        this.$store.commit("saveStockCount", this.selected);
        const index = findIndex(this.tableData, { ITEMNO: itemnumber });
        this.tableData.splice(index, 1);
        this.pagination.rowsNumber--;
        return;
      }

      this.getProduct(itemnumber).then(p => {
        if (!p) {
          this.$notify({
            group: "api",
            title: `Artikel niet gevonden.`,
            text: `Artikel met nummer (${itemnumber}) niet gevonden`,
            type: "error",
            duration: 5000
          });
          return;
        }

        p.QTY = 1;
        this.selected.push(p);
        this.$store.commit("saveStockCount", this.selected);
      });
    },

    incrementQty: function(index) {
      this.selected[index].QTY++;
      this.$store.commit("saveStockCount", this.selected);
    },

    decrementQty: function(index) {
      if (this.selected[index].QTY === 1) return;
      this.selected[index].QTY--;
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

    print() {
      printJS({
        printable: this.selected,
        type: "json",
        properties: [
          { field: "ITEMNO", displayName: "Artikelnummer" },
          { field: "PGROUP", displayName: "Productgroep" },
          { field: "GRPCODE", displayName: "Subgroep" },
          { field: "DESC1", displayName: "Omschrijving" },
          { field: "STKLEVEL", displayName: "Voorraad" },
          { field: "QTY", displayName: "Telling" }
        ],
        documentTitle: "Tellijst"
      });
    },

    clear() {
      this.$store.commit("saveStockCount", []);
      this.selected = [];
    },

    email() {
      this.chooseEmail = false;
      eventHub.$emit("before-request");
      return emailStockCount(this.$store.state.stockCount, this.emailaddress)
        .then(info => {
          this.$notify({
            group: "api",
            title: `Tellijst verstuurd.`,
            text: `De tellijst met ${this.$store.state.stockCount.length} producten is verzonden.`,
            type: "success",
            duration: 5000
          });
        })
        .catch(e => {
          this.$notify({
            group: "api",
            title: `Email sturen mislukt.`,
            text: e.message,
            type: "error",
            duration: 5000
          });
        })
        .finally(() => {
          eventHub.$emit("after-response");
        });
    }
  },

  destroyed() {
    document.removeEventListener("keypress", this.getInput);
  }
};
</script>