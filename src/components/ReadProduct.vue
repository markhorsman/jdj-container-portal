<template>
  <div class="qr">
    <p
      v-if="!products.length"
    >Voeg producten toe met de barcode scanner door de QR code op het product te scannen.</p>
    <br />
    <br />
    <q-spinner-hourglass v-if="loading" color="purple" size="4em" />
    <q-list bordered separator>
      <q-item v-for="(p, index) in products" v-bind:key="index">
        <q-item-section>
          <q-item-label>
            {{ p.ITEMNO }}
            <q-chip dense>
              <q-avatar color="primary" text-color="white">{{ p.STKLEVEL }}</q-avatar>Stock
            </q-chip>
          </q-item-label>
          <q-item-label caption lines="2">{{ p.DESC1 }}</q-item-label>
        </q-item-section>

        <q-item-section v-if="isRentalTypeReturn" side bottom>
          <q-item-label caption>
            <q-checkbox keep-color v-model="p.DAMAGED" label="Product is beschadigd?" color="red" />
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-item-label caption>
            <q-input
              v-bind:readonly="!!p.UNIQUE"
              v-model="p.QTY"
              type="number"
              outlined
              style="max-width: 50px"
            />
          </q-item-label>
        </q-item-section>

        <q-item-section side bottom>
          <q-item-label caption @click="deleteProduct(index)">
            <q-btn
              class="gt-xs"
              size="15px"
              flat
              dense
              round
              icon="delete"
            />
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
export default {
  data() {
    return {
      products: this.$store.state.rentalProducts || [],
      itemnumber: null,
      loading: false,
      code: "",
      reading: false
    };
  },

  mounted() {
    document.addEventListener("keypress", this.getInput);
  },

  computed: {
    isRentalTypeReturn() {
      return this.$parent.$parent.$parent.rentalType === 'return';
    }
  },

  methods: {
    deleteProduct: function(index) {
      this.products.splice(index, 1);
      this.$store.commit("updateRentalProducts", this.products);
    },
    getInput: function(e) {
      e.stopImmediatePropagation();
      if (e.keyCode === 13 && this.code.length >= 5) {
        this.itemnumber = this.code;
        this.getProduct();
        this.code = "";
      } else {
        this.code += e.key;
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
    notifyNotFound: function() {
      this.$notify({
        group: "api",
        title: "Product niet gevonden",
        text: `Product met nummer ${this.itemnumber} niet gevonden.`,
        type: "error",
        duration: 5000
      });
    },
    getProduct: function() {
      this.loading = true;
      this.$api
        .get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,ITEMNO,DESC1,DESC2,DESC3,UNIQUE,STKLEVEL,STATUS`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            const p = this.products.find(p => p.ITEMNO === res.data[0].ITEMNO);

            if (p && !p.UNIQUE) {
              p.QTY = parseInt(p.QTY) + 1;
            } else if (p && p.UNIQUE) {
              // notify?
            } else {
              this.products.push(
                Object.assign(res.data[0], { QTY: 1, DAMAGED: false })
              );
            }
            this.$store.commit("updateRentalProducts", this.products);
          } else {
            this.notifyNotFound();
          }
        })
        .catch(() => {
          this.notifyNotFound();
        })
        .finally(() => (this.loading = false));
    }
  },

  destroyed() {
    document.removeEventListener("keypress", this.getInput);
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
