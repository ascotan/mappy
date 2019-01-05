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
        bumpmap: {
          bumps: 50,
          minRadius: 100,
          maxRadius: 1500
        },
        coastlineHeight: 0,
        topoLineHeightEvery: 250
      },
      svgContainer: null
    }
  },
  computed: mapState([
    'drawing',
    'drawHeightMap',
    'drawBoundaries',
    'drawCentroids',
    'drawOverlay',
    'overlayScale'
  ]),
  mounted: function() {
    this.createImage();
    this.createOverlay(this.overlayScale);
    this.createMap();
  },
  watch: {
    drawHeightMap (value) {
      if (value == true) {
        this.svgContainer.select('polyline.heightmap').show();
      } else {
        this.svgContainer.select('polyline.heightmap').hide();
      }
    },
    drawBoundaries (value) {
      if (value == true) {
        this.svgContainer.select('path').show();
      } else {
        this.svgContainer.select('path').hide();
      }
    },
    drawCentroids (value) {
      if (value == true) {
        this.svgContainer.select('circle').show();
      } else {
        this.svgContainer.select('circle').hide();
      }
    },
    drawOverlay (value) {
      if (value == true) {
        this.svgContainer.select('polygon.grid').show();
      } else {
        this.svgContainer.select('polygon.grid').hide();
      }
    },
    overlayScale (value) {
      this.createOverlay(value);
    }
  },
  created: function() {
    // because $root is everyone's parent - thx javascript
    this.$root.$on('print', () => {
      this.$print({
        printable: "image",
        type: "html"
      });
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
    createOverlay: function(scale) {
      scale = scale * 0.01;
      this.svgContainer.select('polygon.grid').each(function() {
        this.remove();
      });
      var polys = OverlayGenerator.CreateOverlayPolygons(
        this.svgAttr.viewBoxWidth, this.svgAttr.viewBoxHeight, scale);
      polys.forEach((poly) => {
        let line = this.svgContainer.polygon(poly).fill('none').stroke({width:2, color: '#ccc'}).addClass('grid')
        if (!this.drawOverlay) {
          line.hide();
        }
      });
    },
    createMap: function() {
      this.startDraw();

      // clean out old data but not the grid
      var all = this.svgContainer.select('*:not(.grid)');
      all.members.forEach((item) => {
        item.remove();
      });

      // get map data
      var extent = {width: this.svgAttr.viewBoxWidth, height: this.svgAttr.viewBoxHeight};
      let points = MapGenerator.GeneratePoints(this.svgAttr.polys, extent);
      var mesh = MapGenerator.GenerateMesh(points, extent);
      mesh = MapGenerator.GenerateHeightMap(mesh, this.svgAttr.bumpmap.bumps, this.svgAttr.bumpmap.minRadius, this.svgAttr.bumpmap.maxRadius);
      // draw the voroni diagram + heighmap
      mesh.polys.forEach((poly, index) => {
        let line = this.svgContainer.polyline(_.flatten(poly.edges)).fill(MapGenerator.ColorizeHeight(poly.height)).addClass('heightmap').data({'index': index});
        if (!this.drawHeightMap) {
          line.hide();
        }

        // TODO: for some reason setting attributies on all these circles takes longer than drawing the entire
        // map. Must have something to do with non-optimized code in svg.js
        let circle = this.svgContainer.circle(5).attr({cx: poly.centroid[0], cy: poly.centroid[1]}).fill('red');
        if (!this.drawCentroids) {
          circle.hide();
        }
      });

      // erode based on water
      MapGenerator.Erode(mesh);
      this.svgContainer.select('polyline.heightmap').each(function() {
        let poly = mesh.polys[parseInt(this.data('index'))];
        this.attr({fill: MapGenerator.ColorizeHeight(poly.height - poly.erosion)})
      });

      // drop topgraphic lines
      for (let x = this.svgAttr.coastlineHeight; x <= MapGenerator.MaxHeight; x += this.svgAttr.topoLineHeightEvery) {
        var paths = MapGenerator.GetBoundaries(mesh, x);

        paths.forEach((path) => {
          let line = this.svgContainer.path(path).stroke({width: 7, color: 'black'}).fill('none');
          if (!this.drawBoundaries) {
            line.hide();
          }
        });
      }

      this.stopDraw();

      // move the grid back to the front
      this.svgContainer.select('.grid').front();
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


