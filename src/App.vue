<template>
  <div id="app">
    <q-btn v-if="showUser" color="primary" class="pull-right" icon="exit_to_app" @click="logout">Uitloggen</q-btn>
    <img
      alt="Vue logo"
      width="200"
      src="https://jdejonge.nl/wp-content/uploads/2019/03/JdeJonge_Pay-off_RGB_Zwart_72.png"
    />
    <router-view />
  </div>
</template>

<script>
export default {
  name: "app",
  computed: {
    showUser() {
      return !!this.$store.state.user;
    }
  },
  methods: {
    logout() {
      this.$store.commit("logout");
    }
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
