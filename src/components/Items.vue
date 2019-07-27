<template>
  <div>
    <br />
    <br />

    <q-table
      title="Artikelen"
      :data="tableData"
      :columns="columns"
      row-key="itemno"
      :loading="loading"
      :filter="filter"
      :rows-per-page-options="[3, 5, 7, 10, 15, 25, 50, 0]"
      :pagination.sync="pagination"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Zoek op naam">
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
        sortBy: "itemno",
        descending: false,
        page: 1,
        rowsPerPage: 10
      },
      columns: [
        {
          name: "contno",
          required: true,
          label: "Contractnummer",
          align: "left",
          field: row => row.CONTNO,
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
          name: "itemdesc",
          required: true,
          label: "Omschrijving 1",
          align: "left",
          field: row => row.ITEMDESC,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "itemdesc2",
          required: true,
          label: "Omschrijving 2",
          align: "left",
          field: row => row.ITEMDESC2,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "itemdesc3",
          required: true,
          label: "Omschrijving 3",
          align: "left",
          field: row => row.ITEMDESC3,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "memo",
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

    this.getItems();
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

    getItems: function() {
      this.loading = true;
      this.$api
        .get(
          `${this.$config.api_base_url}/contracts/${this.$config.default_contract_number}/items/?api_key=${this.$store.state.api_key}&$filter=STATUS eq 1&fields=CONTNO,ITEMNO,ITEMDESC,ITEMDESC2,ITEMDESC3,MEMO`
        )
        .then(res => {
          this.tableData = res.data;
        })
        .catch(() => {})
        .finally(() => (this.loading = false));
    }

    /*getGroups: function()
      Promise.all([
        this.$api.get(
          `${this.$config.api_base_url}/productgroups?api_key=${this.$store.state.api_key}&fields=CODE,NAME`
        ),
        this.$api.get(
          `${this.$config.api_base_url}/subgroups?api_key=${this.$store.state.api_key}&fields=CODE,NAME`
        )
      ])
        .then(res => {
          this.groups = res[0].data;
          this.subgroups = res[1].data;
        })
        .catch(() => {});
    }*/
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
