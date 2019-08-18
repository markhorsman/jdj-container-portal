<template>
  <div class="q-px-lg q-pb-md">
    <q-dialog v-model="genList" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-scroll" color="primary" text-color="white" />
          <span class="q-ml-sm">Wil je de artikelen mailen of printen?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Mailen" color="primary" icon="email" @click="chooseEmail = true" />
          <q-btn flat label="Printen" color="primary" icon="print" @click="print" />
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

    <q-table
      title="Artikelen"
      :data="tableData"
      :columns="columns"
      row-key="RECID"
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
          label="Printen/mailen"
          @click="genList = true;"
        />
      </template>
      <template v-slot:top-right>
        <q-input borderless dense debounce="500" v-model="filter" placeholder="Zoeken">
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
import { eventHub } from "../eventhub";
import { emailContractItems } from "../mailer";
import printJS from "print-js";
const ioHook = require("iohook");

export default {
  name: "Items",

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
        },
        {
          name: "QTY",
          required: true,
          label: "Aantal",
          align: "left",
          field: row => row.QTY,
          format: val => `${val}`,
          sortable: true
        }
      ],
      tableData: [],
      filter: "",
      loading: false,
      uid: null,
      readers: [],
      genList: false,
      chooseEmail: false,
      emailaddress: this.$config.email.default_email
    };
  },

  mounted() {
    ioHook.on("keyup", this.getInput);
    ioHook.start();

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

  computed: {
    isValidEmail() {
      var re = /\S+@\S+\.\S+/;
      return re.test(this.emailaddress);
    }
  },

  methods: {
    notifyNotFound: function() {
      this.$q.notify({
        color: "red-5",
        icon: "fas fa-exclamation-triangle",
        message: `Klant met identifier ${this.uid} niet gevonden.`
      });
    },

    getInput: function(e) {
      if (e.keycode === 28 && this.code.length >= 5) {
        this.filter = this.code.replace(/\s/g, "");
        this.code = "";

        this.onRequest({
          pagination: this.pagination,
          filter: this.filter
        });
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

      const buildFilter = () =>
        `STATUS eq 1${
          filter
            ? ` and (startswith(ITEMNO, '${filter}') or indexof(ITEMDESC, '${filter}') gt -1 or indexof(ITEMDESC2, '${filter}') gt -1 or indexof(ITEMDESC3, '${filter}') gt -1 or indexof(MEMO, '${filter}') gt -1)`
            : ``
        }`;

      this.$api
        .get(
          `${this.$config.api_base_url}contracts/${
            this.$config.default_contract_number
          }/items?api_key=${
            this.$store.state.api_key
          }&$top=${rowsPerPage}&$skip=${startRow}&$inlinecount=allpages${
            sortBy ? `&$orderby=${sortBy} ${descending ? `desc` : `asc`}` : ``
          }&$filter=${buildFilter()}&fields=RECID,CONTNO,ITEMNO,ITEMDESC,ITEMDESC2,ITEMDESC3,MEMO,QTY`
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

    print() {
      const properties = [
        { field: "CONTNO", displayName: "Contractnummer" },
        { field: "ITEMNO", displayName: "Artikelnummer" },
        { field: "ITEMDESC", displayName: "Omschrijving 1" },
        { field: "MEMO", displayName: "Memo" },
        { field: "QTY", displayName: "Aantal" }
      ];

      printJS({
        printable: this.tableData,
        type: "json",
        properties,
        documentTitle: "Artikelen op contract"
      });
    },

    email() {
      const list = this.tableData;
      this.chooseEmail = false;
      eventHub.$emit("before-request");

      return emailContractItems(
        list,
        this.emailaddress,
        "Artikelen op contract"
      )
        .then(info => {
          this.$q.notify({
            color: "green-4",
            icon: "fas fa-exclamation-triangle",
            message: `De lijst met ${list.length} artikelen is verzonden.`
          });
        })
        .catch(e => {
          this.$q.notify({
            color: "red-5",
            icon: "fas fa-exclamation-triangle",
            message: `Email versturen mislukt.`
          });
        })
        .finally(() => {
          eventHub.$emit("after-response");
        });
    }
  },

  destroyed() {
    // stops listening for new readers
    this.nfc.close();

    this.readers.forEach(reader => {
      // stops listening for reader status changes, reader emits 'end' event
      reader.close();
    });

    ioHook.stop();
    ioHook.removeListener("keyup", this.getInput);
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
