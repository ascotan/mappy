<template>
    <nav class="panel">
      <p class="panel-heading">
        Tools
      </p>
      <div class="panel-block">
        <label>Scale</label>
        <input class="slider is-fullwidth" step="1" min="0" max="100" value="50" type="range" v-model="myvalue">
        <span>{{ myvalue }}</span>
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
        myvalue: 86
      }
    },
    methods: {
      print: function() {
        this.$root.$emit('print');
      }
    }
}
</script>

<style lang="scss">
</style>
