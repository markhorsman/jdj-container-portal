<template>
  <div class="q-px-lg q-pb-md">
    <q-dialog v-model="genList" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="fas fa-scroll" color="primary" text-color="white" />
          <span class="q-ml-sm">Wil je de artikelen mailen of printen?</span>
        </q-card-section>

        <q-card-section>
          <q-toggle
            :label="exportWithFilter ? 'Alleen gefilterde artikelen' : `Alle artikelen`"
            v-model="exportWithFilter"
          />
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

    <div class="row q-col-gutter-sm">
      <div class="col-xs-12 col-md6 col-4">
        <br />
        <q-select
          v-if="contractIsDynamic"
          ref="contract"
          outlined
          v-model="contract"
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          :options="contractOptions"
          @filter="filterContracts"
          @input="updateContract"
          label="Contract"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">Geen resultaten</q-item-section>
            </q-item>
          </template>
          <template v-slot:append>
            <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
          </template>
        </q-select>
        <br />
      </div>
    </div>

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
        <q-input
          borderless
          dense
          debounce="500"
          v-model="filter"
          placeholder="Zoeken"
          ref="searchContitems"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append v-if="filter.length">
            <q-icon name="close" @click="filter = ''" class="cursor-pointer" />
          </template>
        </q-input>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="CONTNO" :props="props">{{ props.row.CONTNO }}</q-td>
          <q-td key="ITEMNO" :props="props">{{ props.row.ITEMNO }}</q-td>
          <q-td key="ITEMDESC" :props="props">{{ props.row.ITEMDESC }}</q-td>
          <q-td key="ITEMDESC2" :props="props">{{ props.row.ITEMDESC2 }}</q-td>
          <q-td key="ITEMDESC3" :props="props">{{ props.row.ITEMDESC3 }}</q-td>
          <q-td key="MEMO" :props="props">
            <!-- <q-icon name="fas fa-edit" /> -->
            {{ props.row.MEMO }}
            <q-popup-edit
              v-model="props.row.MEMO"
              buttons
              @show="() => editMemo = props.row.__index"
              @hide="() => editMemo = false"
              @save="(value, initialValue) => updateMemo(props.row.__index, value, initialValue)"
            >
              <q-input v-model="props.row.MEMO" autofocus readonly />
            </q-popup-edit>
          </q-td>
          <q-td key="QTY" :props="props">{{ props.row.QTY }}</q-td>
          <q-td key="QTYRETD" :props="props">{{ props.row.QTYRETD }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import { NFC } from "nfc-pcsc";
import { eventHub } from "../eventhub";
import { emailContractItems } from "../mailer";
import { getAllContracts } from "../contracts";
import printJS from "print-js";
const ioHook = require("iohook");
import log from "electron-log";

export default {
  name: "Items",

  data() {
    return {
      pagination: {
        rowsNumber: 0,
        sortBy: "ITEMNO",
        descending: false,
        page: 1,
        rowsPerPage: 25
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
      ],
      contracts: [],
      contractOptions: [],
      contract: null,
      code: "",
      tableData: [],
      filter: "",
      loading: false,
      uid: null,
      readers: [],
      genList: false,
      chooseEmail: false,
      emailaddress: this.$config.email.default_email,
      editMemo: false,
      exportWithFilter: true,
      exportMax: 2000
    };
  },

  async mounted() {
    if (
      this.$store.state.settings &&
      this.$store.state.settings.contract.static
    ) {
      this.contract = this.$store.state.settings.contract.number;
    } else {
      this.contract = null;

      const items = await getAllContracts();

      this.contractOptions = items.reduce((acc, c) => {
        acc.push({ label: `${c.CONTNO} - ${c.ACCT}`, value: c.CONTNO });
        return acc;
      }, []);

      this.contracts = this.contractOptions;
    }

    await this.onRequest({
      pagination: this.pagination,
      filter: undefined
    });

    ioHook.on("keyup", this.getInput);
    ioHook.start();

    this.nfc = new NFC();
    this.readers = new Set();

    this.nfc.on("reader", async reader => {
      this.readers.add(reader);

      reader.on("card", async card => {
        this.uid = card.uid
          .match(/.{1,2}/g)
          .reverse()
          .join("");

        const customer = await this.getCustomer();

        if (!customer) return;

        if (this.editMemo) {
          this.tableData[this.editMemo].MEMO = `${customer.NAME} ${this.uid}`;
        } else {
          this.filter = customer.NAME;
        }
      });

      reader.on("card.off", card => {
        this.uid = null;
      });

      reader.on("error", err => {
        console.error(`reader error`, err);
      });

      reader.on("end", () => {
        this.readerName = null;
      });
    });

    this.nfc.on("error", err => {});
  },

  computed: {
    isValidEmail() {
      var re = /\S+@\S+\.\S+/;
      return re.test(this.emailaddress);
    },

    contractIsDynamic() {
      return !this.$store.state.settings.contract.static;
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
        if (this.$refs.searchContitems.focused) {
          this.code = "";
          return;
        }

        this.filter = this.code.replace(/\s/g, "").toUpperCase();
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

    async getCustomer() {
      this.loading = true;
      let customer;

      let res;

      try {
        res = await this.$api.get(
          `${this.$config.container_api_base_url}customercontact/${this.uid}`,
          { auth: this.$config.container_api_basic_auth }
        );

        if (res && res.data && res.data.data && res.data.data.length) {
          customer = res.data.data[0];
        } else {
          this.notifyNotFound();
        }
      } catch (e) {
        this.notifyNotFound();
        log.error(e);
      }

      this.loading = false;
      return customer;
    },

    async onRequest(props) {
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

      let res;

      if (!this.contract) {
        this.loading = false;
        return;
      }

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}contracts/${
            this.contract
          }/items?api_key=${
            this.$store.state.api_key
          }&$top=${rowsPerPage}&$skip=${startRow}&$inlinecount=allpages${
            sortBy ? `&$orderby=${sortBy} ${descending ? `desc` : `asc`}` : ``
          }&$filter=${buildFilter()}&fields=RECID,RECORDER,CONTNO,ITEMNO,ITEMDESC,ITEMDESC2,ITEMDESC3,MEMO,QTY,QTYRETD`
        );

        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.rowsNumber = res.data.totalCount;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;

        this.tableData = res.data.results;
      } catch (e) {
        log.error(e);
      }

      this.loading = false;
    },

    async getAll() {
      let res;

      try {
        res = await this.$api.get(
          `${this.$config.api_base_url}contracts/${this.$config.default_contract_number}/items?api_key=${this.$store.state.api_key}&$top=${this.exportMax}&$orderby=ITEMNO asc&$filter=STATUS eq 1&fields=RECID,RECORDER,CONTNO,ITEMNO,ITEMDESC,ITEMDESC2,ITEMDESC3,MEMO,QTY,QTYRETD`
        );
      } catch (e) {
        log.error(e);
      }

      return res && res.data ? res.data : [];
    },

    async print() {
      let data;

      if (!this.exportWithFilter) {
        data = await this.getAll();
      } else {
        data = this.tableData;
      }

      const properties = [
        { field: "CONTNO", displayName: "Contractnummer" },
        { field: "ITEMNO", displayName: "Artikelnummer" },
        { field: "ITEMDESC", displayName: "Omschrijving 1" },
        { field: "MEMO", displayName: "Memo" },
        { field: "QTY", displayName: "Vehuurd" },
        { field: "QTYRETD", displayName: "Teruggebracht" }
      ];

      printJS({
        printable: data,
        type: "json",
        properties,
        documentTitle: "Artikelen op contract"
      });
    },

    async email() {
      let list;

      if (!this.exportWithFilter) {
        list = await this.getAll();
      } else {
        list = this.tableData;
      }

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
    },

    async updateMemo(index, value, initialValue) {
      const item = this.tableData[index];
      let result;

      try {
        result = await this.$api.put(
          `${this.$config.container_api_base_url}contitem/${item.RECORDER}`,
          {
            MEMO: value
          },
          { auth: this.$config.container_api_basic_auth }
        );

        this.$q.notify({
          color: "green-4",
          icon: "fas fa-exclamation-triangle",
          message: `Het memo veld van contract artikel ${item.ITEMNO} is aangepast.`
        });
      } catch (e) {
        log.error(e);
        this.$q.notify({
          color: "red-5",
          icon: "fas fa-exclamation-triangle",
          message: `Het updaten van het contract artikel ${item.ITEMNO} met memo ${value} is mislukt.`
        });
      }
    },

    filterContracts(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.contractOptions = this.contracts.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
      });
    },

    updateContract(v) {
      this.contract = v.value;
      this.onRequest({
        pagination: this.pagination,
        filter: this.filter
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
