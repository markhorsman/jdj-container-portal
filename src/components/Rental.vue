<template>
  <div class="q-pa-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step :name="1" title="Klant ophalen" icon="nfc" :done="step > 1">
        <ReadCustomer/>
      </q-step>

      <q-step
        :name="2"
        title="Producten scannen"
        icon="build"
        :done="step > 2"
      >
      <ReadProduct/>
      </q-step>

      <q-step
        :name="3"
        title="Controleren"
        icon="playlist_add_check"
        :done="step > 3"
      >
      <p>Controleer de lijst met producten.</p>
      <q-list bordered separator>
      <q-item v-for="(p, index) in this.$store.state.rentalProducts" clickable v-bind:key="index">
        <q-item-section>
          <q-item-label>{{ p.ITEMNO }}</q-item-label>
          <q-item-label caption lines="2">{{ p.DESC1 }}</q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-item-label caption>
            {{ p.QTY }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
      </q-step>

      <q-step :name="4" title="Bevestigen" icon="send">
        Bevestig de gekozen producten door op onderstaande knop te drukken.
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="$refs.stepper.next()"
            color="primary"
            :label="step === 4 ? 'Bevestigen' : 'Volgende'"
            :disabled="(step === 1 && !hasCustomer) || (step === 2 && !hasProducts)"
          />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="$refs.stepper.previous()"
            label="Terug"
            class="q-ml-sm"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script>
import ReadCustomer from "./ReadCustomer.vue";
import ReadProduct from "./ReadProduct.vue";

export default {
  name: "Rental",
  components: {
    ReadCustomer,
    ReadProduct
  },
  computed: {
    hasCustomer() {
      return !!this.$store.state.customer;
    },
    hasProducts() {
      return !!this.$store.state.rentalProducts.length;
    }
  },
  data() {
    return {
      step: 1
    };
  }
};
</script>