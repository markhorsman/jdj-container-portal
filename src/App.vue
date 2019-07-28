<template>
  <q-layout view="lHh Lpr lFf">
    <notifications group="api" position="top center" />
    <q-header elevated style="background-color: #ffc20e">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
          color="black"
        />

        <q-toolbar-title class="pull-right">
          <img
            alt="Vue logo"
            width="200"
            src="https://jdejonge.nl/wp-content/uploads/2019/03/JdeJonge_Pay-off_RGB_Zwart_72.png"
          />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" content-class="bg-grey-2">
      <q-list>
        <!-- <q-btn color="primary" size="size_xl" label="Terug naar begin" @click="$router.replace('/')"></q-btn> -->
        <!-- <q-btn push color="primary" size="size_xl" label="Scan product" icon="search" @click="$router.replace('/read-product')"/> -->
        <q-item clickable tag="a" to="/)">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Start</q-item-label>
            <q-item-label caption>Terug naar home</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/rental">
          <q-item-section avatar>
            <q-icon name="add_shopping_cart" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Verhuren</q-item-label>
            <q-item-label caption>In/uit huur producten</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/items">
          <q-item-section avatar>
            <q-icon name="fas fa-id-badge" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Contract items</q-item-label>
            <q-item-label caption>Artikelen in contract</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable tag="a" to="/stock">
          <q-item-section avatar>
            <q-icon name="fas fa-boxes" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Voorraad</q-item-label>
            <q-item-label caption>Voorraad artikelen inzien</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="showUser" clickable tag="a" @click="logout">
          <q-item-section avatar>
            <q-icon name="exit_to_app" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Uitloggen</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-ajax-bar />
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script>
import { eventHub } from './eventhub'
export default {
  name: "app",
  data() {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    };
  },
  computed: {
    showUser() {
      return !!this.$store.state.user;
    }
  },
  methods: {
    logout() {
      this.$store.commit("logout");
    },
    showSpinner() {
      this.$q.loading.show();
    },
    hideSpinner() {
      this.$q.loading.hide();
    }
  },
  created() {
    eventHub.$on("before-request", this.showSpinner);
    eventHub.$on("request-error", this.hideSpinner);
    eventHub.$on("after-response", this.hideSpinner);
    eventHub.$on("response-error", this.hideSpinner);
  },
  beforeDestroy() {
    eventHub.$off("before-request", this.showSpinner);
    eventHub.$off("request-error", this.hideSpinner);
    eventHub.$off("after-response", this.hideSpinner);
    eventHub.$off("response-error", this.hideSpinner);
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
