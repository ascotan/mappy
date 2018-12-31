"use strict";

var _ = require('lodash')
import {Delaunay} from "d3-delaunay";
import {Utils} from './utils.js';

var MapGenerator = (function() {
    var relaxIterations = 2;
    var maxHeight = 1000;
    var minHeight = -maxHeight;

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
            dyhash: {},
            bump: false
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

    function addBump(mesh, radius, value) {
        var index = randomPolyIndex(mesh);
        var target = mesh.polys[index];

        // set the target height
        target.height = Utils.Clamp(minHeight, maxHeight, target.height + value);

        var neighbors = centroidNeighbors(mesh, target.centroid, radius);
        // for every neighbor in the radius, get their new height
        neighbors.forEach((neighbor) => {
            let height = sigmoidDistance(neighbor.distance, radius) * value;
            // make sure to add the new height to the height they already have
            neighbor.poly.height = Utils.Clamp(minHeight, maxHeight,
                neighbor.poly.height + height);
        });
        target.bump = true;
        return mesh
    }

    // clamps the distance from center to between 5/-5 and returns the s curve value
    // returns a number between 0 and 1 where 1 = at the center and 0 = at the radius
    function sigmoidDistance(distance, radius) {
        var x = 5 - (distance/(radius * .1));
        var s =  1 / (1 + Math.exp(-x));
        return s
    }

    // return all the centroids that are within a radius
    // return is {distance from origin:poly}
    function centroidNeighbors(mesh, point, radius) {
        var polys = _.reduce(mesh.polys, function(result, poly) {
            let a = poly.centroid[0] - point[0];
            let b = poly.centroid[1] - point[1];
            let distance = Math.sqrt(a * a + b * b);
            if (distance <= radius && !_.isEqual(poly.centroid, point)) {
                result.push({
                    distance: distance,
                    poly: poly
                });
            }
            return result;
        }, []);
        return polys
    }

    function randomPolyIndex(mesh) {
        return Math.round(Math.random() * mesh.polys.length);
    }

    return {
        MaxHeight: maxHeight,
        GeneratePoints: (number, extent) => {
            return relaxPoints(
                createRandomPoints(number, extent), extent);
        },
        GenerateMesh: (points, extent) => {
            return buildBaseMesh(points, extent);
        },
        GenerateHeightMap: (mesh) => {
            for (let x = 0; x < 50; x++) {
              mesh = addBump(mesh, 600, Utils.RandomRange(minHeight, maxHeight));
            }
            return mesh;
        }
    }

}());

export {MapGenerator}