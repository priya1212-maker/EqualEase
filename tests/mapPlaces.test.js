import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { samplePlaces } from '../data/samplePlaces.js';
import { getMappablePlaces, getWheelchairMarkerStatus, hasValidCoordinates } from '../data/mapPlaces.js';
import { requestCurrentForegroundLocation } from '../services/currentLocation.js';

test('sample place records stay off-map because they have no real coordinates', () => {
  assert.deepEqual(getMappablePlaces(samplePlaces), []);
});

test('only valid latitude and longitude pairs become map markers', () => {
  const places = [
    { id: 'valid', coordinates: { latitude: 12.9, longitude: 77.5 } },
    { id: 'missing', coordinates: null },
    { id: 'invalid-latitude', coordinates: { latitude: 95, longitude: 77.5 } },
    { id: 'invalid-longitude', coordinates: { latitude: 12.9, longitude: -190 } },
  ];
  assert.equal(hasValidCoordinates(places[0]), true);
  assert.deepEqual(getMappablePlaces(places).map((place) => place.id), ['valid']);
});

test('marker colors imply wheelchair confirmation only for explicitly verified yes/no records', () => {
  assert.equal(getWheelchairMarkerStatus({ informationSource: { verified: true }, accessibility: { wheelchairAccess: 'yes' } }), 'yes');
  assert.equal(getWheelchairMarkerStatus({ informationSource: { verified: true }, accessibility: { wheelchairAccess: 'no' } }), 'no');
  assert.equal(getWheelchairMarkerStatus({ informationSource: { verified: false }, accessibility: { wheelchairAccess: 'yes' } }), 'unknown');
  assert.equal(getWheelchairMarkerStatus({ informationSource: { verified: true }, accessibility: { wheelchairAccess: 'unknown' } }), 'unknown');
  assert.equal(getWheelchairMarkerStatus({ informationSource: { verified: true }, accessibility: { wheelchairAccess: 'notApplicable' } }), 'unknown');
});

test('Explore provides an accessible map/list switch and requests location only from its button handler', () => {
  const source = readFileSync(new URL('../app/(tabs)/explore/index.js', import.meta.url), 'utf8');
  assert.match(source, /accessibilityLabel="Map view"/);
  assert.match(source, /accessibilityLabel="List view"/);
  assert.match(source, /onPress=\{useMyLocation\}/);
  assert.match(source, /requestCurrentForegroundLocation\(Location\)/);
  assert.doesNotMatch(source, /useEffect\([^]*requestForegroundPermissionsAsync/);
});

test('location permission is not requested when it was already granted', async () => {
  let permissionRequests = 0;
  const result = await requestCurrentForegroundLocation({
    Accuracy: { Balanced: 'balanced' },
    getForegroundPermissionsAsync: async () => ({ granted: true, status: 'granted' }),
    requestForegroundPermissionsAsync: async () => { permissionRequests += 1; return { granted: true }; },
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: async () => ({ coords: { latitude: 1, longitude: 2 } }),
  });
  assert.equal(permissionRequests, 0);
  assert.deepEqual(result, { status: 'granted', coords: { latitude: 1, longitude: 2 } });
});

test('permanently denied permission and disabled location services return recoverable states', async () => {
  let permissionRequests = 0;
  const denied = await requestCurrentForegroundLocation({
    getForegroundPermissionsAsync: async () => ({ granted: false, status: 'denied', canAskAgain: false }),
    requestForegroundPermissionsAsync: async () => { permissionRequests += 1; return { granted: false }; },
  });
  assert.equal(denied.status, 'permanentlyDenied');
  assert.equal(permissionRequests, 0);

  const disabled = await requestCurrentForegroundLocation({
    Accuracy: { Balanced: 'balanced' },
    getForegroundPermissionsAsync: async () => ({ granted: true, status: 'granted' }),
    hasServicesEnabledAsync: async () => false,
    getCurrentPositionAsync: async () => { throw new Error('should not request'); },
  });
  assert.equal(disabled.status, 'servicesDisabled');
});

test('denied and unavailable location requests preserve the manual-search fallback', async () => {
  const denied = await requestCurrentForegroundLocation({
    getForegroundPermissionsAsync: async () => ({ granted: false, status: 'undetermined', canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => ({ granted: false, status: 'denied', canAskAgain: true }),
  });
  assert.equal(denied.status, 'denied');

  const unavailable = await requestCurrentForegroundLocation({
    getForegroundPermissionsAsync: async () => { throw new Error('location unavailable'); },
  });
  assert.equal(unavailable.status, 'unavailable');
});

test('map marker selection uses the existing details route', () => {
  const source = readFileSync(new URL('../components/PlacesMap.native.js', import.meta.url), 'utf8');
  assert.match(source, /onPress=\{\(\) => onSelectPlace\(place\)\}/);
  const exploreSource = readFileSync(new URL('../app/(tabs)/explore/index.js', import.meta.url), 'utf8');
  assert.match(exploreSource, /pathname: '\/explore\/place\/\[id\]'/);
});

test('web uses React Leaflet/OpenStreetMap and keeps the native map package out of the browser module', () => {
  const webSource = readFileSync(new URL('../components/PlacesMap.web.js', import.meta.url), 'utf8');
  assert.match(webSource, /MapContainer/);
  assert.match(webSource, /tile\.openstreetmap\.org/);
  assert.match(webSource, /Search this area/);
  assert.match(webSource, /wheelchair access/);
  assert.doesNotMatch(webSource, /react-native-maps|PROVIDER_GOOGLE/);
});
