<template>
  <div id="app">
    <Navigation/>
    <Main/>
    <Footer/>
  </div>
</template>

<script>
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import Main from './components/Main.vue'

export default {
  name: 'app',
  components: {
    Footer,
    Main,
    Navigation
  }
}
</script>

<style>
#app {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
</style>
