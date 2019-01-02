"use strict";

var Utils = (function() {

    function differenceArrays (a1, a2) {
        var a = [], diff = [];
        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }
        for (var i = 0; i < a2.length; i++) {
            if (a[a2[i]]) {
                delete a[a2[i]];
            } else {
                a[a2[i]] = true;
            }
        }
        for (var k in a) {
            diff.push(k);
        }
        return diff;
    }

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
        },
        Difference: (array1, array2) => {
            return differenceArrays(array1, array2);
        }
    }

}());

export {Utils}