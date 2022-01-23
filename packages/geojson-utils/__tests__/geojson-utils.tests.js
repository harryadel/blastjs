import { gju } from '../src/geojson-utils';

test('geojson-utils - line intersects', () => {
  const diagonalUp = {
    type: 'LineString',
    coordinates: [
      [0, 0], [10, 10],
    ],
  };
  const diagonalDown = {
    type: 'LineString',
    coordinates: [
      [10, 0], [0, 10],
    ],
  };
  const farAway = {
    type: 'LineString',
    coordinates: [
      [100, 100], [110, 110],
    ],
  };

  expect(gju.lineStringsIntersect(diagonalUp, diagonalDown)).toBeTruthy();
  expect(gju.lineStringsIntersect(diagonalUp, farAway)).toBeFalsy();
});

// Used by two tests
const box = {
  type: 'Polygon',
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10]],
  ],
};

test('geojson-utils - inside/outside of the box', () => {
  const inBox = { type: 'Point', coordinates: [5, 5] };
  const outBox = { type: 'Point', coordinates: [15, 15] };

  expect(gju.pointInPolygon(inBox, box)).toBeTruthy();
  expect(gju.pointInPolygon(outBox, box)).toBeFalsy();
});

test('geojson-utils - drawCircle', () => {
  expect(gju.drawCircle(10, { type: 'Point', coordinates: [0, 0] })
    .coordinates[0].length).toEqual(15);
  expect(gju.drawCircle(10, { type: 'Point', coordinates: [0, 0] }, 50)
    .coordinates[0].length).toEqual(50);
});

test('geojson-utils - centroid', () => {
  const centroid = gju.rectangleCentroid(box);
  expect(centroid.coordinates[0]).toEqual(5);
  expect(centroid.coordinates[1]).toEqual(5);
});

test('geojson-utils - point distance', () => {
  const fairyLand = {
    type: 'Point',
    coordinates: [-122.260000705719, 37.80919060818706],
  };
  const navalBase = {
    type: 'Point',
    coordinates: [-122.32083320617676, 37.78774223089045],
  };
  expect(Math.floor(gju.pointDistance(fairyLand, navalBase))).toEqual(5852);
});

test('geojson-utils - points distance generated tests', () => {
  // Pairs of points we will be looking a distance between
  const tests = [[[-19.416501816827804, -13.442164216190577], [8.694866622798145, -8.511979941977188]],
    [[151.2841189110186, -56.14564002258703], [167.77983197313733, 0.05544793023727834]],
    [[100.28413630579598, -88.02313695591874], [36.48786173714325, 53.44207073468715]],
    [[-70.34899035631679, 76.51596869179048], [154.91605914011598, -73.60970971290953]],
    [[96.28682994353585, 58.77288202662021], [-118.33936230326071, 72.07877089688554]],
    [[140.35530551429838, 10.507104953983799], [-67.73368513956666, 38.075836981181055]],
    [[69.55582775664516, 86.25450283149257], [-18.446230484172702, 6.116170521359891]],
    [[163.83647522330284, -65.7211532376241], [-159.2198902608361, -78.42975475382991]],
    [[-178.9383797585033, -54.87420454365201], [-175.35227065649815, -84.04084282391705]],
    [[-48.63219943456352, 11.284161149058491], [-179.12627786491066, -51.95622375886887]],
    [[140.29684206470847, -67.20720696030185], [-109.37452355003916, 36.03131077555008]],
    [[-154.6698773431126, 58.322094617411494], [61.18583445576951, -4.3424885796848685]],
    [[122.5562841903884, 10.43972848681733], [-11.756078708684072, -43.86124441982247]],
    [[-67.91648306301795, -86.38826347864233], [163.577536230674, 12.987319261068478]],
    [[91.65140007715672, 17.595150742679834], [135.80393003183417, 22.307532118167728]],
    [[-112.70280818711035, 34.45729674655013], [-127.42168210959062, -25.51327457977459]],
    [[-161.55807900894433, -77.40711871231906], [-92.66313794790767, -89.12077954714186]],
    [[39.966264681424946, 9.890176948625594], [-159.88646019320004, 40.60383598925546]],
    [[-57.48232689569704, 86.64061016729102], [59.53941993578337, -75.73194969259202]],
    [[-142.0938081513159, 80.76813141163439], [14.891517050098628, 64.56322408467531]]];

  // correct distance between two points
  const answers = [3115066.2536578891, 6423493.2321747802, 15848950.0402601473,
    18714226.5425080135, 5223022.7731127860, 13874476.3135112207,
    9314403.3309389465, 1831929.5917785936, 3244710.9344544266,
    13691492.4666933995, 14525055.6462231465, 13261602.4336371962,
    14275427.5511620939, 11699799.3615680672, 4628773.1129429890,
    6846704.0253010122, 1368055.9401701286, 14041503.0409814864,
    18560499.7346975356, 3793112.6186894816];
  function toGeoJSONPoint(coordinates) {
    return { type: 'Point', coordinates };
  }

  tests.forEach(function (pair, testN) {
    const distance = gju.pointDistance.apply(this, pair.map(toGeoJSONPoint));
    expect(
      Math.abs(distance - answers[testN]) < 0.000001,
    ).toBeTruthy();
  });
});
