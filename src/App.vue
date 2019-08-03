<template>
  <div>
    <q-dialog v-model="confirmLogout" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="exit_to_app" color="primary" text-color="white" />
          <span class="q-ml-sm">Weet je zeker dat je wilt uitloggen?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="primary" v-close-popup />
          <q-btn flat label="Uitloggen" color="danger" @click="logout" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirmClose" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="close" color="primary" text-color="white" />
          <span class="q-ml-sm">Weet je zeker dat je wilt afsluiten?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="primary" v-close-popup />
          <q-btn flat label="Afsluiten" color="danger" @click="closeApp" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-layout
      view="hHh Lpr lff"
      container
      v-bind:style="{ height: maxHeight + 'px' }"
      class="shadow-2 rounded-borders"
    >
      <notifications group="api" align="middle" position="top center" />

      <q-header elevated>
        <q-bar class="q-electron-drag">
          <q-badge v-if="showUser">{{ this.$store.state.user.USERNAME }}</q-badge>
          <q-badge v-if="showUser">{{ this.$store.state.user.DEPOT }}</q-badge>
          <q-badge>Versie: {{ version }}</q-badge>
          <q-space />
          <q-icon name="build" />
          <div>Container Tools</div>
          <q-space />
          <q-btn dense flat icon="minimize" @click="minimize" />
          <q-btn dense flat icon="crop_square" @click="maximize" />
          <q-btn dense flat icon="close" @click="confirmClose = true" />
        </q-bar>

        <q-toolbar>
          <q-btn
            v-if="showUser"
            flat
            dense
            round
            @click="drawer = !drawer"
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

      <q-drawer
        v-if="showUser"
        v-model="drawer"
        :mini="!drawer || miniState"
        :width="200"
        :breakpoint="500"
        show-if-above
        bordered
        content-class="bg-grey-3"
      >
        <q-scroll-area class="fit">
          <q-list padding>
            <q-item clickable tag="a" to="/" exact>
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Home</q-item-label>
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
            <q-item clickable tag="a" to="/stockcount">
              <q-item-section avatar>
                <q-icon name="fas fa-calculator" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Tellijst</q-item-label>
                <q-item-label caption>Tellijsten genereren</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/customercontact">
              <q-item-section avatar>
                <q-icon name="fas fa-id-badge" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Contacten</q-item-label>
                <q-item-label caption>Contact toevoegen</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item v-if="showUser" clickable tag="a" @click="confirmLogout = true">
              <q-item-section avatar>
                <q-icon name="exit_to_app" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Uitloggen</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <div class="q-mini-drawer absolute" style="top: 15px; right: -20px;">
          <q-btn
            v-if="drawer"
            dense
            round
            unelevated
            color="primary"
            :icon="miniState ? 'chevron_right' : 'chevron_left'"
            @click="miniState = !miniState"
          />
        </div>
      </q-drawer>

      <q-page-container>
        <q-ajax-bar />
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>
<script>
import { eventHub } from "./eventhub";
const { remote } = require("electron");
const win = remote.getCurrentWindow();

import { version } from '../package.json';

export default {
  name: "app",
  data() {
    return {
      drawer: this.$q.platform.is.desktop,
      miniState: false,
      confirmLogout: false,
      confirmClose: false,
      maxHeight: win.getContentSize()[1],
      version
    };
  },
  computed: {
    showUser() {
      return !!this.$store.state.user;
    }
  },
  methods: {
    handleResize() {
      this.maxHeight = win.getContentSize()[1];
    },

    logout() {
      this.$store.commit("logout");
    },

    showSpinner() {
      this.$q.loading.show();
    },

    hideSpinner() {
      this.$q.loading.hide();
    },

    minimize() {
      if (process.env.IS_ELECTRON) {
        win.minimize();
      }
    },

    maximize() {
      if (process.env.IS_ELECTRON) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
    },

    closeApp() {
      win.close();
    },

    drawerClick(e) {
      // if in "mini" state and user
      // click on drawer, we switch it to "normal" mode
      if (this.miniState) {
        this.miniState = false;

        // notice we have registered an event with capture flag;
        // we need to stop further propagation as this click is
        // intended for switching drawer to "normal" mode only
        e.stopPropagation();
      }
    }
  },
  created() {
    eventHub.$on("before-request", this.showSpinner);
    eventHub.$on("request-error", this.hideSpinner);
    eventHub.$on("after-response", this.hideSpinner);
    eventHub.$on("response-error", this.hideSpinner);

    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    eventHub.$off("before-request", this.showSpinner);
    eventHub.$off("request-error", this.hideSpinner);
    eventHub.$off("after-response", this.hideSpinner);
    eventHub.$off("response-error", this.hideSpinner);

    window.removeEventListener('resize', this.handleResize);
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
  .text-brand {
    color: #a2aa33;
  }
  .bg-brand {
    background: #a2aa33;
  }
}
</style>
