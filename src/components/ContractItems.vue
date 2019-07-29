<template>
  <div>
    <p><strong>Momenteel op naam</strong></p>

    <q-list bordered separator>
      <q-item v-for="(p, index) in this.items" clickable v-bind:key="index">
        <q-item-section>
          <q-item-label>{{ p.ITEMNO }}</q-item-label>
          <q-item-label caption lines="2">{{ p.ITEMDESC }}</q-item-label>
        </q-item-section>

        <q-item-section side bottom>
          <q-item-label caption>{{ p.QTY }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
export default {
  name: "ContractItems",

  data() {
    return {
      items: [],
    };
  },

  mounted() {
    this.getItems();
  },

  methods: {
    getItems: function() {
      this.$api
        .get(
          `${this.$config.api_base_url}/contracts/${this.$config.default_contract_number}/items/?api_key=${this.$store.state.api_key}&$filter=STATUS eq 1`
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
        .catch(() => {})
    }
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
