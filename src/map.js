"use strict";

var _ = require('lodash');
import {Delaunay} from "d3-delaunay";

var MapGenerator = (function() {
    var relaxIterations = 10;
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
                height: 0
            });
        })
        return mesh;
    }

    function addBump(mesh, radius, value) {
        var index = _.random(0, mesh.polys.length - 1);
        var target = mesh.polys[index];

        // set the target height
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

    function edgeToPoints(edge) {
        let line = edge.split(',');
        return [
            line[0]+ " " +line[1],
            line[2]+ " " +line[3]
        ]
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
            return poly.height > height;
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

    function getWater(mesh) {
        var edges = [];


        mesh.polys.forEach((poly) => {

        });


       return edges;
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
        GetWater: (mesh) => {
            return getWater(mesh);
        }
    }

}());

export {MapGenerator}



// 109.01743245068407 576.0081982712726,
// 104.93235421439672 610.0110386338043,
// 84.67826713786575 618.6964117449879,
// 79.32179656253702 650.3664177805475,
// 105.2113187400026 668.4822206843643,
// 121.05857683314865 660.3768481454213,
// 148.6889336084408 670.8904591407272,
// 152.5681209359627 702.4832991671925,
// 167.94856966544708 709.7802242092821,
// 204.64836184598826 681.7309940878971,
// 208.64177549217527 683.2299966317578,
// 223.59244838992205 706.5989951829895,
// 240.69384044321134 709.677309221349,
// 257.2536181120724 738.4173297191794,
// 276.08711197434144 735.679634765814,
// 288.8281323228225 702.21633142185,
// 308.0851235683686 699.3039844298045,
// 320.4120241936101 711.2161160834247,
// 346.33954093190783 713.9361078910505,
// 354.01032257196994 735.2474266783544,
//  372.7454503022913 745.3036857027511,
//   397.03763508593397 739.1262020311203,
//  397.78699150413115 737.8246505960344,
//   444.0744205830187 727.7671380875249,
//  451.2690327661886 733.6622540294683,
//   479.4465971893266 723.8408896968232,
//  486.471075565758 698.2882464645461,
//   527.059699057206 701.4815830036073,
//  528.5727113688276 699.6468898214474,
//   564.199550744182 698.8777335353973,
//  570.8811347868925 669.2394284828096,
//   587.4637477123638 662.7877428986254,
//  609.2045246277485 682.2908103568839,
//   633.1006747083311 674.1794829212882,
//  636.448875183656 647.2948170379664,
//   661.5223023883692 638.0904135361986,
//  676.4656015148983 647.8924508146874,
//   707.5407041745987 631.1468617789283,
//  725.2201650019333 644.1765301676277,
//   759.9693713766862 617.767688926231,
//  761.5023855495605 617.9339811842218,
//   785.1468708058163 593.5203407754809,
//  822.4872771050519 614.2697848450675,
//   835.9894002557577 572.5265567711796,
//  844.5797842745541 569.4378839684066,
//   874.0996750010763 583.8093888042221,
//  897.9403482129438 548.0509251368868,
//   923.5230244053423 561.351058923244,
//  945.5677616342302 550.3290255121018,
//   949.5049373476178 525.1112186165809,
//  986.0618091847406 518.4514653068005,
//   992.9123397477467 507.79313595969046,
//  1006.256692060166 503.2427312105772,
//   1016.4362060544928 483.9067537130208,
//  1055.0715753874815 479.71143474807866,
//   1059.3861496911609 472.2091836013691,
//  1099.520236545341 470.1492904219196,
//   1104.1273018337724 474.67280326660097,
//  1145.1007661415372 461.9536288260258,
//   1141.5785678603825 432.81435916677714,
//  1149.5341475007158 421.205157577795,
//   1171.7706263337427 420.4388641433661,
//  1196.6199617383782 444.62141221923474,
//   1222.7744654692167 408.9517458148275,
//  1234.4063174262526 409.1730815911862,
//   1251.513593741431 437.00807004888895,
//  1273.3845713086325 437.9400012139906,
//   1288.7927668598818 404.3032362848651,
//  1298.9196757572151 401.38978638101935,
//   1326.9066711928374 422.1913007193865,
//  1327.3788454201265 430.3100654803572,
//   1347.7533557636439 451.7805282268592,
//  1373.4671417340287 443.40340521646436,
//   1391.3395473734902 460.7809314279447,
//  1417.612550065579 452.49735266001727,
//   1423.4202266546897 434.73274394042545,
//  1440.4427374373747 424.3732868322131,
//   1446.209754589796 425.3076144673148,
//  1466.6214481535214 450.4514806241776,
//   1491.5647905586957 444.0201879944545,
//  1497.0977678815182 426.4451342925075,
//   1518.3381096367934 416.1249093628606,
//  1513.9933568511592 386.7416252917666,
//   1525.863744392162 374.58418033171904,
//  1547.3702615019906 374.9630928832653,
//   1559.3417180405186 354.8230994001792,
//  1543.0456556002393 327.97628947165373,
//   1564.1220367580092 304.08472050004104,
//  1556.7503618064843 284.22825782008533,
//   1562.9786169700672 269.4443123131358,
//  1591.4713933652724 258.5565471220703,
//   1584.2190254366196 219.29513851885184,
//  1593.1491012183974 212.36285451818765,
//   1596.6428413064048 180.5600621115146,
//  1580.740453443298 168.6598225590532,
//   1584.0396258845926 138.5067269224762,
//  1563.0644772476094 122.83876091877629,
//   1561.8127231316644 111.33337627883994,
//  1581.9955006914233 91.50849221138334,
//   1576.775043287498 69.21341014194502,
//  1607.8931445785809 48.323548181615436,
//   1587.53637075 25.100742946247486,
//  1590.7445623216258 0,
//   1546.5589311464769 0,
//  1507.6323450021914 0,
//   1480.311383440373 0,
//  1434.6030956168154 0,
//   1392.6643454813855 0,
//  1345.5911255456808 0,
//   1303.1792617714991 0,
//  1247.7374432452511 0,
//   1188.1676192937757 0,
//  1123.8885062848935 0,
//   1071.951170540825 0,
//  1024.2801554521286 0,
//   1008.125325898889 0,
//  951.499324556567 0,
//   916.1748797016861 0,
//  866.729440486926 0,
//   819.9132039979016 0,
//  773.9768166662245 0,
//   725.3359828626267 0,
//  675.059315486128 0,
//   630.7270103585088 0,
//  589.1759210076613 0,
//   538.509681030631 0,
//  490.61811111482666 0,
//   441.7155412000774 0,
//  391.76835768850583 0,
//   342.0083764443075 0,
//  300.8458595879774 0,
//   254.79915845098606 0,
//  212.30916042600592 0,
//   174.07078904047592 0,
//  130.65264575673032 0,
//   90.2476422584264 0,
//  46.13553465191495 0,
//   46.13553465191495 0,
//  90.2476422584264 0,
//   130.65264575673032 0,
//  174.07078904047592 0,
//   212.30916042600592 0,
//  254.79915845098606 0,
//   300.8458595879774 0,
//  342.0083764443075 0,
//   391.76835768850583 0,
//  441.7155412000774 0,
//   490.61811111482666 0,
//  538.509681030631 0,
//   589.1759210076613 0,
//  630.7270103585088 0,
//   675.059315486128 0,
//  725.3359828626267 0,
//   773.9768166662245 0,
//  819.9132039979016 0,
//   866.729440486926 0,
//  916.1748797016861 0,
//   951.499324556567 0,
//  1008.125325898889 0,
//   1024.2801554521286 0,
//  1071.951170540825 0,
//   1123.8885062848935 0,
//  1188.1676192937757 0,
//   1247.7374432452511 0,
//  1303.1792617714991 0,
//   1345.5911255456808 0,
//  1392.6643454813855 0,
//   1434.6030956168154 0,
//  1480.311383440373 0,
//   1507.6323450021914 0,
//  1546.5589311464769 0,
//   1590.7445623216258 0,
//  1587.53637075 25.100742946247486,
//   1607.8931445785809 48.323548181615436,
//  1576.775043287498 69.21341014194502,
//   1581.9955006914233 91.50849221138334,
//  1561.8127231316644 111.33337627883994,
//   1563.0644772476094 122.83876091877629,
//  1584.0396258845926 138.5067269224762,
//   1580.740453443298 168.6598225590532,
//  1596.6428413064048 180.5600621115146,
//   1593.1491012183974 212.36285451818765,
//  1584.2190254366196 219.29513851885184,
//   1591.4713933652724 258.5565471220703,
//  1562.9786169700672 269.4443123131358,
//   1556.7503618064843 284.22825782008533,
//  1564.1220367580092 304.08472050004104,
//   1543.0456556002393 327.97628947165373,
//  1559.3417180405186 354.8230994001792,
//   1547.3702615019906 374.9630928832653,
//  1525.863744392162 374.58418033171904,
//   1513.9933568511592 386.7416252917666,
//  1518.3381096367934 416.1249093628606,
//   1497.0977678815182 426.4451342925075,
//  1491.5647905586957 444.0201879944545,
//   1466.6214481535214 450.4514806241776,
//  1446.209754589796 425.3076144673148,
//   1440.4427374373747 424.3732868322131,
//  1423.4202266546897 434.73274394042545,
//   1417.612550065579 452.49735266001727,
//  1391.3395473734902 460.7809314279447,
//   1373.4671417340287 443.40340521646436,
//  1347.7533557636439 451.7805282268592,
//   1327.3788454201265 430.3100654803572,
//  1326.9066711928374 422.1913007193865,
//   1298.9196757572151 401.38978638101935,
//  1288.7927668598818 404.3032362848651,
//   1273.3845713086325 437.9400012139906,
//  1251.513593741431 437.00807004888895,
//   1234.4063174262526 409.1730815911862,
//  1222.7744654692167 408.9517458148275,
//   1196.6199617383782 444.62141221923474,
//  1171.7706263337427 420.4388641433661,
//   1149.5341475007158 421.205157577795,
//  1141.5785678603825 432.81435916677714,
//   1145.1007661415372 461.9536288260258,
//  1104.1273018337724 474.67280326660097,
//   1099.520236545341 470.1492904219196,
//  1059.3861496911609 472.2091836013691,
//   1055.0715753874815 479.71143474807866,
//  1016.4362060544928 483.9067537130208,
//   1006.256692060166 503.2427312105772,
//  992.9123397477467 507.79313595969046,
//   986.0618091847406 518.4514653068005,
//  949.5049373476178 525.1112186165809,
//   945.5677616342302 550.3290255121018,
//  923.5230244053423 561.351058923244,
//   897.9403482129438 548.0509251368868,
//  874.0996750010763 583.8093888042221,
//   844.5797842745541 569.4378839684066,
//  835.9894002557577 572.5265567711796,
//   822.4872771050519 614.2697848450675,
//  785.1468708058163 593.5203407754809,
//   761.5023855495605 617.9339811842218,
//  759.9693713766862 617.767688926231,
//   725.2201650019333 644.1765301676277,
//  707.5407041745987 631.1468617789283,
//   676.4656015148983 647.8924508146874,
//  661.5223023883692 638.0904135361986,
//   636.448875183656 647.2948170379664,
//  633.1006747083311 674.1794829212882,
//   609.2045246277485 682.2908103568839,
//  587.4637477123638 662.7877428986254,
//   570.8811347868925 669.2394284828096,
//  564.199550744182 698.8777335353973,
//   528.5727113688276 699.6468898214474,
//  527.059699057206 701.4815830036073,
//   486.471075565758 698.2882464645461,
//  479.4465971893266 723.8408896968232,
//   451.2690327661886 733.6622540294683,
//  444.0744205830187 727.7671380875249,
//   397.78699150413115 737.8246505960344,
//  397.03763508593397 739.1262020311203,
//   372.7454503022913 745.3036857027511,
//  354.01032257196994 735.2474266783544,
//   346.33954093190783 713.9361078910505,
//  320.4120241936101 711.2161160834247,
//   308.0851235683686 699.3039844298045,
//  288.8281323228225 702.21633142185,
//   276.08711197434144 735.679634765814,
//  257.2536181120724 738.4173297191794,
//   240.69384044321134 709.677309221349,
//  223.59244838992205 706.5989951829895,
//   208.64177549217527 683.2299966317578,
//  204.64836184598826 681.7309940878971,
//   167.94856966544708 709.7802242092821,
//  152.5681209359627 702.4832991671925,
//   148.6889336084408 670.8904591407272,
//  121.05857683314865 660.3768481454213,
//   105.2113187400026 668.4822206843643,
//  79.32179656253702 650.3664177805475,
//   84.67826713786575 618.6964117449879,
//  104.93235421439672 610.0110386338043,
