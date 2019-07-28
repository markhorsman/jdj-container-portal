<template>
  <div>
    <br />
    <br />

    <q-table
      title="Voorraad"
      :data="tableData"
      :columns="columns"
      row-key="itemno"
      :loading="loading"
      :filter="filter"
      :rows-per-page-options="[3, 5, 7, 10, 15, 25, 50, 100, 200, 300]"
      :pagination.sync="pagination"
      @request="onRequest"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Zoek op artikel">
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
  data() {
    return {
      pagination: {
        rowsNumber: 0,
        sortBy: "itemno",
        descending: false,
        page: 1,
        rowsPerPage: 10
      },
      columns: [
        //CURRDEPOT,PGROUP,GRPCODE,ITEMNO,DESC#1,DESC#2,DESC#3,STATUS
        {
          name: "currdepot",
          required: true,
          label: "Depot",
          align: "left",
          field: row => row.CURRDEPOT,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "pgroup",
          required: true,
          label: "Hoofdgroep",
          align: "left",
          field: row => row.PGROUP,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "grpcode",
          required: true,
          label: "Subgroep",
          align: "left",
          field: row => row.GRPCODE,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "itemno",
          required: true,
          label: "Artikelnummer",
          align: "left",
          field: row => row.ITEMNO,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "desc1",
          required: true,
          label: "Omschrijving 1",
          align: "left",
          field: row => row.DESC1,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "desc2",
          required: true,
          label: "Omschrijving 2",
          align: "left",
          field: row => row.DESC2,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "desc3",
          required: true,
          label: "Omschrijving 3",
          align: "left",
          field: row => row.DESC3,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "status",
          required: true,
          label: "Status",
          align: "left",
          field: row => row.STATUS,
          format: val => `${val}`,
          sortable: true
        }
      ],
      tableData: [],
      filter: "",
      loading: false,
      uid: null,
      readers: []
    };
  },

  mounted() {
    this.onRequest({
      pagination: this.pagination,
      filter: undefined
    });
  },

  methods: {
    // notifyNotFound: function() {
    //   this.$notify({
    //     group: "api",
    //     title: "Klant niet gevonden",
    //     text: `Klant met identifier ${this.uid} niet gevonden.`,
    //     type: "error"
    //   });
    // },

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

      this.$api
        .get(
          `${this.$config.api_base_url}stock?api_key=${this.$store.state.api_key}&$top=${this.pagination.rowsPerPage}&$skip=${startRow}&$inlinecount=allpages&$filter=CURRDEPOT eq '${this.$store.state.user.DEPOT}'&fields=CURRDEPOT,PGROUP,GRPCODE,ITEMNO,DESC1,DESC2,DESC3,STATUS`
        )
        .then(res => {
          this.pagination.rowsNumber = Math.ceil(
            res.data.totalCount / this.pagination.rowsPerPage
          );
          this.pagination.page = page;
          this.pagination.rowsPerPage = rowsPerPage;
          this.pagination.sortBy = sortBy;
          this.pagination.descending = descending;

          this.tableData = res.data.results;

          console.log(this.pagination);
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
          `${this.$config.api_base_url}subgroups?api_key=${this.$store.state.api_key}&fields=CODE,NAME`
        )
      ])
        .then(res => {
          this.groups = res[0].data;
          this.subgroups = res[1].data;
        })
        .catch(() => {});
    }
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
