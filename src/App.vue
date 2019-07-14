<template>
  <div id="app">
    <img alt="Vue logo" src="https://jdejonge.nl/wp-content/uploads/2019/03/JdeJonge_Pay-off_RGB_Zwart_72.png">
    <Reader/>
  </div>
</template>

<script>
import Reader from './components/Reader.vue'

export default {
  name: 'app',
  components: {
    Reader
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
