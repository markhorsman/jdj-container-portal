<template>
  <div class="q-pa-md">
    <q-table
      v-if="items.length"
      :title="title"
      :data="items"
      :columns="columns"
      :rows-per-page-options="[]"
      :pagination.sync="pagination"
      row-key="RECID"
    />
  </div>
</template>

<script>
import { eventHub } from "../eventhub";

export default {
  name: "ContractItems",
  props: ["title"],

  data() {
    return {
      pagination: {
        rowsPerPage: 10
      },
      items: [],
      memo: null,
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
          name: "ITEMDESC",
          required: true,
          label: "Omschr. 1",
          align: "left",
          field: row => row.ITEMDESC,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "QTY",
          required: true,
          label: "Verhuurd",
          align: "left",
          field: row => row.QTY,
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

  async mounted() {
    if (this.$store.state.customer) {
      this.memo = `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`;
    }

    await this.getItems();
  },

  methods: {
    async getItems() {
      let baseURL = `${this.$config.api_base_url}contractitems`;

      if (
        this.$store.state.settings.contract.static &&
        this.$store.state.contract
      ) {
        baseURL = `${this.$config.api_base_url}contracts/${this.$store.state.contract}/items`;
      }

      let res;

      try {
        res = await this.$api.get(
          `${baseURL}?api_key=${this.$store.state.api_key}&$orderby=ROWORDER desc&$filter=STATUS eq 1 and indexof(MEMO, '${this.memo}') gt -1&fields=RECID,ITEMNO,QTY,QTYRETD,ITEMDESC,MEMO`
        );
        if (res && res.data && res.data.length) {
          this.items = res.data;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
