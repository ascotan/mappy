<template>
    <nav class="panel">
      <p class="panel-heading">
        Tools
      </p>
      <div class="panel-block">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="showOverlay" @input="changeOverlayVisbility">
            Show Overlay
          </label>
        </div>
      </div>
      <div class="panel-block">
          <div class="control">
            <label class="label">Overlay Scale</label>
            <input class="slider is-fullwidth" step="10" min="40" max="120" value="60" type="range" v-model="scale" @input="changeScale">
          </div>
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
export default {
    name: 'sidebar',
    data: function() {
      return {
        scale: 100,
        showOverlay: true
      }
    },
    created() {
      this.changeScale();
    },
    methods: {
      print: function() {
        this.$root.$emit('print');
      },
      changeScale: function() {
        this.$root.$emit('changeScale', this.scale);
      },
      changeOverlayVisbility: function() {
        this.$root.$emit('changeOverlayVisbility', !this.showOverlay);
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
