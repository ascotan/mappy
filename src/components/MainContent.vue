<template>
  <div id="main" class="section">
      <div class="container is-fluid">
        <div class="columns">
          <div class="column is-one-fifth">
            <Sidebar/>
          </div>
          <div class="column">
            <MapImage/>
          </div>
        </div>
      </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue'
import MapImage from './MapImage.vue'

export default {
  name: 'maincontent',
  components: {
    Sidebar,
    MapImage
  }
}
</script>

<style lang="scss">
#main {
  flex: 1;
}
</style>
