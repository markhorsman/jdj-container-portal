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

  mounted() {
    this.getItems();

    if (this.$store.state.customer) {
      this.memo = `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`;
    }
  },

  methods: {
    notifyWrongCustomerOffhire: function(itemno) {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Product ${itemno} staat niet in huur bij de huidige klant.`
      });
    },

    getItems: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}contracts/${this.$store.state.contract}/items/?api_key=${this.$store.state.api_key}&$orderby=ROWORDER desc&$filter=STATUS eq 1&fields=RECID,ITEMNO,QTY,QTYRETD,ITEMDESC,MEMO`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            res.data.forEach(p => {
              if (p.MEMO === this.memo) {
                this.items.push(p);
              }
            });
          }
        })
        .catch(() => {});
    },

    checkContItem(stockItem) {
      if (!this.items.find(item => item.ITEMNO === stockItem.ITEMNO)) {
        this.notifyWrongCustomerOffhire(stockItem.ITEMNO);
      } else {
        eventHub.$emit("add-product", stockItem);
      }
    },

    checkQty(data) {
      let item;

      if (data.product.UNIQUE) {
        item = this.items.find(obj => obj.ITEMNO === data.product.ITEMNO);
      } else {
        match = this.items.find(
          obj =>
            obj.ITEMNO === data.product.ITEMNO &&
            obj.MEMO ===
              `${this.$store.state.customer.NAME} ${this.$store.state.customer.REFERENCE}`
        );
      }

      if (!item) return;

      const inrent = parseInt(item.QTY) - parseInt(item.QTYRETD);

      if (
        parseInt(data.product.QTYOK) +
          parseInt(data.product.QTYDAM) +
          parseInt(data.product.QTYLOST) +
          1 >
        inrent
      ) {
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Het ingestelde aantal van het artikel met nummer ${data.product.ITEMNO} is hoger dan het aantal momenteel in huur.`
        });

        return;
      }

      eventHub.$emit("increment-offhire-product", data);
    }
  },

  created() {
    eventHub.$on("offhire-check-contitem", this.checkContItem);
    eventHub.$on("offhire-check-qty", this.checkQty);
  },

  beforeDestroy() {
    eventHub.$off("offhire-check-contitem", this.checkContItem);
    eventHub.$off("offhire-check-qty", this.checkQty);
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
