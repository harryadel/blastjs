export const gju = {};

// adapted from http://www.kevlindev.com/gui/math/intersection/Intersection.js
gju.lineStringsIntersect = function (l1, l2) {
  let intersects = [];
  for (let i = 0; i <= l1.coordinates.length - 2; ++i) {
    for (let j = 0; j <= l2.coordinates.length - 2; ++j) {
      const a1 = {
        x: l1.coordinates[i][1],
        y: l1.coordinates[i][0],
      };
      const a2 = {
        x: l1.coordinates[i + 1][1],
        y: l1.coordinates[i + 1][0],
      };
      const b1 = {
        x: l2.coordinates[j][1],
        y: l2.coordinates[j][0],
      };
      const b2 = {
        x: l2.coordinates[j + 1][1],
        y: l2.coordinates[j + 1][0],
      };
      const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
      const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
      const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
      if (u_b != 0) {
        const ua = ua_t / u_b;
        const ub = ub_t / u_b;
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
          intersects.push({
            type: 'Point',
            coordinates: [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)],
          });
        }
      }
    }
  }
  if (intersects.length == 0) intersects = false;
  return intersects;
};

// Bounding Box

function boundingBoxAroundPolyCoords(coords) {
  let xAll = []; let
    yAll = [];

  for (let i = 0; i < coords[0].length; i++) {
    xAll.push(coords[0][i][1]);
    yAll.push(coords[0][i][0]);
  }

  xAll = xAll.sort((a, b) => a - b);
  yAll = yAll.sort((a, b) => a - b);

  return [[xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]]];
}

gju.pointInBoundingBox = function (point, bounds) {
  return !(point.coordinates[1] < bounds[0][0] || point.coordinates[1] > bounds[1][0] || point.coordinates[0] < bounds[0][1] || point.coordinates[0] > bounds[1][1]);
};

// Point in Polygon
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices

function pnpoly(x, y, coords) {
  const vert = [[0, 0]];

  for (var i = 0; i < coords.length; i++) {
    for (var j = 0; j < coords[i].length; j++) {
      vert.push(coords[i][j]);
    }
    vert.push([0, 0]);
  }

  let inside = false;
  for (var i = 0, j = vert.length - 1; i < vert.length; j = i++) {
    if (((vert[i][0] > y) != (vert[j][0] > y)) && (x < (vert[j][1] - vert[i][1]) * (y - vert[i][0]) / (vert[j][0] - vert[i][0]) + vert[i][1])) inside = !inside;
  }

  return inside;
}

gju.pointInPolygon = function (p, poly) {
  const coords = (poly.type == 'Polygon') ? [poly.coordinates] : poly.coordinates;

  let insideBox = false;
  for (var i = 0; i < coords.length; i++) {
    if (gju.pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[i]))) insideBox = true;
  }
  if (!insideBox) return false;

  let insidePoly = false;
  for (var i = 0; i < coords.length; i++) {
    if (pnpoly(p.coordinates[1], p.coordinates[0], coords[i])) insidePoly = true;
  }

  return insidePoly;
};

gju.numberToRadius = function (number) {
  return number * Math.PI / 180;
};

gju.numberToDegree = function (number) {
  return number * 180 / Math.PI;
};

// written with help from @tautologe
gju.drawCircle = function (radiusInMeters, centerPoint, steps) {
  const center = [centerPoint.coordinates[1], centerPoint.coordinates[0]];
  const dist = (radiusInMeters / 1000) / 6371;
  // convert meters to radiant
  const radCenter = [gju.numberToRadius(center[0]), gju.numberToRadius(center[1])];
  var steps = steps || 15;
  // 15 sided circle
  const poly = [[center[0], center[1]]];
  for (let i = 0; i < steps; i++) {
    const brng = 2 * Math.PI * i / steps;
    const lat = Math.asin(Math.sin(radCenter[0]) * Math.cos(dist)
              + Math.cos(radCenter[0]) * Math.sin(dist) * Math.cos(brng));
    const lng = radCenter[1] + Math.atan2(
      Math.sin(brng) * Math.sin(dist) * Math.cos(radCenter[0]),
      Math.cos(dist) - Math.sin(radCenter[0]) * Math.sin(lat),
    );
    poly[i] = [];
    poly[i][1] = gju.numberToDegree(lat);
    poly[i][0] = gju.numberToDegree(lng);
  }
  return {
    type: 'Polygon',
    coordinates: [poly],
  };
};

