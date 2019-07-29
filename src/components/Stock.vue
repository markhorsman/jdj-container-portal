<template>
  <div class="q-px-lg q-pb-md">
    <br />
    <q-select
      outlined
      clearable
      v-model="group"
      use-input
      hide-selected
      fill-input
      input-debounce="0"
      :options="groupOptions"
      @filter="filterGroups"
      @input="onRequest({
      pagination,
      filter
    })"
      @remove="onRequest({
      pagination,
      filter
    })"
      label="Hoofdgroep"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">Geen resultaten</q-item-section>
        </q-item>
      </template>
    </q-select>

    <br />

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
      class="sticky-header-table"
      title="Voorraad"
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
        <q-toggle v-model="statusInRent" label="In huur" @input="statusFilter('rent')" />
        <q-toggle v-model="statusInRepair" label="In Reparatie" @input="statusFilter('repair')" />
      </template>

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
  </div>
</template>

<script>
export default {
  name: "Stock",

  data() {
    return {
      pagination: {
        rowsNumber: 0,
        sortBy: "ITEMNO",
        descending: false,
        page: 1,
        rowsPerPage: 10
      },
      columns: [
        {
          name: "PGROUP",
          required: true,
          label: "Hoofdgroep",
          align: "left",
          field: row => row.PGROUP,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "GRPCODE",
          required: true,
          label: "Subgroep",
          align: "left",
          field: row => row.GRPCODE,
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
          name: "DESC1",
          required: true,
          label: "Omschr. 1",
          align: "left",
          field: row => row.DESC1,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "DESC2",
          required: true,
          label: "Omschr. 2",
          align: "left",
          field: row => row.DESC2,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "DESC3",
          required: true,
          label: "Omschr. 3",
          align: "left",
          field: row => row.DESC3,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "STATUS",
          required: true,
          label: "Status",
          align: "left",
          field: row => row.STATUS,
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
      filter: "",
      loading: false,
      groups: {
        main: [],
        sub: []
      },
      groupOptions: [],
      subgroupOptions: [],
      group: null,
      subgroup: null,
      statusInRent: false,
      statusInRepair: false,
      code: "",
      reading: false
    };
  },

  mounted() {
    document.addEventListener("keypress", this.getInput);

    this.getGroups();

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
        `CURRDEPOT eq '${this.$store.state.user.DEPOT}'${
          filter ? ` and startswith(ITEMNO, '${filter}')` : ``
        }
        ${this.group ? ` and PGROUP eq '${this.group.value}'` : ``}
        ${this.subgroup ? ` and GRPCODE eq '${this.subgroup.value}'` : ``}
        ${this.statusInRent ? ` and STATUS eq 1` : ``}
        ${this.statusInRepair ? ` and STATUS eq 2` : ``}
        `;

      this.$api
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

    getGroups: function() {
      Promise.all([
        this.$api.get(
          `${this.$config.api_base_url}productgroups?api_key=${this.$store.state.api_key}&fields=CODE,NAME`
        ),
        this.$api.get(
          `${this.$config.api_base_url}subgroups?api_key=${this.$store.state.api_key}&$filter=DEPOT eq '${this.$store.state.user.DEPOT}'&fields=CODE,NAME,PGROUP`
        )
      ])
        .then(res => {
          const all = res[0].data;
          this.groups.main = res[1].data.reduce((acc, grp) => {
            if (!acc.find(p => p.value === grp.PGROUP)) {
              const group = all.find(p => p.CODE === grp.PGROUP);
              if (group) acc.push({ label: group.NAME, value: group.CODE });
            }
            return acc;
          }, []);

          this.groups.sub = res[1].data.reduce((acc, grp) => {
            acc.push({ label: grp.NAME, value: grp.CODE, pgroup: grp.PGROUP });
            return acc;
          }, []);

          this.groupOptions = this.groups.main;
          this.subgroupOptions = this.groups.sub;
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

    filterGroups(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.groupOptions = this.groups.main.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    filterSubgroups(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.subgroupOptions = this.groups.sub.filter(
          v =>
            v.label.toLowerCase().indexOf(needle) > -1 &&
            (this.group ? v.pgroup === this.group.value : true)
        );
      });
    },

    statusFilter(type) {
      if (this.statusInRepair && this.statusInRent) {
        if (type === "repair") this.statusInRent = false;
        else this.statusInRepair = false;
      }

      this.onRequest({
        pagination: this.pagination,
        filter: this.filter
      });
    }
  },

  destroyed() {
    document.removeEventListener("keypress", this.getInput);
  }
};
</script>

<style lang="stylus">
.sticky-header-table {
  /* max height is important */
  .q-table__middle {
    max-height: 500px;
  }

  .q-table__top, .q-table__bottom, thead tr:first-child th {
    background-color: #e0e0e0;
  }

  thead tr:first-child th {
    position: sticky;
    top: 0;
    opacity: 1;
    z-index: 1;
  }
}
</style>