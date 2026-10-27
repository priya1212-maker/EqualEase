import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ACCESSIBILITY_STATUSES,
  ACCESSIBILITY_FEATURES,
  ALL_CATEGORIES,
  filterPlaces,
  getSamplePlaceById,
  getFeatureStatus,
  PLACE_CATEGORIES,
  samplePlaces,
  toggleSavedPlaceId,
} from '../data/samplePlaces.js';

test('search matches place names without case sensitivity', () => {
  assert.deepEqual(
    filterPlaces(samplePlaces, 'CORNER CAFE').map((place) => place.id),
    ['sample-cafe-north'],
  );
});

test('search matches category and location text', () => {
  assert.equal(filterPlaces(samplePlaces, 'cafes').length, 2);
  assert.equal(filterPlaces(samplePlaces, 'riverside quarter').length, 1);
});

test('category filters return only the selected category', () => {
  for (const category of new Set(samplePlaces.map((place) => place.category))) {
    const matches = filterPlaces(samplePlaces, '', category);
    assert.ok(matches.length > 0, `expected sample places for ${category}`);
    assert.ok(matches.every((place) => place.category === category));
  }
  assert.deepEqual(filterPlaces(samplePlaces, '', 'Hospitals & clinics').map((place) => place.category), ['Hospitals']);
  assert.deepEqual(filterPlaces(samplePlaces, '', 'Colleges & universities').map((place) => place.category), ['Colleges']);
  for (const category of ['Shopping malls', 'Parks & public places', 'Transport', 'Hotels & attractions']) {
    assert.ok(PLACE_CATEGORIES.includes(category));
  }
});

test('a query with no matches returns an empty list for the empty state', () => {
  assert.deepEqual(filterPlaces(samplePlaces, 'no such sample place'), []);
});

test('clearing the query and category restores the full sample list', () => {
  assert.deepEqual(filterPlaces(samplePlaces, '', ALL_CATEGORIES), samplePlaces);
});

test('place detail lookup resolves known sample IDs and rejects unknown IDs', () => {
  assert.equal(getSamplePlaceById('sample-cafe-north').name, 'Sample Corner Cafe');
  assert.equal(getSamplePlaceById('missing-place'), undefined);
});

test('missing accessibility information is presented as Unknown', () => {
  assert.equal(getFeatureStatus({ accessibility: {} }, 'wheelchairRamp'), 'unknown');
  assert.equal(getFeatureStatus(samplePlaces[0], 'doorwayAccessibility'), 'unknown');
});

test('all requested accessibility features resolve to a supported status', () => {
  assert.deepEqual(
    ACCESSIBILITY_FEATURES.map((feature) => feature.key),
    ['stepFreeEntrance', 'wheelchairRamp', 'elevator', 'accessibleWashroom', 'accessibleParking', 'doorwayAccessibility'],
  );
  for (const place of samplePlaces) {
    for (const feature of ACCESSIBILITY_FEATURES) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(ACCESSIBILITY_STATUSES, getFeatureStatus(place, feature.key)),
        `${place.id} / ${feature.key} should have a supported status`,
      );
    }
  }
});

test('saved place IDs can be added and removed', () => {
  const added = toggleSavedPlaceId([], 'sample-cafe-north');
  assert.deepEqual(added, ['sample-cafe-north']);
  assert.deepEqual(toggleSavedPlaceId(added, 'sample-cafe-north'), []);
});

test('the sample data uses all four explicit accessibility statuses', () => {
  const usedStatuses = new Set(
    samplePlaces.flatMap((place) => Object.values(place.accessibility)),
  );
  assert.deepEqual([...usedStatuses].sort(), Object.keys(ACCESSIBILITY_STATUSES).sort());
});

test('the dynamic place detail route exists and consumes its place ID', () => {
  const routeFile = new URL('../app/(tabs)/explore/place/[id].js', import.meta.url);
  assert.equal(statSync(routeFile).isFile(), true);
  const routeSource = readFileSync(fileURLToPath(routeFile), 'utf8');
  assert.match(routeSource, /useLocalSearchParams/);
  assert.match(routeSource, /places\.find\(\(item\) => item\.id === placeId\)/);
});

test('a Saved Places route exists for locally saved sample places', () => {
  const routeFile = new URL('../app/(tabs)/saved.js', import.meta.url);
  assert.equal(statSync(routeFile).isFile(), true);
  const routeSource = readFileSync(fileURLToPath(routeFile), 'utf8');
  assert.match(routeSource, /savedPlaceIds/);
});

test('Explore and Place Details both expose save and remove actions', () => {
  const exploreSource = readFileSync(new URL('../app/(tabs)/explore/index.js', import.meta.url), 'utf8');
  const detailsSource = readFileSync(new URL('../app/(tabs)/explore/place/[id].js', import.meta.url), 'utf8');
  assert.match(exploreSource, /toggleSavedPlace/);
  assert.match(exploreSource, /onToggleSaved/);
  assert.match(detailsSource, /toggleSavedPlace\(place\.id\)/);
});

test('Saved Places opens the selected place detail route', () => {
  const routeSource = readFileSync(new URL('../app/(tabs)/saved.js', import.meta.url), 'utf8');
  assert.match(routeSource, /pathname: '\/explore\/place\/\[id\]'/);
  assert.match(routeSource, /params: \{ id: item\.id \}/);
});

test('report form is reachable from Explore and Place Details', () => {
  const exploreSource = readFileSync(new URL('../app/(tabs)/explore/index.js', import.meta.url), 'utf8');
  const detailsSource = readFileSync(new URL('../app/(tabs)/explore/place/[id].js', import.meta.url), 'utf8');
  const reportRoute = new URL('../app/(tabs)/report.js', import.meta.url);
  assert.equal(statSync(reportRoute).isFile(), true);
  assert.match(exploreSource, /router\.push\('\/report'\)/);
  assert.match(detailsSource, /pathname: '\/report'/);
});

test('report form prevents repeat submission while storing and shows a local confirmation', () => {
  const reportSource = readFileSync(new URL('../app/(tabs)/report.js', import.meta.url), 'utf8');
  assert.match(reportSource, /submittingRef\.current/);
  assert.match(reportSource, /disabled=\{isSubmitting \|\| isUserReportsLoading/);
  assert.match(reportSource, /Report saved on this device/);
});