// assumes rectangle starts at lower left point
gju.rectangleCentroid = function (rectangle) {
  const bbox = rectangle.coordinates[0];
  const xmin = bbox[0][0];
  const ymin = bbox[0][1];
  const xmax = bbox[2][0];
  const ymax = bbox[2][1];
  const xwidth = xmax - xmin;
  const ywidth = ymax - ymin;
  return {
    type: 'Point',
    coordinates: [xmin + xwidth / 2, ymin + ywidth / 2],
  };
};

// from http://www.movable-type.co.uk/scripts/latlong.html
gju.pointDistance = function (pt1, pt2) {
  const lon1 = pt1.coordinates[0];
  const lat1 = pt1.coordinates[1];
  const lon2 = pt2.coordinates[0];
  const lat2 = pt2.coordinates[1];
  const dLat = gju.numberToRadius(lat2 - lat1);
  const dLon = gju.numberToRadius(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(gju.numberToRadius(lat1))
        * Math.cos(gju.numberToRadius(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Earth radius is 6371 km
  return (6371 * c) * 1000; // returns meters
},

// checks if geometry lies entirely within a circle
// works with Point, LineString, Polygon
gju.geometryWithinRadius = function (geometry, center, radius) {
  if (geometry.type == 'Point') {
    return gju.pointDistance(geometry, center) <= radius;
  } if (geometry.type == 'LineString' || geometry.type == 'Polygon') {
    const point = {};
    let coordinates;
    if (geometry.type == 'Polygon') {
      // it's enough to check the exterior ring of the Polygon
      coordinates = geometry.coordinates[0];
    } else {
      coordinates = geometry.coordinates;
    }
    for (const i in coordinates) {
      point.coordinates = coordinates[i];
      if (gju.pointDistance(point, center) > radius) {
        return false;
      }
    }
  }
  return true;
};

// adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
gju.area = function (polygon) {
  let area = 0;
  // TODO: polygon holes at coordinates[1]
  const points = polygon.coordinates[0];
  let j = points.length - 1;
  var p1; var
    p2;

  for (let i = 0; i < points.length; j = i++) {
    var p1 = {
      x: points[i][1],
      y: points[i][0],
    };
    var p2 = {
      x: points[j][1],
      y: points[j][0],
    };
    area += p1.x * p2.y;
    area -= p1.y * p2.x;
  }

  area /= 2;
  return area;
},

// adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
gju.centroid = function (polygon) {
  let f; let x = 0;
  let y = 0;
  // TODO: polygon holes at coordinates[1]
  const points = polygon.coordinates[0];
  let j = points.length - 1;
  var p1; var
    p2;

  for (let i = 0; i < points.length; j = i++) {
    var p1 = {
      x: points[i][1],
      y: points[i][0],
    };
    var p2 = {
      x: points[j][1],
      y: points[j][0],
    };
    f = p1.x * p2.y - p2.x * p1.y;
    x += (p1.x + p2.x) * f;
    y += (p1.y + p2.y) * f;
  }

  f = gju.area(polygon) * 6;
  return {
    type: 'Point',
    coordinates: [y / f, x / f],
  };
},

gju.simplify = function (source, kink) { /* source[] array of geojson points */
  /* kink	in metres, kinks above this depth kept  */
  /* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
  kink = kink || 20;
  source = source.map((o) => ({
    lng: o.coordinates[0],
    lat: o.coordinates[1],
  }));

  let n_source; let n_stack; let n_dest; let start; let end; var i; let
    sig;
  let dev_sqr; let max_dev_sqr; let
    band_sqr;
  let x12; let y12; let d12; let x13; let y13; let d13; let x23; let y23; let
    d23;
  const F = (Math.PI / 180.0) * 0.5;
  const index = new Array(); /* aray of indexes of source points to include in the reduced line */
  const sig_start = new Array(); /* indices of start & end of working section */
  const sig_end = new Array();

  /* check for simple cases */

  if (source.length < 3) return (source); /* one or two points */

  /* more complex case. initialize stack */

  n_source = source.length;
  band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0); /* Now in degrees */
  band_sqr *= band_sqr;
  n_dest = 0;
  sig_start[0] = 0;
  sig_end[0] = n_source - 1;
  n_stack = 1;

  /* while the stack is not empty  ... */
  while (n_stack > 0) {
    /* ... pop the top-most entries off the stacks */

    start = sig_start[n_stack - 1];
    end = sig_end[n_stack - 1];
    n_stack--;

    if ((end - start) > 1) { /* any intermediate points ? */
      /* ... yes, so find most deviant intermediate point to
        either side of line joining start & end points */

      x12 = (source[end].lng() - source[start].lng());
      y12 = (source[end].lat() - source[start].lat());
      if (Math.abs(x12) > 180.0) x12 = 360.0 - Math.abs(x12);
      x12 *= Math.cos(F * (source[end].lat() + source[start].lat())); /* use avg lat to reduce lng */
      d12 = (x12 * x12) + (y12 * y12);

      for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {
        x13 = source[i].lng() - source[start].lng();
        y13 = source[i].lat() - source[start].lat();
        if (Math.abs(x13) > 180.0) x13 = 360.0 - Math.abs(x13);
        x13 *= Math.cos(F * (source[i].lat() + source[start].lat()));
        d13 = (x13 * x13) + (y13 * y13);

        x23 = source[i].lng() - source[end].lng();
        y23 = source[i].lat() - source[end].lat();
        if (Math.abs(x23) > 180.0) x23 = 360.0 - Math.abs(x23);
        x23 *= Math.cos(F * (source[i].lat() + source[end].lat()));
        d23 = (x23 * x23) + (y23 * y23);

        if (d13 >= (d12 + d23)) dev_sqr = d23;
        else if (d23 >= (d12 + d13)) dev_sqr = d13;
        else dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12; // solve triangle
        if (dev_sqr > max_dev_sqr) {
          sig = i;
          max_dev_sqr = dev_sqr;
        }
      }

      if (max_dev_sqr < band_sqr) { /* is there a sig. intermediate point ? */
        /* ... no, so transfer current start point */
        index[n_dest] = start;
        n_dest++;
      } else { /* ... yes, so push two sub-sections on stack for further processing */
        n_stack++;
        sig_start[n_stack - 1] = sig;
        sig_end[n_stack - 1] = end;
        n_stack++;
        sig_start[n_stack - 1] = start;
        sig_end[n_stack - 1] = sig;
      }
    } else { /* ... no intermediate points, so transfer current start point */
      index[n_dest] = start;
      n_dest++;
    }
  }

  /* transfer last point */
  index[n_dest] = n_source - 1;
  n_dest++;

  /* make return array */
  const r = new Array();
  for (var i = 0; i < n_dest; i++) { r.push(source[index[i]]); }

  return r.map((o) => ({
    type: 'Point',
    coordinates: [o.lng, o.lat],
  }));
};

// http://www.movable-type.co.uk/scripts/latlong.html#destPoint
gju.destinationPoint = function (pt, brng, dist) {
  dist /= 6371; // convert dist to angular distance in radians
  brng = gju.numberToRadius(brng);

  const lat1 = gju.numberToRadius(pt.coordinates[0]);
  const lon1 = gju.numberToRadius(pt.coordinates[1]);

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist)
                          + Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));
  let lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
    Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2),
  );
  lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180º

  return {
    type: 'Point',
    coordinates: [gju.numberToDegree(lat2), gju.numberToDegree(lon2)],
  };
};
