<template>
  <div class="q-pa-md">
    <q-table
      v-if="items.length"
      title="Momenteel op naam"
      :data="items"
      :columns="columns"
      :rows-per-page-options="[]"
      row-key="RECID"
    />
  </div>
</template>

<script>
export default {
  name: "ContractItems",

  data() {
    return {
      items: [],
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
          label: "Aantal",
          align: "left",
          field: row => row.QTY,
          format: val => `${val}`,
          sortable: true
        },
      ]
    };
  },

  mounted() {
    this.getItems();
  },

  methods: {
    getItems: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}contracts/${this.$config.default_contract_number}/items/?api_key=${this.$store.state.api_key}&$filter=STATUS eq 1&fields=RECID,ITEMNO,QTY,ITEMDESC,MEMO`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            res.data.forEach(p => {
              if (p.MEMO === this.$store.state.customer.NAME) {
                this.items.push(p);
              }
            });
          }
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
