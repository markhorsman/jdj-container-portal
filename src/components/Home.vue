<template>
  <div class="home">
    <q-btn-group push>
        <q-btn push color="primary" size="size_xl" label="Scan klant" icon="nfc" @click="$router.replace('/read-customer')"/>
        <q-btn push color="primary" size="size_xl" label="Scan product" icon="search" @click="$router.replace('/read-product')"/>
     </q-btn-group>
  </div>
</template>
<script>
export default {
  name: 'home',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>