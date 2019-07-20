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

  created() {
    // console.log('created', this);
  },

  mounted() {
    // console.log('mounted', this);

    this.nfc = new NFC();
    this.readers = new Set();

    this.nfc.on("reader", reader => {
      // console.log(`${reader.name} reader attached, waiting for cards ...`);
      this.readers.add(reader);
      this.readerName = reader.name;

      reader.on("card", card => {
        // console.log(`card ${card.uid}`);
        this.uid = card.uid;
        this.getCustomer();
      });

      reader.on("card.off", card => {
        // console.log(`${reader.reader.name}  card removed`, card);
        this.uid = null;
      });

      reader.on("error", err => {
        console.error(`reader error`, err);
      });

      reader.on("end", () => {
        // console.log(`${reader.name} reader disconnected.`);
        this.readerName = null;
      });
    });

    this.nfc.on("error", err => {
    //   console.error(err);
    });
  },
  methods: {
    getCustomer: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}/customers?api_key=${
            this.$store.state.api_key
          }&$filter=ACCT eq '${9778}'&fields=RECID,NAME,CONTACT,EMAILINVADDRESS`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            this.$store.commit("updateCustomer", res.data[0]);
            this.customer = res.data[0];
          }
        });
    }
  },

  updated() {
    // console.log('updated', this);
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
