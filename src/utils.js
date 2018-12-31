"use strict";

var _ = require('lodash')

var Utils = (function() {

    // get a hex color from a height
    // assumes that heights are clamped to -1000 to 1000
    function heightToColor(height, maxHeight) {
        var r = Math.round(125 + (125 * (height * (1/maxHeight))));
        var g = Math.round(125 + (125 * (height * (1/maxHeight))));
        var b = Math.round(125 + (125 * (height * (1/maxHeight))));
        // make sure there is a "0" infront of small numbers
        return "#" + ("0" + (r).toString(16)).slice(-2) +
                     ("0" + (g).toString(16)).slice(-2) +
                     ("0" + (b).toString(16)).slice(-2);
    }

    function clamp(min, max, number) {
        return Math.min(Math.max(number, min), max);
    }

    function getRandomRange(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    return {
        ColorizeHeight: (height, maxHeight) => {
            return heightToColor(height, maxHeight);
        },
        Clamp: (min, max, number) => {
          return clamp(min, max, number);
        },
        RandomRange: (min, max) => {
          return getRandomRange(min, max);
        },
        Sleep: (ms) => {
          return sleep(ms);
        }
    }

}());

export {Utils}