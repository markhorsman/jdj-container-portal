<template>
  <div class="q-px-lg q-pb-md">
    <br />
    <q-card style="min-height: 200px;">
      <q-card-section>
        <p v-if="!readerName">Sluit een RFID reader aan via een van de USB poorten</p>
        <q-space />
      </q-card-section>

      <q-card-section v-if="readerName">
        <q-form horizontal @submit="saveCustomer" @reset="onReset" class="q-gutter-md">
          <div class="text-h6">Klant contact toevoegen</div>

          <div class="row q-col-gutter-sm">
            <div class="col-sm-12 col-md6 col-4">
              <q-select
                outlined
                v-model="customer"
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                :options="customerOptions"
                @filter="filterCustomers"
                @input="(v) => customer = v"
                label="Klant"
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
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-sm-12 col-md-6 col-4">
              <q-input
                square
                outlined
                v-model="nameFirst"
                label="Voornaam"
                :rules="[val => !!val || 'Voornaam is verplicht']"
              >
                <template v-slot:prepend>
                  <q-icon name="fas fa-id-badge" />
                </template>
                <template v-slot:append>
                  <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
                </template>
              </q-input>
            </div>

            <div class="col-sm-12 col-md-6 col-4">
              <q-input
                square
                outlined
                v-model="nameFamily"
                label="Achternaam"
                :rules="[val => !!val || 'Achternaam is verplicht']"
              >
                <template v-slot:prepend>
                  <q-icon name="fas fa-id-badge" />
                </template>
                <template v-slot:append>
                  <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
                </template>
              </q-input>
            </div>

            <div class="col-xs-12 col-md-6 col-8">
              <q-input
                square
                outlined
                v-model="company"
                label="Bedrijf / Uitzendbureau"
                :rules="[val => !!val || 'Bedrijf is verplicht']"
              >
                <template v-slot:prepend>
                  <q-icon name="fas fa-building" />
                </template>
                <template v-slot:append>
                  <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-md-6 col-8">
              <q-input
                square
                outlined
                v-model="phone"
                type="tel"
                label="Telefoonnummer"
                error-message="Ongeldig telefoonnummer"
                :error="!isValidPhone"
              >
                <template v-slot:prepend>
                  <q-icon name="contact_phone" />
                </template>
              </q-input>
            </div>
            <div class="col-xs-12 col-md-6 col-8">
              <q-input
                square
                outlined
                v-model="email"
                type="email"
                label="E-mailadres"
                error-message="Ongeldig e-mailadres"
                :error="!isValidEmail"
              >
                <template v-slot:prepend>
                  <q-icon name="contact_mail" />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-md-6 col-8">
              <q-input
                square
                outlined
                v-model="uid"
                disabled
                label="RFID badge"
                :hint="showRFIDHint"
                :rules="[val => !!val || 'RFID badge is verplicht']"
              >
                <template v-slot:prepend>
                  <q-icon name="nfc" />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-xs-12 col-sm-6 col-4">
              <q-btn label="Opslaan" type="submit" color="primary" />
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
            <div class="col-xs-12">
              <q-icon name="fas fa-asterisk" style="font-size: 0.5em;" />Verplichte velden
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { NFC } from "nfc-pcsc";

export default {
  name: "CustomerContact",

  data() {
    return {
      nfc: null,
      readers: null,
      readerName: null,
      uid: null,
      nameFirst: "",
      nameFamily: "",
      company: "",
      phone: "",
      email: "",
      customers: [],
      customerOptions: [],
      customer: null
    };
  },

  mounted() {
    this.getCustomers();

    this.nfc = new NFC();
    this.readers = new Set();

    this.nfc.on("reader", reader => {
      this.readers.add(reader);
      this.readerName = reader.name;

      reader.on("card", card => {
        this.uid = card.uid
          .match(/.{1,2}/g)
          .reverse()
          .join("");
      });

      reader.on("card.off", card => {});

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
      return !this.email || re.test(this.email);
    },

    isValidPhone() {
      var re = /^((\+|00(\s|\s?\-\s?)?)31(\s|\s?\-\s?)?(\(0\)[\-\s]?)?|0)[1-9]((\s|\s?\-\s?)?[0-9])((\s|\s?-\s?)?[0-9])((\s|\s?-\s?)?[0-9])\s?[0-9]\s?[0-9]\s?[0-9]\s?[0-9]\s?[0-9]$/;
      return !this.phone || re.test(this.phone);
    },

    showRFIDHint() {
      return this.readerName && !this.uid
        ? "Plaats een kaart op de scanner"
        : "";
    }
  },

  methods: {
    onReset() {
      this.nameFirst = "";
      this.nameFamily = "";
      this.company = "";
      this.phone = "";
      this.email = "";

      this.$refs.input.resetValidation();
    },

    saveCustomer() {
      this.$api
        .post(
          `${this.$config.container_api_base_url}customercontact`,
          {
            ACCT: this.customer.value,
            CODE: Math.floor(1000 + Math.random() * 9000),
            NAME: `${this.nameFirst} ${this.nameFamily}`,
            ADDRESS1: this.company,
            TELEPHONE: this.phone,
            REFERENCE: this.uid,
            EMAIL: this.email
          },
          {
            auth: this.$config.container_api_basic_auth
          }
        )
        .then(res => {
          console.log(res);
          this.$notify({
            group: "api",
            title: "Klant contact",
            text: `Contact toegevoegd aan ${this.customer.label}`,
            type: "success",
            duration: 10000
          });

          this.onReset();
        })
        .catch(err => {
          console.log(err);
          this.$notify({
            group: "api",
            title: "Oeps!",
            text:
              "Er is iets misgegaan tijdens het aanmaken van een nieuw contact",
            type: "danger",
            duration: 10000
          });
        });
    },

    getCustomers() {
      this.$api
        .get(
          `${this.$config.api_base_url}customers?api_key=${this.$store.state.api_key}&$fields=&$orderby=NAME asc&$fields=RECID,ACCT,NAME`
        )
        .then(res => {
          this.customerOptions = res.data.reduce((acc, c) => {
            acc.push({ label: c.NAME, value: c.ACCT });
            return acc;
          }, []);

          this.customers = this.customerOptions;

          if (this.$config.default_customer_acct) {
            const match = this.customerOptions.find(
              c => c.value === this.$config.default_customer_acct
            );
            if (match) this.customer = match;
          }
        })
        .catch(e => {});
    },

    filterCustomers(val, update, abort) {
      update(() => {
        const needle = val.toLowerCase();
        this.customerOptions = this.customers.filter(
          v => v.label.toLowerCase().indexOf(needle) > -1
        );
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
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
