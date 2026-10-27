import { useEffect, useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PlacesMap.web.css';
import { ACCESSIBILITY_FEATURES, getFeatureStatus } from '../data/samplePlaces';
import { getWheelchairMarkerStatus } from '../data/mapPlaces';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, spacing } from '../theme';

const DEFAULT_CENTER = [20, 0];
const CATEGORY_OPTIONS = [
  'All categories', 'Restaurants & cafes', 'Hospitals & clinics', 'Colleges & universities',
  'Shopping malls', 'Parks & public spaces', 'Transport', 'Hotels & attractions',
];
const ACCESSIBILITY_OPTIONS = [
  { value: 'all', label: 'All accessibility data' },
  { value: 'yes', label: 'Reported wheelchair access: Yes' },
  { value: 'no', label: 'Reported wheelchair access: No' },
  { value: 'unknown', label: 'Wheelchair access: Unknown' },
];

function categoryMatches(place, selected) {
  if (selected === 'All categories') return true;
  const category = String(place.category ?? '');
  if (selected === 'Restaurants & cafes') return category === 'Restaurants' || category === 'Cafes';
  if (selected === 'Hospitals & clinics') return category === 'Hospitals & clinics' || category === 'Hospitals';
  if (selected === 'Colleges & universities') return category === 'Colleges & universities' || category === 'Colleges';
  if (selected === 'Parks & public spaces') return category === 'Parks & public places' || category === 'Public Places';
  if (selected === 'Hotels & attractions') return category === 'Hotels & attractions';
  return category === selected;
}

function mapStatus(place) {
  const explicit = place?.accessibility?.wheelchairAccess;
  if (['yes', 'no', 'unknown', 'notApplicable'].includes(explicit)) return explicit;
  if (place?.sourceDetails?.wheelchairTag === 'limited') return 'unknown';
  return getFeatureStatus(place, 'wheelchairAccess');
}

function markerClass(place) {
  return getWheelchairMarkerStatus(place);
}

function statusLabel(status) {
  if (status === 'yes') return 'Yes';
  if (status === 'no') return 'No';
  if (status === 'notApplicable') return 'Not applicable';
  return 'Unknown';
}

function markerIcon(place) {
  const state = markerClass(place);
  return divIcon({
    className: `equalease-marker equalease-marker--${state}`,
    html: '<span aria-hidden="true"></span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function popupFeatureStatus(place, featureKey) {
  const value = place?.accessibility?.[featureKey] ?? 'unknown';
  return statusLabel(value);
}

function PlacePopup({ place, onOpenDetails }) {
  const status = mapStatus(place);
  const isOsm = place.informationSource?.type === 'openStreetMap';
  return (
    <div className="equalease-popup">
      <h3>{place.name || 'Place name unavailable'}</h3>
      <p className="equalease-popup-category">{place.category || 'Category unavailable'}</p>
      <p>{place.location || 'Address unavailable'}</p>
      <p><strong>Wheelchair access:</strong> {statusLabel(status)}{isOsm ? ' (unverified community tag)' : ''}</p>
      {isOsm && place.sourceDetails?.wheelchairTag === 'limited' ? (
        <p>OpenStreetMap records limited access; EqualEase does not treat that as a Yes or No.</p>
      ) : null}
      <ul>
        {ACCESSIBILITY_FEATURES.map((feature) => (
          <li key={feature.key}><strong>{feature.label}:</strong> {popupFeatureStatus(place, feature.key)}</li>
        ))}
      </ul>
      <p><strong>Information source:</strong> {place.informationSource?.label || 'Unavailable'}</p>
      <p><strong>Verification:</strong> {place.informationSource?.verified ? 'Verified record' : 'Unverified community or development information'}</p>
      <p><strong>Last verified:</strong> {place.lastVerifiedAt ? new Date(place.lastVerifiedAt).toLocaleDateString() : 'Not available'}</p>
      {isOsm ? <p className="equalease-popup-note">OpenStreetMap data is community-maintained. Missing tags are Unknown, not No.</p> : null}
      {onOpenDetails ? <button type="button" onClick={() => onOpenDetails(place)}>Open EqualEase details</button> : null}
    </div>
  );
}

function MapController({ userLocation, selectedPlace, onBoundsChange }) {
  const map = useMap();
  useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      const center = map.getCenter();
      onBoundsChange({ south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast(), zoom: map.getZoom(), center: { latitude: center.lat, longitude: center.lng } });
    },
    zoomend() {
      const bounds = map.getBounds();
      const center = map.getCenter();
      onBoundsChange({ south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast(), zoom: map.getZoom(), center: { latitude: center.lat, longitude: center.lng } });
    },
  });
  useEffect(() => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onBoundsChange({ south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast(), zoom: map.getZoom(), center: { latitude: center.lat, longitude: center.lng } });
  }, [map, onBoundsChange]);
  useEffect(() => {
    if (userLocation) map.flyTo([userLocation.latitude, userLocation.longitude], 14, { duration: 0.6 });
  }, [map, userLocation]);
  useEffect(() => {
    const coordinates = selectedPlace?.coordinates;
    if (coordinates) map.flyTo([coordinates.latitude, coordinates.longitude], 16, { duration: 0.6 });
  }, [map, selectedPlace]);
  return null;
}

