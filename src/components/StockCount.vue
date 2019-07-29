<template>
  <div class="q-pa-md">
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
      <!-- <template v-slot:top-left>
        <q-btn
          dense
          color="primary"
          :disable="loading || !selected"
          label="Tellijst genereren"
          @click="genList"
        />
      </template> -->

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
      :columns="columns"
      row-key="ITEMNO"
      class="float-right"
      style="width: 49%;"
    >
    </q-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selected: this.$store.state.stockCount,
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
      tableData: [],
      subgroups: [],
      subgroupOptions: [],
      subgroup: null,
      filter: "",
      loading: false,
      code: "",
      reading: false
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
          }&$filter=${buildFilter()}&fields=PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS,STKLEVEL`
        )
        .then(res => {
          this.pagination.page = page;
          this.pagination.rowsPerPage = rowsPerPage;
          this.pagination.rowsNumber = res.data.totalCount;
          this.pagination.sortBy = sortBy;
          this.pagination.descending = descending;

          this.tableData = res.data.results;
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

    getInput: function(e) {
      e.stopImmediatePropagation();
      if (e.keyCode === 13 && this.code.length >= 5) {
        this.filter = this.code;
        this.code = "";

        this.onRequest({
          pagination: this.pagination,
          filter: this.filter
        }).then(() => {
          const isAdded = this.selected.find(p => p.ITEMNO === this.code);
          const p = this.tableData.find(p => p.ITEMNO === this.filter);
          if (p) {
              this.selected.push(p);
              this.$store.commit("saveStockCount", this.selected);
          }
        });
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

    filterSubgroups(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.subgroupOptions = this.subgroups.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    genList() {
      
    }
  },

  destroyed() {
    document.removeEventListener("keypress", this.getInput);
  }
};
</script>