<template>
  <div class="box">
    <!-- overlay modal -->
    <div class="modal" :class="{'is-active': processing}">
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div class="media">
            <span class="icon is-small media-left">
              <i class="fas fa-cog fa-pulse"></i>
            </span>
            <span class="media-content">Generating Map...</span>
          </div>
        </div>
      </div>
    </div>

    <figure id="image" class="svg-container">
      <div :id="svgId" class="svg-content"></div>
    </figure>
  </div>
</template>

<script>
import {MapGenerator} from '../map.js'
import {OverlayGenerator} from '../overlay.js'
import {Utils} from '../utils.js'

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
      voroniPolys: 3000,
      processing: false
    }
  },
  mounted: function() {
    this.createImage();
    this.createOverlay(this.scale);
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
    this.$root.$on('generate', () => {
      this.createMap();
    });
  },
  methods: {
    toggleModal: function(event) {
      alert('got it');
      this.generating = !this.generating;
    },
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
      var polys = OverlayGenerator.CreateOverlayPolygons(
        this.svgAttr.viewBoxWidth, this.svgAttr.viewBoxHeight, scale);
      polys.forEach((poly) => {
        this.svgContainer.polygon(poly).fill('none').stroke({width:2, color: '#ccc'}).addClass('grid')
      });
    },
    createMap: async function() {
      this.processing = true;
      await Utils.Sleep(100); // hack to draw the overlay
      var extent = {width: this.svgAttr.viewBoxWidth, height: this.svgAttr.viewBoxHeight};
      let points = MapGenerator.GeneratePoints(this.voroniPolys, extent);
      var mesh = MapGenerator.GenerateMesh(points, extent);
      var mesh= MapGenerator.GenerateHeightMap(mesh);

      mesh.polys.forEach((poly) => {
        this.svgContainer.polyline(poly.points).stroke({width: 2, color: '#ccc'}).fill(Utils.ColorizeHeight(poly.height, MapGenerator.MaxHeight));
        // if (poly.bump) {
        //   this.svgContainer.circle(20).attr({cx: poly.centroid[0], cy: poly.centroid[1]}).stroke({width: 2, color: '#ccc'}).fill('red');
        // }
      });
      // n.forEach((m) => {
      //   this.svgContainer.circle(20).attr({cx: m[0], cy: m[1]}).stroke({width: 2, color: '#ccc'}).fill('red');
      // });
      this.processing = false;
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
