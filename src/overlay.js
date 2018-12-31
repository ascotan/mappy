"use strict";

var _ = require('lodash')

var OverlayGenerator = (function() {

    function createGrid(width, height, scale) {
      const startx = 150 * scale;
      const starty = 130 * scale;
      const cols = Math.ceil(width / (225 * scale));
      const rows = Math.ceil(height / (260 * scale));

      var x = startx;
      var y = starty;
      var polygons = [];
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

          polygons.push(createHexagon(x, y, scale));
          y += (260 * scale)
        }
        x += (225 * scale)
      }
      return polygons
    }

    function createHexagon(x, y, scale) {
      // x and y are the center of the hexagon
      return [
        [(x + (150 * scale)), y],
        [(x + (75 * scale)), (y + (130*scale))],
        [(x - (75 * scale)), (y + (130 * scale))],
        [(x - (150 * scale)),y],
        [(x - (75 * scale)), (y - (130 * scale))],
        [(x + (75 * scale)), (y - (130 * scale))]
      ]
    }

    return {
        CreateOverlayPolygons: (width, height, scale) => {
            return createGrid(width, height, scale);
        }
    }

}());

export {OverlayGenerator}