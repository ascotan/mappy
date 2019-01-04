"use strict";

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

    return {
        ColorizeHeight: (height, maxHeight) => {
            return heightToColor(height, maxHeight);
        }
    }

}());

export {Utils}