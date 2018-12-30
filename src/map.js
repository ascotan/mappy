"use strict";

var _ = require('lodash')
import {Delaunay} from "d3-delaunay";

var MapGenerator = (function() {
    var relaxIterations = 2;

    function createRandomPoints(n, extent) {
        // create a random set of points
        var points = [];
        for (var i = 0; i < n; i++) {
            points.push([Math.random() * extent.width, Math.random() * extent.height]);
        }
        return points
    }

    // do a few iterations of lloyd's relaxation to imporove the centroids
    function relaxPoints(points, extent) {
        for (let x=0; x < relaxIterations; x++) {
            var generator = generateVoroniDiagram(points, extent).cellPolygons();
            points = [];
            var poly = generator.next()
            while (poly.done != true) {
              points.push(calculateCentroid(poly.value));
              poly = generator.next();
            }
        }
        return points
    }

    //calculate the centroid of a polygon
    function calculateCentroid(polygon) {
      var i = -1, n = polygon.length, x = 0, y = 0, a, b = polygon[n - 1], c, k = 0;
      while (++i < n) {
        a = b;
        b = polygon[i];
        k += c = a[0] * b[1] - b[0] * a[1];
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
      }

      return k *= 3, [x / k, y / k];
    }

    // generate a voroni diagram from a set of points
    function generateVoroniDiagram(points, extent) {
        const d = Delaunay.from(points);
        return d.voronoi([0, 0, extent.width, extent.height]);
    }

    // build a datastructure to represent the voroni mesh
    function buildBaseMesh(points, extent) {
        var mesh = {
            voroni: null,
            polys: [],
            dxhash: {},
            dyhash: {}
        };

        // add all the polygons
        var polys = [];
        mesh.voroni = generateVoroniDiagram(points, extent);
        var generator = mesh.voroni.cellPolygons();
        var poly = generator.next()
        while (poly.done != true) {
          polys.push(poly.value);
          poly = generator.next();
        }

        // each polygon has a centroid, a set of points to define
        // it's hull and a height (for a heightmap)
        polys.forEach((pnts, index) => {
            mesh.polys.push({
                centroid: points[index],
                points: pnts,
                height: 0
            });
        })

        // create a hashtable for centroids based on delta x and y
        mesh.polys.forEach((poly, index) => {
            mesh.dxhash[poly.centroid[0]] = index;
            mesh.dyhash[poly.centroid[1]] = index;
        });
        return mesh;
    }

    function addBump(mesh) {
        var index = randomPolyIndex(mesh);
        mesh.polys[index].height = 1000;
        var n = neighbors(mesh, index);
        return mesh, n
    }

    function randomPolyIndex(mesh) {
        return Math.round(Math.random() * mesh.polys.length);
    }

    function neighbors(mesh, index) {
        var poly = mesh.polys[index];
        var neighbors = [];
        mesh.polys.forEach((other, i) => {
            if (_.intersection(other.points, poly.points).length > 0) {
                console.log(other);
                neighbors.push(i);
            }
        })
        return neighbors;
    }

    // get a hex color from a height
    // assumes that heights are clamped to -1000 to 1000
    function heightToColor(height) {
        var r = 125 + (125 * (height * .001));
        var g = 125 + (125 * (height * .001));
        var b = 125 + (125 * (height * .001));
        return "#" + (r).toString(16) + (g).toString(16) + (b).toString(16);
    }

    return {
        GeneratePoints: (number, extent) => {
            return relaxPoints(
                createRandomPoints(number, extent), extent);
        },
        GenerateMesh: (points, extent) => {
            return buildBaseMesh(points, extent);
        },
        GenerateHeightMap: (mesh) => {
            mesh = addBump(mesh);
            return mesh;
        },
        ColorizeHeight: (height) => {
            return heightToColor(height);
        }
    }

}());

export {MapGenerator}