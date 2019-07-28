<template>
  <div>
    <q-table
      title="Artikelen"
      :data="tableData"
      :columns="columns"
      row-key="ITEMNO"
      :loading="loading"
      :filter="filter"
      :rows-per-page-options="[3, 5, 7, 10, 15, 25, 50, 0]"
      :pagination.sync="pagination"
      @request="onRequest"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="500" v-model="filter" placeholder="Zoek op naam">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
    </q-table>
  </div>
</template>

<script>
import { NFC } from "nfc-pcsc";

export default {
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
          label: "Omschrijving 1",
          align: "left",
          field: row => row.ITEMDESC,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "ITEMDESC2",
          required: true,
          label: "Omschrijving 2",
          align: "left",
          field: row => row.ITEMDESC2,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "ITEMDESC3",
          required: true,
          label: "Omschrijving 3",
          align: "left",
          field: row => row.ITEMDESC3,
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
    this.nfc = new NFC();
    this.readers = new Set();

    this.nfc.on("reader", reader => {
      this.readers.add(reader);

      reader.on("card", card => {
        this.uid = card.uid
          .match(/.{1,2}/g)
          .reverse()
          .join("");
        this.getCustomer();
      });

      reader.on("card.off", card => {
        this.uid = null;
        this.filter = "";
      });

      reader.on("error", err => {
        console.error(`reader error`, err);
      });

      reader.on("end", () => {
        this.readerName = null;
      });
    });

    this.nfc.on("error", err => {});

    this.onRequest({
      pagination: this.pagination,
      filter: undefined
    });
  },

  methods: {
    notifyNotFound: function() {
      this.$notify({
        group: "api",
        title: "Klant niet gevonden",
        text: `Klant met identifier ${this.uid} niet gevonden.`,
        type: "error"
      });
    },

    getCustomer: function() {
      this.loading = true;
      this.$api
        .get(
          `${this.$config.container_api_base_url}customercontact/${this.uid}`,
          { auth: this.$config.container_api_basic_auth }
        )
        .then(res => {
          if (res && res.data && res.data.data && res.data.data.length) {
            this.filter = res.data.data[0].NAME;
          } else {
            this.notifyNotFound();
          }
        })
        .catch(() => {
          this.notifyNotFound();
        })
        .finally(() => {
          this.loading = false;
        });
    },

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

      const buildFilter = () => `STATUS eq 1${filter ? ` and startswith(ITEMNO, '${filter}') or startswith(ITEMDESC, '${filter}') or startswith(ITEMDESC2, '${filter}') or startswith(ITEMDESC3, '${filter}') or startswith(MEMO, '${filter}')` : ``}`;

      this.$api
        .get(
          `${this.$config.api_base_url}contracts/${
            this.$config.default_contract_number
          }/items?api_key=${
            this.$store.state.api_key
          }&$top=${rowsPerPage}&$skip=${startRow}&$inlinecount=allpages${
            sortBy ? `&$orderby=${sortBy} ${descending ? `desc` : `asc`}` : ``
          }&$filter=${buildFilter()}&fields=CONTNO,ITEMNO,ITEMDESC,ITEMDESC2,ITEMDESC3,MEMO`
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
    }
  },

  destroyed() {
    // stops listening for new readers
    this.nfc.close();

    this.readers.forEach(reader => {
      // stops listening for reader status changes, reader emits 'end' event
      reader.close();
    });
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
