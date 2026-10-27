import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, spacing } from '../theme';
import { getMappablePlaces, getWheelchairMarkerStatus } from '../data/mapPlaces';

const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

export function PlacesMap({ places, userLocation, selectedPlace, googleMapsConfigured, onSelectPlace, height }) {
  const mapRef = useRef(null);
  const mappablePlaces = useMemo(() => getMappablePlaces(places), [places]);
  const firstCoordinate = mappablePlaces[0]?.coordinates;
  const center = userLocation ?? firstCoordinate;

  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userLocation, ...DEFAULT_DELTA }, 400);
  }, [userLocation]);

  useEffect(() => {
    if (!selectedPlace?.coordinates || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...selectedPlace.coordinates, ...DEFAULT_DELTA }, 400);
  }, [selectedPlace]);

  if (Platform.OS === 'android' && !googleMapsConfigured) {
    return (
      <Card style={[styles.stateCard, { height }]} accessibilityRole="alert">
        <AppText variant="subheading" accessibilityRole="header">Map setup is needed</AppText>
        <AppText>Configure a restricted Google Maps Android key and rebuild the development app. You can still search places in list view.</AppText>
      </Card>
    );
  }

  if (!center) {
    return (
      <Card style={[styles.stateCard, { height }]}>
        <AppText variant="subheading" accessibilityRole="header">Map locations are unavailable</AppText>
        <AppText>These records do not include coordinates. Search by place name, category, or saved location description, or choose Use my location to center the map. No place pins will be guessed.</AppText>
      </Card>
    );
  }

  return (
    <View style={[styles.mapContainer, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...center, ...DEFAULT_DELTA }}
        showsUserLocation={Boolean(userLocation)}
        showsMyLocationButton={false}
        accessibilityLabel="Map of places with available location coordinates"
      >
        {mappablePlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={place.coordinates}
            title={place.name}
            description={`${place.category} · ${place.location || 'Location description unavailable'} · Accessibility information may be unknown.`}
            accessibilityLabel={`${place.name}, ${place.category}. Select to view its accessibility information.`}
            onPress={() => onSelectPlace(place)}
            pinColor={getWheelchairMarkerStatus(place) === 'yes'
              ? colors.statusYes
              : getWheelchairMarkerStatus(place) === 'no' ? colors.statusNo : '#D59B00'}
          />
        ))}
      </MapView>
      <View pointerEvents="none" style={styles.attribution}>
        <AppText variant="caption" style={styles.attributionText}>Google Maps</AppText>
      </View>
      {mappablePlaces.length === 0 ? (
        <View pointerEvents="none" style={styles.noPins}>
          <AppText variant="caption" style={styles.noPinsText}>No place coordinates in the current data</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { width: '100%', overflow: 'hidden', borderRadius: 16, backgroundColor: colors.surface },
  stateCard: { width: '100%', justifyContent: 'center', gap: spacing.md },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  attributionText: { color: '#303030' },
  noPins: { position: 'absolute', top: 8, left: 8, borderRadius: 6, padding: 8, backgroundColor: 'rgba(255,255,255,0.94)' },
  noPinsText: { color: '#303030' },
});
