<template>
  <div class="qr">
    <q-btn color="primary" size="size_xl" label="Terug naar begin" @click="$router.replace('/')"></q-btn>
    <br />
    <br />
    <p v-if="!products.length">Scan een QR code of barcode</p>
    <br />
    <br />
    <q-spinner-hourglass v-if="loading" color="purple" size="4em" />
    <q-list bordered separator>
      <q-item v-for="(p, index) in products" clickable v-ripple>
        <q-item-section>
          <q-item-label>{{ p.ITEMNO }}</q-item-label>
          <q-item-label caption lines="2">{{ p.DESC1 }}</q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-item-label caption>
            <q-input
			  v-bind:readonly="p.UNIQUE"
              v-model="p.QTY"
              type="number"
              filled
              style="max-width: 50px"
            />
          </q-item-label>
        </q-item-section>

		<q-item-section side top>
          <q-item-label caption @click="$delete(products, index)">
            <q-btn class="gt-xs" size="15px" flat dense round icon="delete" />
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
      products: [],
      itemnumber: null,
      loading: false
    };
  },

  created() {},

  mounted() {
    this.initKeyboardListener();
  },

  methods: {
    initKeyboardListener: function() {
      let code = "";
      let reading = false;

      document.addEventListener("keypress", e => {
        if (e.keyCode === 13 && code.length >= 5) {
          this.itemnumber = code;
          this.getProduct();
          code = "";
        } else {
          code += e.key;
        }

        //run a timeout of 200ms at the first read and clear everything

        if (!reading) {
          reading = true;
          setTimeout(() => {
            code = "";
            reading = false;
          }, 200);
        }
      });
    },
    getProduct: function() {
      this.loading = true;
      this.$api
        .get(
          `${this.$config.api_base_url}/stock?api_key=${this.$store.state.api_key}&$filter=ITEMNO eq '${this.itemnumber}'&fields=RECID,ITEMNO,DESC1,DESC2,DESC3,UNIQUE`
        )
        .then(res => {
          if (res && res.data && res.data.length) {
            const p = this.products.find(p => p.ITEMNO === res.data[0].ITEMNO);

            if (p && !p.UNIQUE) {
              p.QTY = parseInt(p.QTY) + 1;
            } else if (p && p.UNIQUE) {
              // notify?
            } else {
              this.products.push(Object.assign(res.data[0], { QTY: 1 }));
            }
          }
        })
        .catch(e => console.log)
        .finally(() => (this.loading = false));
    }
  },

  updated() {
    // console.log('updated', this);
  },

  destroyed() {}
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
