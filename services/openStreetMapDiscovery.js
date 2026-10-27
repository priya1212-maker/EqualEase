const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const overpassCache = new Map();
const geocodeCache = new Map();
let lastGeocodeAt = 0;

const CATEGORY_QUERIES = [
  'nwr["amenity"~"restaurant|cafe|fast_food|food_court"]',
  'nwr["amenity"~"hospital|clinic|doctors|dentist"]',
  'nwr["amenity"~"college|university"]',
  'nwr["shop"="mall"]',
  'nwr["leisure"~"park|garden|playground|recreation_ground"]',
  'nwr["public_transport"~"station|platform|stop_position"]',
  'nwr["railway"~"station|subway_entrance|tram_stop"]',
  'nwr["highway"="bus_stop"]',
  'nwr["tourism"~"hotel|hostel|guest_house|attraction|museum|gallery"]',
];

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function addressFromTags(tags) {
  return [
    tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'],
    tags['addr:city'], tags['addr:postcode'],
  ].filter(Boolean).join(', ');
}

function categoryFromTags(tags) {
  const amenity = tags.amenity;
  if (['restaurant', 'cafe', 'fast_food', 'food_court'].includes(amenity)) return amenity === 'cafe' ? 'Cafes' : 'Restaurants';
  if (['hospital', 'clinic', 'doctors', 'dentist'].includes(amenity)) return 'Hospitals & clinics';
  if (['college', 'university'].includes(amenity)) return 'Colleges & universities';
  if (tags.shop === 'mall') return 'Shopping malls';
  if (['park', 'garden', 'playground', 'recreation_ground'].includes(tags.leisure)) return 'Parks & public places';
  if (['station', 'platform', 'stop_position'].includes(tags.public_transport)
    || ['station', 'subway_entrance', 'tram_stop'].includes(tags.railway)
    || tags.highway === 'bus_stop') return 'Transport';
  if (['hotel', 'hostel', 'guest_house', 'attraction', 'museum', 'gallery'].includes(tags.tourism)) return 'Hotels & attractions';
  return 'Public Places';
}

function yesNoUnknown(value) {
  if (['yes', 'designated'].includes(value)) return 'yes';
  if (value === 'no') return 'no';
  return 'unknown';
}

export function normalizeOpenStreetMapElement(element) {
  const tags = element.tags ?? {};
  const name = tags.name || tags['name:en'];
  const latitude = Number.isFinite(element.lat) ? element.lat : element.center?.lat;
  const longitude = Number.isFinite(element.lon) ? element.lon : element.center?.lon;
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const rawWheelchair = tags.wheelchair;
  const wheelchairAccess = yesNoUnknown(rawWheelchair);
  const accessibleParking = Number(tags['capacity:disabled']) > 0
    ? 'yes'
    : tags['capacity:disabled'] === '0' ? 'no' : 'unknown';
  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category: categoryFromTags(tags),
    location: addressFromTags(tags) || tags['addr:full'] || 'Address unavailable',
    coordinates: { latitude, longitude },
    accessibility: {
      wheelchairAccess,
      stepFreeEntrance: yesNoUnknown(tags['entrance:wheelchair']),
      wheelchairRamp: yesNoUnknown(tags['ramp:wheelchair']),
      elevator: yesNoUnknown(tags['elevator:wheelchair']),
      accessibleWashroom: yesNoUnknown(tags['toilets:wheelchair']),
      accessibleParking,
      doorwayAccessibility: 'unknown',
    },
    sourceDetails: {
      wheelchairTag: rawWheelchair || null,
      wheelchairDescription: tags['wheelchair:description'] || null,
    },
    informationSource: { type: 'openStreetMap', label: 'OpenStreetMap community data (unverified)', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
  };
}

export function buildOverpassQuery(bounds) {
  const { south, west, north, east, zoom } = bounds ?? {};
  if (![south, west, north, east, zoom].every(Number.isFinite)
    || south < -90 || north > 90 || west < -180 || east > 180
    || south >= north || west >= east) {
    throw new Error('Map area is not available yet. Move or zoom the map, then try again.');
  }
  if (zoom < 13 || north - south > 0.2 || east - west > 0.2) {
    throw new Error('Zoom in closer to search a smaller area. This keeps OpenStreetMap queries focused and responsive.');
  }
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:20];(${CATEGORY_QUERIES.map((selector) => `${selector}(${bbox});`).join('')});out center tags 160;`;
}

export async function searchOpenStreetMapArea(bounds, fetcher = fetch) {
  const query = buildOverpassQuery(bounds);
  const cacheKey = query;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 60_000) return cached.places;

  const controller = timeoutSignal(25_000);
  try {
    const endpoint = process.env.EXPO_PUBLIC_OSM_OVERPASS_URL || DEFAULT_OVERPASS_URL;
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 429 || response.status === 406) {
        throw new Error('OpenStreetMap search is busy. Please wait 30 seconds, then try again.');
      }
      throw new Error('OpenStreetMap could not load this area. Try again in a little while.');
    }
    const payload = await response.json();
    const places = (payload.elements ?? []).map(normalizeOpenStreetMapElement).filter(Boolean);
    overpassCache.set(cacheKey, { at: Date.now(), places });
    return places;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('OpenStreetMap search took too long. Zoom in or try again later.');
    throw error;
  } finally {
    controller.clear();
  }
}

export async function geocodeOpenStreetMapLocation(text, fetcher = fetch) {
  const query = String(text ?? '').trim();
  if (!query) throw new Error('Enter a place or location to search.');
  if (query.length > 120) throw new Error('Keep the location search under 120 characters.');
  const cacheKey = query.toLocaleLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  const waitMs = Math.max(0, 1_100 - (Date.now() - lastGeocodeAt));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastGeocodeAt = Date.now();
  const endpoint = new URL(process.env.EXPO_PUBLIC_OSM_NOMINATIM_URL || DEFAULT_NOMINATIM_URL);
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('limit', '1');
  const response = await fetcher(endpoint.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Location search is unavailable. Move the map manually and try again.');
  const results = await response.json();
  if (!results.length) throw new Error('No matching location was found. Try a nearby town or address.');
  const result = {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
    label: results[0].display_name,
  };
  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw new Error('The location result did not include usable coordinates.');
  }
  geocodeCache.set(cacheKey, result);
  return result;
}
