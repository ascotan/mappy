<template>
  <div class="box">
    <figure id="image" classs="image">
      <div :id="svgId" class="svg-container"></div>
    </figure>
  </div>
</template>

<script>
export default {
  name: 'map',
  data: function() {
    return {
      svgId: "map",
      svgAttr: {
        viewBoxWidth: 3300,
        viewBoxHeight: 2550
      },
      svgContainer: null
    }
  },
  mounted: function() {
    this.createImage();
    // this.createRect(this.createPath());
    this.createOverlay();
  },
  created: function() {
    this.$root.$on('print', () => {
      this.$print("image", "html");
    })
  },
  methods: {
    createImage: function() {
      const image = this.$svg('map').size('100%', '100%').viewbox(0, 0, this.svgAttr.viewBoxWidth, this.svgAttr.viewBoxHeight);
      this.svgContainer = image;
      this.svgContainer.rect("100%", "100%").fill('none').stroke({width:3, color: '#ccc'})
    },
    createOverlay: function() {
      const startx = 150;
      const starty = 130;
      const cols = Math.ceil(this.svgAttr.viewBoxWidth / 225);
      const rows = Math.ceil(this.svgAttr.viewBoxHeight / 260);

      let x = startx;
      let y = starty;
      for (let c = 0; c < cols; c++) {
        // start the next col offset vertically depending on wether
        // it's even/odd
        if (c % 2) {
          y = starty + 130;
        } else {
          y = starty;
        }

        // draw out the overlay hexs
        for (let r = 0; r < rows; r++) {
          this.createHexagon(x, y);
          y += 260
        }
        x +=225
      }
    },
    createHexagon: function(x, y) {
      // x and y are the center of the hexagon
      const polygon = this.svgContainer.polygon([
        [(x + 150), y],
        [(x + 75 ), (y + 130)],
        [(x - 75), (y + 130)],
        [(x - 150),y],
        [(x - 75), (y - 130)],
        [(x + 75), (y - 130)]
      ]);
      polygon.fill('none').stroke({width:2, color: '#ccc'});
    }
  }
}
</script>

<style lang="scss">
  svg {
    height: auto;
    width: 100%;
  }
</style>
