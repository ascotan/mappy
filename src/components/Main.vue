<template>
  <div id="main" class="section">
      <div class="container is-fluid">
        <div class="columns">
          <div class="column is-one-fifth">
            <Sidebar/>
          </div>
          <div class="column">
            <Map/>
          </div>
        </div>
      </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue'
import Map from './Map.vue'

export default {
  name: 'main',
  components: {
    Sidebar,
    Map
  }
}
</script>

<style lang="scss">
#main {
  flex: 1;
}
</style>
