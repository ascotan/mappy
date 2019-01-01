<template>
  <div id="app">
    <Navigation/>
    <MainContent/>
    <PageFooter/>
  </div>
</template>

<script>
import Navigation from './components/Navigation.vue'
import PageFooter from './components/PageFooter.vue'
import MainContent from './components/MainContent.vue'

export default {
  name: 'app',
  components: {
    PageFooter,
    MainContent,
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
