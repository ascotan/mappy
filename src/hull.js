"use strict";

var _ = require('lodash');

// graham scan for computing a convex hull
// https://en.wikipedia.org/wiki/Graham_scan
var Hull = (function() {

    // assumes points is an array of [x, y]
    function compute(points) {
        var hull = [];
        // point with the lowest y-coord
        var sorted = _.sortBy(points, [function (value) {
            return value[1];
        }]);

        hull.push(sorted[0]);
        hull.push(sorted[1]);

        return hull;
    }

    return {
        GetHull: (points) => {
            return compute(points);
        }
    }

}());

export {Hull}