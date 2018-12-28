"use strict";

var _ = require('lodash')
import {Delaunay} from "d3-delaunay";

var MapGenerator = (function() {
    var relaxIterations = 2;

    // create a set of points for the voroni diagram
    function generatePoints(n, extent) {
        var points = [];
        for (var i = 0; i < n; i++) {
            points.push([Math.random() * extent.width, Math.random() * extent.height]);
        }

        // lloyd's relaxation to improve the voroni diagram
        // do 2 iterations
        for (let x=0; x < relaxIterations; x++) {
            var generator = voroni(points, extent).cellPolygons();
            points = [];
            var poly = generator.next()
            while (poly.done != true) {
              points.push(centroid(poly.value));
              poly = generator.next();
            }
        }

        return points
    }

    // calculate the centroid of a polygon
    function centroid(polygon) {
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

    // generate a voroni diagram
    function voroni(points, extent) {
        const d = Delaunay.from(points);
        return d.voronoi([0, 0, extent.width, extent.height]);
    }

    function heightToColor(height) {
        // max height = 1000, min height = -1000
        var r = 125 + (125 * (height * .001));
        var g = 125 + (125 * (height * .001));
        var b = 125 + (125 * (height * .001));
        return "#" + (r).toString(16) + (g).toString(16) + (b).toString(16);
    }

    function randomPolyIndex(mesh) {
        return Math.round(Math.random() * mesh.polys.length);
    }

    function neighbors(mesh, index) {
        var poly = mesh.polys[index];
        var dIndex = mesh.voroni.delaunay.find(poly.centroid[0], poly.centroid[1]);
        var generator =  mesh.voroni.delaunay.neighbors(dIndex);

        var centroids = [];
        var n = generator.next();
        while (n.done != true) {
            mesh.voroni.delaunay.trianglePolygon(n.value).forEach((centroid) => {
                centroids.push(centroid);
            });
            n = generator.next();
        }
        centroids = _.uniqWith(centroids, _.isEqual);



        var node = mesh.voroni.delaunay.hull;
        var sIndex = node.i;
        console.log(poly.centroid);
        console.log(node);
        while (node.i != sIndex) {
            console.log("HERE");
            if (node.x == poly.centroid[0] && node.y == poly.centroid[1]) {
                console.log("MATCH");
                console.log(node);
                break;
            }
            node = node.next;
        }


        return centroids;


    }

    function addBump(mesh) {
        var index = randomPolyIndex(mesh);
        mesh.polys[index].height = 1000;
        var n = neighbors(mesh, index);
        return mesh, n
    }

    return {
        GeneratePoints: (number, extent) => {
            return generatePoints(number, extent);
        },
        GenerateMesh: (points, extent) => {
            var mesh = {
                voroni: null,
                polys: []
            };
            var polys = [];
            mesh.voroni = voroni(points, extent);
            var generator = mesh.voroni.cellPolygons();
            var poly = generator.next()
            while (poly.done != true) {
              polys.push(poly.value);
              poly = generator.next();
            }
            polys.forEach((pnts, index) => {
                mesh.polys.push({
                    centroid: points[index],
                    points: pnts,
                    height: 0
                });
            })
            return mesh;
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