export function PlacesMap({
  places = [], osmPlaces = [], userLocation, selectedPlace, mapBounds,
  onBoundsChange = () => {}, onSearchArea = () => {}, isSearchingArea = false,
  searchError, searchText = '', onSelectPlace, height,
}) {
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [accessibilityFilter, setAccessibilityFilter] = useState('all');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationError, setLocationError] = useState(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [geocodedCenter, setGeocodedCenter] = useState(null);
  useEffect(() => {
    if (userLocation) setGeocodedCenter(null);
  }, [userLocation]);
  const initialPlace = places.find((place) => place.coordinates);
  const initialCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : mapBounds?.center
      ? [mapBounds.center.latitude, mapBounds.center.longitude]
    : initialPlace
      ? [initialPlace.coordinates.latitude, initialPlace.coordinates.longitude]
      : DEFAULT_CENTER;
  const initialZoom = userLocation || initialPlace ? 14 : mapBounds?.zoom ?? 2;
  const search = searchText.trim().toLocaleLowerCase();
  const combinedPlaces = useMemo(() => [...places, ...osmPlaces], [places, osmPlaces]);
  const visiblePlaces = useMemo(() => combinedPlaces.filter((place) => {
    const searchable = `${place.name ?? ''} ${place.category ?? ''} ${place.location ?? ''}`.toLocaleLowerCase();
    const categoryOk = categoryMatches(place, selectedCategory);
    const queryOk = !search || searchable.includes(search);
    const status = mapStatus(place);
    const accessOk = accessibilityFilter === 'all' || status === accessibilityFilter;
    return categoryOk && queryOk && accessOk;
  }), [combinedPlaces, selectedCategory, search, accessibilityFilter]);

  async function searchLocation() {
    setLocationError(null);
    setIsSearchingLocation(true);
    try {
      const { geocodeOpenStreetMapLocation } = await import('../services/openStreetMapDiscovery');
      const result = await geocodeOpenStreetMapLocation(locationQuery);
      setGeocodedCenter(result);
    } catch (error) {
      setLocationError(error.message || 'Location search is unavailable.');
    } finally {
      setIsSearchingLocation(false);
    }
  }

  const focus = geocodedCenter ?? userLocation;

  return (
    <div className="equalease-map-shell" style={{ minHeight: height }}>
      <div className="equalease-map-toolbar" aria-label="Map search and filters">
        <form className="equalease-location-search" onSubmit={(event) => { event.preventDefault(); searchLocation(); }}>
          <label className="equalease-sr-only" htmlFor="equalease-location-query">Search a place or location</label>
          <input id="equalease-location-query" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search a place or location" maxLength={120} />
          <button type="submit" disabled={isSearchingLocation || !locationQuery.trim()}>{isSearchingLocation ? 'Searching…' : 'Find location'}</button>
        </form>
        <div className="equalease-map-filter-row">
          <label htmlFor="equalease-map-category">Category</label>
          <select id="equalease-map-category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            {CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}
          </select>
          <label htmlFor="equalease-map-access">Accessibility</label>
          <select id="equalease-map-access" value={accessibilityFilter} onChange={(event) => setAccessibilityFilter(event.target.value)}>
            {ACCESSIBILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" className="equalease-reset-map-filters" onClick={() => { setSelectedCategory('All categories'); setAccessibilityFilter('all'); }}>Reset map filters</button>
          <button type="button" className="equalease-search-area" disabled={!mapBounds || mapBounds.zoom < 13 || isSearchingArea} onClick={() => onSearchArea(mapBounds)}>
            {isSearchingArea ? 'Searching this area…' : 'Search this area'}
          </button>
        </div>
        <p className="equalease-map-hint">Find location sends your submitted search to OpenStreetMap. Search this area sends the visible map bounds to OpenStreetMap. Results depend on community mapping and are not EqualEase-verified; EqualEase does not save your precise device location.</p>
        {locationError ? <p role="alert" className="equalease-map-error">{locationError}</p> : null}
        {searchError ? <p role="alert" className="equalease-map-error">{searchError}</p> : null}
        <p className="equalease-map-count" aria-live="polite">{visiblePlaces.length} mapped places · OSM results are not verification</p>
      </div>
      <div className="equalease-leaflet-frame" role="region" aria-label="Interactive OpenStreetMap with place markers">
        <MapContainer center={initialCenter} zoom={initialZoom} scrollWheelZoom className="equalease-leaflet-map">
          <MapController userLocation={focus} selectedPlace={selectedPlace} onBoundsChange={onBoundsChange} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userLocation ? (
            <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={8} pathOptions={{ color: '#321C60', fillColor: '#5B35A8', fillOpacity: 1 }}>
              <Popup>Your current location</Popup>
            </CircleMarker>
          ) : null}
          {visiblePlaces.map((place) => {
            if (!place.coordinates) return null;
            const isApplicationRecord = places.some((item) => item.id === place.id);
            return (
              <Marker key={place.id} position={[place.coordinates.latitude, place.coordinates.longitude]} icon={markerIcon(place)}
                title={`${place.name}; wheelchair access ${statusLabel(mapStatus(place))}`}
                alt={`${place.name}, ${place.category}, wheelchair access ${statusLabel(mapStatus(place))}`} keyboard>
                <Popup minWidth={260} maxWidth={340}>
                  <PlacePopup place={place} onOpenDetails={isApplicationRecord ? onSelectPlace : undefined} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        <div className="equalease-map-legend" aria-label="Marker colors">
          <span><i className="equalease-legend-dot yes" /> Verified Yes</span>
          <span><i className="equalease-legend-dot no" /> Verified No</span>
          <span><i className="equalease-legend-dot unknown" /> Unknown or unverified</span>
          {userLocation ? <span><i className="equalease-legend-dot user" /> Your location</span> : null}
        </div>
      </div>
      {osmPlaces.length === 0 && !isSearchingArea ? (
        <Card style={styles.emptyCard}>
          <AppText variant="label">No OpenStreetMap results loaded for this area yet.</AppText>
          <AppText variant="caption">Pan or zoom to a neighborhood, then select Search this area. Search requires a close zoom level.</AppText>
        </Card>
      ) : null}
      {osmPlaces.length > 0 && visiblePlaces.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText variant="label">No places match these map filters.</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset map category and accessibility filters" onPress={() => { setSelectedCategory('All categories'); setAccessibilityFilter('all'); }} style={styles.resetButton}>
            <AppText variant="label" style={styles.resetButtonText}>Reset map filters</AppText>
          </Pressable>
        </Card>
      ) : null}
    </div>
  );
}

const styles = {
  emptyCard: { width: '100%', marginTop: spacing.sm, gap: spacing.xs, borderColor: colors.border },
  resetButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: 9, borderWidth: 1, borderColor: colors.primary },
  resetButtonText: { color: colors.primary },
};
