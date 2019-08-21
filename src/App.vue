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

    <q-dialog v-model="unavailable" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="signal_wifi_off" color="primary" text-color="white" />
          <span class="q-ml-sm">Deze module is momenteel niet beschikbaar.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Naar Home" color="primary" @click="redirect('/')" v-close-popup />
          <q-btn
            v-if="!userInAPIGroup"
            flat
            label="Naar Verhuren"
            color="primary"
            @click="redirect('/rental')"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-layout
      view="hHh Lpr lff"
      container
      v-bind:style="{ height: maxHeight + 'px' }"
      class="shadow-2 rounded-borders"
    >
      <q-header elevated>
        <q-bar class="q-electron-drag">
          <q-badge v-if="showUser">{{ this.$store.state.user.USERNAME }}</q-badge>
          <q-badge v-if="showUser">{{ this.$store.state.user.DEPOT }}</q-badge>
          <q-badge>Versie: {{ version }}</q-badge>
          <q-space />
          <q-icon name="build" />
          <div>Container Tools</div>
          <q-space />
          <q-btn
            dense
            flat
            :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
            @click="$q.fullscreen.toggle()"
            v-shortkey="['ctrl', 'alt', 'enter']"
            @shortkey="toggleFullScreen()"
            style="margin: 3px 20px 0 0;"
            size="0.9em"
          />
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
          />

          <q-toolbar-title class="pull-right">
            <img
              alt="J de Jonge"
              width="200"
              src="../public/logo.png"
            />
          </q-toolbar-title>
          <div>
            <span>{{ networkStatus }}</span>
            <q-spinner-radio v-if="isOffline" color="red" size="2em" style="margin: 0 10px;" />
            <q-spinner-radio v-if="isOnline" color="green" size="2em" style="margin: 0 10px;" />
          </div>
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
            <q-item clickable tag="a" to="/rental" v-if="!userInAPIGroup">
              <q-item-section avatar>
                <q-icon name="add_shopping_cart" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Verhuren</q-item-label>
                <q-item-label caption>In/uit huur producten</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/items" v-if="isOnline">
              <q-item-section avatar>
                <q-icon name="fas fa-scroll" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Contract items</q-item-label>
                <q-item-label caption>Artikelen in contract</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/stock" v-if="isOnline">
              <q-item-section avatar>
                <q-icon name="fas fa-boxes" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Voorraad</q-item-label>
                <q-item-label caption>Voorraad artikelen inzien</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/stocktransfer" v-if="!userInAPIGroup && isOnline">
              <q-item-section avatar>
                <q-icon name="fas fa-exchange-alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Artikelen verplaatsen</q-item-label>
                <q-item-label caption>Depot transfer</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/stockcount" v-if="!userInAPIGroup && isOnline">
              <q-item-section avatar>
                <q-icon name="fas fa-calculator" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Tellijst</q-item-label>
                <q-item-label caption>Tellijsten genereren</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable tag="a" to="/customercontact" v-if="isOnline">
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
        <q-ajax-bar color="primary" size="3" />
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>
<script>
import { eventHub } from "./eventhub";
import { AppFullscreen } from 'quasar'
const { remote } = require("electron");
const win = remote.getCurrentWindow();

import { version } from "../package.json";

export default {
  name: "app",
  data() {
    return {
      drawer: this.$q.platform.is.desktop,
      miniState: false,
      confirmLogout: false,
      confirmClose: false,
      maxHeight: win.getContentSize()[1],
      version,
      offlineComponents: ["Home", "Rental", "ContractItems", "Login"],
      unavailable: false
    };
  },

  watch: {
    $route(to, from) {
      this.updateComponentUnavailable(to.name);
    }
  },

  mounted() {
    this.updateComponentUnavailable(this.$router.currentRoute.name);

    this.$on("offline", () => {
      if (this.offlineComponents.includes(this.$router.currentRoute.name)) {
        this.unavailable = false;
      } else {
        this.unavailable = true;
      }
    });

    this.$on("online", () => {
      this.unavailable = false;
    });
  },

  computed: {
    componentUnavailable() {
      if (
        this.isOnline ||
        this.offlineComponents.includes(this.$router.currentRoute.name)
      ) {
        this.unavailable = false;
      } else {
        this.unavailable = true;
      }

      return this.unavailable;
    },

    showUser() {
      return !!this.$store.state.user;
    },

    networkStatus() {
      return this.isOnline ? "Online" : "Offline";
    },

    userInAPIGroup() {
      return (
        this.$store.state.user &&
        this.$store.state.user.GRPCODE &&
        this.$store.state.user.GRPCODE === "API"
      );
    }
  },

  methods: {
    toggleFullScreen() {
      AppFullscreen.toggle();
    },

    updateComponentUnavailable(name) {
      if (this.isOnline || this.offlineComponents.includes(name)) {
        this.unavailable = false;
      } else {
        this.unavailable = true;
      }
    },

    redirect(path) {
      this.$router.push(path);
    },

    handleResize() {
      this.maxHeight = win.getContentSize()[1];
    },

    async logout() {
      let result;

      // try {
      //   result = await this.$api.post(`${this.$config.api_base_url}sessions/logoff/${this.$store.state.api_key}`);
      // } catch (e) {
      //   console.log(e);
      //   result = false;
      // }

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

    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    eventHub.$off("before-request", this.showSpinner);
    eventHub.$off("request-error", this.hideSpinner);
    eventHub.$off("after-response", this.hideSpinner);
    eventHub.$off("response-error", this.hideSpinner);

    window.removeEventListener("resize", this.handleResize);
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
