<template>
  <div class="box">
    <figure id="image" class="svg-container">
      <div :id="svgId" class="svg-content"></div>
    </figure>
  </div>
</template>

<script>
import {MapGenerator} from '../map.js'

export default {
  name: 'map',
  data: function() {
    return {
      svgId: "map",
      svgAttr: {
        viewBoxWidth: 3300,
        viewBoxHeight: 2550
      },
      svgContainer: null,
      scale: 1.0,
      showOverlay: true,
      voroniPolys: 3000
    }
  },
  mounted: function() {
    this.createImage();
    //this.createOverlay(this.scale);
    this.createMap();
  },
  created: function() {
    this.$root.$on('print', () => {
      this.$print({
        printable: "image",
        type: "html"
      });
    });
    this.$root.$on('changeScale', (scale) => {
      this.scale = scale * 0.01;
      this.updateOverlayScale();
    });
    this.$root.$on('changeOverlayVisbility', (visible) => {
      this.showOverlay = visible;
      this.toggleOverlay();
    });
  },
  methods: {
    createImage: function() {
      const image = this.$svg('map').size('100%', '100%').viewbox(0, 0, this.svgAttr.viewBoxWidth, this.svgAttr.viewBoxHeight);
      this.svgContainer = image;
      this.svgContainer.rect("100%", "100%").fill('none').stroke({width:3, color: '#ccc'})
    },
    updateOverlayScale: function() {
        this.svgContainer.select('polygon.grid').each(function() {
          this.remove();
        });
        this.createOverlay(this.scale);
        this.toggleOverlay();
    },
    toggleOverlay: function() {
      if (this.showOverlay) {
        this.svgContainer.select('polygon.grid').show();
      } else {
        this.svgContainer.select('polygon.grid').hide();
      }
    },
    createOverlay: function(scale) {
      const startx = 150 * scale;
      const starty = 130 * scale;
      const cols = Math.ceil(this.svgAttr.viewBoxWidth / (225 * scale));
      const rows = Math.ceil(this.svgAttr.viewBoxHeight / (260 * scale));

      let x = startx;
      let y = starty;
      for (let c = 0; c < cols; c++) {
        // start the next col offset vertically depending on wether
        // it's even/odd
        if (c % 2) {
          y = starty + (130 * scale);
        } else {
          y = starty;
        }

        // draw out the overlay hexs
        for (let r = 0; r < rows; r++) {
          this.createHexagon(x, y, scale);
          y += (260 * scale)
        }
        x += (225 * scale)
      }
    },
    createHexagon: function(x, y, scale) {
      // x and y are the center of the hexagon
      const polygon = this.svgContainer.polygon([
        [(x + (150 * scale)), y],
        [(x + (75 * scale)), (y + (130*scale))],
        [(x - (75 * scale)), (y + (130 * scale))],
        [(x - (150 * scale)),y],
        [(x - (75 * scale)), (y - (130 * scale))],
        [(x + (75 * scale)), (y - (130 * scale))]
      ]);
      polygon.fill('none').stroke({width:2, color: '#ccc'}).addClass('grid');
    },
    createMap: function() {
      var extent = {width: this.svgAttr.viewBoxWidth, height: this.svgAttr.viewBoxHeight};
      let points = MapGenerator.GeneratePoints(this.voroniPolys, extent);
      var mesh = MapGenerator.GenerateMesh(points, extent);
      var mesh= MapGenerator.GenerateHeightMap(mesh);
      mesh.polys.forEach((poly) => {
        this.svgContainer.polyline(poly.points).stroke({width: 2, color: '#ccc'}).fill(MapGenerator.ColorizeHeight(poly.height)).data('poly', poly).on('click', function(poly) {
            console.log(this.data('poly'));
            console.log(MapGenerator.ColorizeHeight(this.data('poly').height));
        });
        // if (poly.bump) {
        //   this.svgContainer.circle(20).attr({cx: poly.centroid[0], cy: poly.centroid[1]}).stroke({width: 2, color: '#ccc'}).fill('red');
        // }
      });
      // n.forEach((m) => {
      //   this.svgContainer.circle(20).attr({cx: m[0], cy: m[1]}).stroke({width: 2, color: '#ccc'}).fill('red');
      // });

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
