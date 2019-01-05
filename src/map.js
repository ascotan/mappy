"use strict";

var _ = require('lodash');
import {Delaunay} from "d3-delaunay";

var MapGenerator = (function() {
    var relaxIterations = 10;
    var maxHeight = 1000;
    var minHeight = -500;

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
            var edges = [];
            var edgesSorted = [];
            for(let x = 0; x < pnts.length-1; x++) {
                // sort the cordinates of the edge by x then y
                // this keeps all edges looking the same
                edges.push([pnts[x], pnts[x+1]].toString());
                edgesSorted.push(_.sortBy([pnts[x], pnts[x+1]],
                    [function(o) {return o[0];}, function(o) { return o[1];}]).toString());
            }
            mesh.polys.push({
                centroid: points[index],
                edges: edges,
                edgesSorted: edgesSorted,
                height: 0,
                erosion: 0
            });
        })
        return mesh;
    }

    function addBump(mesh, radius, value) {
        var index = _.random(0, mesh.polys.length - 1);
        var target = mesh.polys[index];

        // set the target height
        // to prevent massive 'maxheight' areas, invert the bumpmap
        // to give better texture
        if (target.height == maxHeight) {
            value = -value;
        }
        target.height = _.clamp(target.height + value, minHeight, maxHeight);

        var neighbors = centroidNeighbors(mesh, target.centroid, radius);
        // for every neighbor in the radius, get their new height
        neighbors.forEach((neighbor) => {
            let height = sigmoidDistance(neighbor.distance, radius) * value;
            // make sure to add the new height to the height they already have
            neighbor.poly.height = _.clamp(neighbor.poly.height + height, minHeight, maxHeight);
        });
        target.bump = true;
        return mesh
    }

    // get a hex color from a height
    // assumes that heights are clamped to -1000 to 1000
    function heightToColor(height) {
        height = _.clamp(height, minHeight, maxHeight);
        var color = [];
        if (height < 0) {
            color = [0, 102, 255]; // blue
        } else {
            color = [153, 102, 51]; // brown
        }

        let shade = (Math.round(125 + (125 * (height * (1/maxHeight))))/255);
        let hex = "#";
        color.forEach((component) => {
            component = Math.round(component * shade);
            // make sure there is a "0" infront of small numbers
            hex = hex + ("0" + (component).toString(16)).slice(-2)
        });
        return hex;
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

    // this function takes the polygon hull of a set of polygons and extracts SVG paths from it
    function polylineToPaths(hull) {
        // construct a hash of all points on the polyline
        // and the 2 points they're connected to
        var hash = {};
        hull.forEach((edge) => {
            let values = edge.split(',');
            let p1 = values[0] + " " + values[1];
            let p2 = values[2] + " " + values[3];
            if (_.has(hash, p1)) {
                if (!hash[p1].includes(p2)) {
                    hash[p1].push(p2);
                }
            } else {
                hash[p1] = [p2];
            }
            if (_.has(hash, p2)) {
                if (!hash[p2].includes(p1)) {
                    hash[p2].push(p1);
                }
            } else {
                hash[p2] = [p1];
            }
        });

        // TODO: there are still a bug here
        // 1. there are periodically a single path segment that isnt' drawn - likely due to how
        // we are closing loops and where the start point is chosen

        // extract all the paths from the polyline
        var paths = [];
        var points = _.keys(hash);
        var seen = {};

        // there may be multiple paths in the polyline
        while(points.length > 0) {
            var path = [];

            // pick the first point as the start of the path
            var start = points[0];
            var prev = "";
            var next = start;

            var count = 0;
            var flag = true;

            // next != start to prev reverse loops
            // next != start to stop forward loops
            // _.has(seen, next) to prevent going into paths that have already been pulled out
            // flag avoids the first loop false case
            // count is for safety
            while((next != start && next != prev && !_.has(seen, next) && count < points.length) || flag) {
                // capture the path point
                path.push(next);
                seen[next] = next;

                // pull the 2 points it's connected 2
                let values = hash[next];

                // at the first point in the path, either value is ok
                // at the second point, we should be seeing a prev, next in the set
                // set the next and prev for the next iteration
                let match = "";
                values.forEach((value) => {
                    if (value != prev) {
                        match = value;
                    }
                });
                prev = next;
                next = match;

                // increment flags
                count++; flag = false;
            }
            if (next == start) {
                path.push(next);
                seen[next] = next;
            }

            // start the SVG path string
            var stroke = "M " + path[0];
            for (let x = 1; x < path.length; x = x + 2) {
                if (x+1 < path.length) {
                    // quadradic bezier uses 2 points
                    // first is the control point, second is the final point
                    stroke = stroke + " Q " + path[x] + " " + path[x+1];
                } else {
                    stroke = stroke + " L " + path[x];
                }
            }

            // some paths apparently don't really close so...
            if (next == start) {
                stroke = stroke + " Z";
            }
            paths.push(stroke);

            // remove the points seen from the list of points
            points = _.difference(points, _.values(seen));
        }
        return paths;
    }

    // gets the outer boundary of a set of polygons
    function getHull(mesh, height) {
        // get all polygons with a height > some input
        var polys = _.filter(mesh.polys, function(poly) {
            return (poly.height - poly.erosion) > height;
        });
        if (polys.length == 0) {
            return [];
        }

        // get all the edges
        var edges = [];
        polys.forEach((poly) => {
            edges = _.concat(edges, poly.edgesSorted);
        });

        // count how many times an edge is seen
        var hash = {};
        edges.forEach( function(edge) {
            if (_.has(hash, edge)) {
                 hash[edge]++;
            } else {
                hash[edge] = 1;
            }
        });

        // create a dictiony {"times seen": [edges]} and pull back edges seen "1" time
        var hull = _.transform(hash, function(result, value, key) {
          (result[value] || (result[value] = [])).push(key);
        }, {})["1"];

       return hull;
    }

    function applyWater(mesh) {
        mesh.polys.forEach((poly) => {
            let neighbors = centroidNeighbors(mesh, poly.centroid, 150);
            neighbors.forEach((neighbor) => {
                if (poly.height > neighbor.poly.height) {
                    // lets say that erosion is 1/10 of the height differential
                    let erosion = (poly.height - neighbor.poly.height) * .1;
                    neighbor.poly.erosion = _.clamp(neighbor.poly.erosion + erosion, minHeight, maxHeight);
                }
            });
        });
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
        GenerateHeightMap: (mesh, bumps, maxRadius, minRadius) => {
            // bumps are fine for now - heightmap can be improve bigtime
            for (let x = 0; x < bumps; x++) {
              mesh = addBump(mesh, _.random(maxRadius, minRadius), _.random(minHeight, maxHeight));
            }
            return mesh;
        },
        GetBoundaries: (mesh, height) => {
            let hull = getHull(mesh, height);
            return polylineToPaths(hull);
        },
        Erode: (mesh) => {
            applyWater(mesh);
        },
        ColorizeHeight: (height) => {
            return heightToColor(height);
        }
    }

}());

export {MapGenerator}