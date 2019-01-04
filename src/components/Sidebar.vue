<template>
    <nav class="panel">
      <p class="panel-heading">
        Tools
      </p>
      <div class="panel-block">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="drawHeightMap">
            Show Heightmap
          </label>
        </div>
      </div>
      <div class="panel-block">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="drawBoundaries">
            Show Boundaries
          </label>
        </div>
      </div>
      <div class="panel-block">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="drawCentroids">
            Show Centroids
          </label>
        </div>
      </div>
      <div class="panel-block">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="drawOverlay">
            Show Overlay
          </label>
        </div>
      </div>
      <div class="panel-block">
          <div class="control">
            <label class="label">Overlay Scale</label>
            <input class="slider is-fullwidth" step="10" min="40" max="120" value="60" type="range" v-model="overlayScale">
          </div>
      </div>
      <div class="panel-block">
        <a class="button is-fullwidth" v-on:click="generate" >
          <span class="icon is-small">
            <i class="fas fa-map"></i>
          </span>
          <span>Generate</span>
        </a>
      </div>
      <div class="panel-block">
        <a class="button is-fullwidth" v-on:click="print">
          <span class="icon is-small">
            <i class="fas fa-print"></i>
          </span>
          <span>Print</span>
        </a>
      </div>
    </nav>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
    name: 'sidebar',
    computed: {
      drawHeightMap : {
        get () {
          return this.$store.state.drawHeightMap
        },
        set (value) {
          this.$store.commit('TOGGLE_DRAW_HEIGHTMAP', value)
        }
      },
      drawBoundaries : {
        get () {
          return this.$store.state.drawBoundaries
        },
        set (value) {
          this.$store.commit('TOOGLE_DRAW_BOUNDARIES', value)
        }
      },
      drawCentroids : {
        get () {
          return this.$store.state.drawCentroids
        },
        set (value) {
          this.$store.commit('TOOGLE_DRAW_CENTROIDS', value)
        }
      },
      drawOverlay : {
        get () {
          return this.$store.state.drawOverlay
        },
        set (value) {
          this.$store.commit('TOOGLE_DRAW_OVERLAY', value)
        }
      },
      overlayScale: {
        get() {
          return this.$store.state.overlayScale
        },
        set(value) {
          this.$store.commit('UPDATE_OVERLAY_SCALE', value)
        }
      }
    },
    methods: {
      print: function() {
        this.$root.$emit('print');
      },
      generate: function() {
        this.$root.$emit('generate');
      }
    }
}
</script>

<style lang="scss">
.panel-block
  .label {
    margin-right: 10px;
  }
</style>
