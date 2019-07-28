<template>
  <div class="row reader">
    <div class="col">
      <p v-if="!uid && readerName">Plaats de kaart van de klant op de RFID reader.</p>
      <q-space />
      <p v-if="!readerName">Sluit een RFID reader aan via een van de USB poorten</p>
      <q-space />
      <p v-if="uid">UID: {{ uid }}</p>

      <h3 v-if="customer">{{ customer.NAME }}</h3>
    </div>
  </div>
</template>

<script>
import { NFC } from "nfc-pcsc";

export default {
  data() {
    return {
      nfc: null,
      readers: null,
      devices: null,
      readerName: null,
      uid: null,
      customer: this.$store.customer || null
    };
  },

  created() {},

  mounted() {
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
        this.getCustomer();
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
      this.$api
        .get(
          `${this.$config.container_api_base_url}customercontact/${this.uid}`,
          { auth: this.$config.container_api_basic_auth }
        )
        .then(res => {
          if (res && res.data && res.data.data && res.data.data.length) {
            this.$store.commit("updateCustomer", res.data.data[0]);
            this.customer = res.data.data[0];
          } else {
            this.notifyNotFound();
          }
        })
        .catch(() => {
          this.notifyNotFound();
        })
    }
  },

  updated() {},

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
