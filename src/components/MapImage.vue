<template>
  <div class="box">
    <!-- overlay modal -->
    <div class="modal" :class="{'is-active': drawing}">
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
var _ = require('lodash');
import {MapGenerator} from '../map.js'
import {OverlayGenerator} from '../overlay.js'
import {Utils} from '../utils.js'
import { mapMutations } from 'vuex'
import { mapState } from 'vuex'

export default {
  name: 'mapimage',
  data: function() {
    return {
      svgId: "map",
      svgAttr: {
        viewBoxWidth: 3300,
        viewBoxHeight: 2550,
        polys: 5000,
        drawCentroids: false,
        drawHeightMap: true,
        bumpmap: {
          bumps: 50,
          minRadius: 100,
          maxRadius: 1500
        }
      },
      overlayAttr: {
        scale: 1.0,
        visible: true
      },
      svgContainer: null
    }
  },
  computed: mapState([
    'drawing'
  ]),
  mounted: function() {
    this.createImage();
    this.createOverlay(this.overlayAttr.scale);
    this.createMap();
  },
  created: function() {
    // because $root is everyone's parent - thx javascript
    this.$root.$on('print', () => {
      this.$print({
        printable: "image",
        type: "html"
      });
    });
    this.$root.$on('changeScale', (scale) => {
      this.overlayAttr.scale = scale * 0.01;
      this.updateOverlayScale();
    });
    this.$root.$on('changeOverlayVisbility', (visible) => {
      this.overlayAttr.visible = visible;
      this.toggleOverlay();
    });
    this.$root.$on('generate', () => {
      this.createMap();
    });
  },
  methods: {
    ...mapMutations({
      startDraw: 'START_DRAW',
      stopDraw: 'STOP_DRAW'
    }),
    createImage: function() {
      const image = this.$svg('map').size('100%', '100%').viewbox(0, 0, this.svgAttr.viewBoxWidth, this.svgAttr.viewBoxHeight);
      this.svgContainer = image;
      this.svgContainer.rect("100%", "100%").fill('none').stroke({width:3, color: '#ccc'})
    },
    updateOverlayScale: function() {
        this.svgContainer.select('polygon.grid').each(function() {
          this.remove();
        });
        this.createOverlay(this.overlayAttr.scale);
        this.toggleOverlay();
    },
    toggleOverlay: function() {
      if (this.overlayAttr.visible) {
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
    createMap: function() {
      this.startDraw();

      // clean out old data
      var all = this.svgContainer.select('*');
      all.members.forEach((item) => {
        item.remove();
      });

      // get map data
      var extent = {width: this.svgAttr.viewBoxWidth, height: this.svgAttr.viewBoxHeight};
      let points = MapGenerator.GeneratePoints(this.svgAttr.polys, extent);
      var mesh = MapGenerator.GenerateMesh(points, extent);
      mesh = MapGenerator.GenerateHeightMap(mesh, this.svgAttr.bumpmap.bumps, this.svgAttr.bumpmap.minRadius, this.svgAttr.bumpmap.maxRadius);
      mesh = MapGenerator.GetWater(mesh);

      // draw the voroni diagram + heighmap
      if (this.svgAttr.drawHeightMap) {
        mesh.polys.forEach((poly) => {
          this.svgContainer.polyline(_.flatten(poly.edges)).fill(Utils.ColorizeHeight(poly.height, MapGenerator.MaxHeight));
          if (this.svgAttr.drawCentroids){
             this.svgContainer.circle(5).attr({cx: poly.centroid[0], cy: poly.centroid[1]}).fill('red');
          }
        });
      }

      // drop topgraphic lines
      for (let x = 0; x <= MapGenerator.MaxHeight; x += 1000) {
        var hull = MapGenerator.GetHull(mesh, x);
        hull.forEach((edge) => {
          this.svgContainer.polyline(edge).stroke({width: 5, color: 'black'});
        });
      }

      this.stopDraw();
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
