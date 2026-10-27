import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOverpassQuery,
  geocodeOpenStreetMapLocation,
  normalizeOpenStreetMapElement,
  searchOpenStreetMapArea,
} from '../services/openStreetMapDiscovery.js';

const sampleBounds = { south: 12.96, west: 77.58, north: 12.98, east: 77.60, zoom: 14 };

test('Overpass searches are restricted to a close, valid map area', () => {
  assert.match(buildOverpassQuery(sampleBounds), /\[timeout:20\]/);
  assert.match(buildOverpassQuery(sampleBounds), /160/);
  assert.throws(() => buildOverpassQuery({ ...sampleBounds, zoom: 8 }), /Zoom in closer/);
  assert.throws(() => buildOverpassQuery({ ...sampleBounds, east: 179 }), /Zoom in closer/);
  assert.throws(() => buildOverpassQuery({ ...sampleBounds, north: 91 }), /Map area is not available/);
});

test('OSM wheelchair tags remain explicitly unverified and missing tags stay Unknown', () => {
  const accessible = normalizeOpenStreetMapElement({
    type: 'node', id: 1, lat: 12.97, lon: 77.59,
    tags: { name: 'Example Cafe', amenity: 'cafe', wheelchair: 'yes', 'addr:city': 'Sample City' },
  });
  assert.equal(accessible.name, 'Example Cafe');
  assert.equal(accessible.category, 'Cafes');
  assert.equal(accessible.location, 'Sample City');
  assert.equal(accessible.accessibility.wheelchairAccess, 'yes');
  assert.equal(accessible.accessibility.stepFreeEntrance, 'unknown');
  assert.equal(accessible.informationSource.verified, false);
  assert.equal(accessible.lastVerifiedAt, null);

  const limited = normalizeOpenStreetMapElement({
    type: 'way', id: 2, center: { lat: 12.97, lon: 77.59 }, tags: { name: 'Limited Access Site', wheelchair: 'limited' },
  });
  assert.equal(limited.accessibility.wheelchairAccess, 'unknown');
  assert.equal(limited.sourceDetails.wheelchairTag, 'limited');
  assert.equal(normalizeOpenStreetMapElement({ type: 'node', id: 3, lat: 12.9, lon: 77.6, tags: { amenity: 'cafe' } }), null);
});

test('Overpass results use an area query and are cached briefly', async () => {
  let requests = 0;
  let requestOptions;
  const mockFetch = async (url, options) => {
    requests += 1;
    requestOptions = { url, options };
    return {
      ok: true,
      json: async () => ({ elements: [{
        type: 'node', id: 80731, lat: 12.97, lon: 77.59,
        tags: { name: 'Map Test Cafe', amenity: 'cafe' },
      }] }),
    };
  };
  const first = await searchOpenStreetMapArea(sampleBounds, mockFetch);
  const second = await searchOpenStreetMapArea(sampleBounds, mockFetch);
  assert.equal(requests, 1);
  assert.equal(requestOptions.options.method, 'POST');
  assert.match(requestOptions.options.body, /data=/);
  assert.equal(first[0].id, 'osm-node-80731');
  assert.deepEqual(second, first);
});

test('manual location search geocodes only the submitted query and caches the result', async () => {
  let requests = 0;
  let requestedUrl;
  const mockFetch = async (url) => {
    requests += 1;
    requestedUrl = new URL(url);
    return { ok: true, json: async () => [{ lat: '12.97', lon: '77.59', display_name: 'Sample City' }] };
  };
  const result = await geocodeOpenStreetMapLocation('Sample City', mockFetch);
  const cached = await geocodeOpenStreetMapLocation('sample city', mockFetch);
  assert.equal(requests, 1);
  assert.equal(requestedUrl.searchParams.get('q'), 'Sample City');
  assert.deepEqual(result, { latitude: 12.97, longitude: 77.59, label: 'Sample City' });
  assert.deepEqual(cached, result);
});
