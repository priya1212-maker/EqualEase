import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { CategoryFilterChip } from '../../../components/CategoryFilterChip';
import { Card } from '../../../components/Card';
import { PlaceCard } from '../../../components/PlaceCard';
import { OpenStreetMapPlaceCard } from '../../../components/OpenStreetMapPlaceCard';
import { PlacesMap } from '../../../components/PlacesMap';
import { requestCurrentForegroundLocation } from '../../../services/currentLocation';
import { searchOpenStreetMapArea } from '../../../services/openStreetMapDiscovery';
import { useSavedPlaces } from '../../../contexts/SavedPlacesContext';
import {
  ALL_CATEGORIES,
  filterPlaces,
  PLACE_CATEGORIES,
} from '../../../data/samplePlaces';
import { colors, componentStyles, radii, spacing } from '../../../theme';

export default function ExploreRoute() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const {
    places,
    isPlacesLoading,
    placesError,
    retryPlaces,
    isFirebaseMode,
    savedPlaceIds,
    isSavedPlacesLoading,
    toggleSavedPlace,
  } = useSavedPlaces();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [viewMode, setViewMode] = useState('list');
  const [userLocation, setUserLocation] = useState(null);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [osmPlaces, setOsmPlaces] = useState([]);
  const [osmSearchError, setOsmSearchError] = useState(null);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapSelectedPlace, setMapSelectedPlace] = useState(null);
  const googleMapsConfigured = Boolean(Constants.expoConfig?.extra?.mapConfig?.googleMapsAndroidApiKeyConfigured);
  const canUseMapLocation = Platform.OS === 'web' || (Platform.OS !== 'android' || googleMapsConfigured);
  const mapHeight = Math.max(300, Math.min(520, windowHeight * 0.48));
  const filteredPlaces = useMemo(
    () => filterPlaces(places, searchText, selectedCategory),
    [places, searchText, selectedCategory],
  );
  const filteredOsmPlaces = useMemo(
    () => Platform.OS === 'web' ? filterPlaces(osmPlaces, searchText, selectedCategory) : [],
    [osmPlaces, searchText, selectedCategory],
  );
  const listPlaces = useMemo(
    () => Platform.OS === 'web' ? [...filteredPlaces, ...filteredOsmPlaces] : filteredPlaces,
    [filteredPlaces, filteredOsmPlaces],
  );
  const hasActiveFilters = Boolean(searchText.trim()) || selectedCategory !== ALL_CATEGORIES;

  function resetFilters() {
    setSearchText('');
    setSelectedCategory(ALL_CATEGORIES);
  }

  function openPlace(place) {
    router.push({ pathname: '/explore/place/[id]', params: { id: place.id } });
  }

  function focusOnMap(place) {
    setMapSelectedPlace(place);
    setViewMode('map');
  }

  async function searchThisArea(bounds) {
    if (!bounds || isSearchingArea) return;
    setIsSearchingArea(true);
    setOsmSearchError(null);
    setOsmPlaces([]);
    try {
      const results = await searchOpenStreetMapArea(bounds);
      setOsmPlaces(results);
      if (results.length === 0) setOsmSearchError('No named places with matching OpenStreetMap tags were found in this area. Try another area.');
    } catch (error) {
      setOsmSearchError(error.message || 'OpenStreetMap could not load this area.');
    } finally {
      setIsSearchingArea(false);
    }
  }

  async function useMyLocation() {
    setLocationError(null);
    setIsFindingLocation(true);
    try {
      const result = await requestCurrentForegroundLocation(Location);
      if (result.status === 'granted') {
        setUserLocation(result.coords);
      } else if (result.status === 'permanentlyDenied') {
        setLocationError(Platform.OS === 'web'
          ? 'Browser location permission was denied. Change this site’s location permission in your browser, or search a place manually.'
          : 'Location permission is turned off for EqualEase. Search places manually or open app settings to allow location.');
      } else if (result.status === 'denied') {
        setLocationError('Location permission was denied. Search by place name, category, or location description instead.');
      } else if (result.status === 'servicesDisabled') {
        setLocationError('Device location services are off. Turn them on or continue searching manually.');
      } else {
        setLocationError('Your location is unavailable right now. Search places manually or try again later.');
      }
    } catch {
      setLocationError('Your location is unavailable right now. Search places manually or try again later.');
    } finally {
      setIsFindingLocation(false);
    }
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIdentity}>
            <View style={styles.brandMark} importantForAccessibility="no-hide-descendants">
              <AppText variant="label" style={styles.brandMarkText}>E</AppText>
            </View>
            <AppText variant="subheading" accessibilityRole="header">EqualEase</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSavedPlacesLoading ? 'Saved Places, loading' : `Saved Places, ${savedPlaceIds.length} saved`}
            onPress={() => router.push('/saved')}
            style={({ pressed }) => [styles.savedLink, pressed && styles.pressed]}
          >
            <AppText variant="label" style={styles.resetText}>
              {isSavedPlacesLoading ? 'Saved Places' : `Saved (${savedPlaceIds.length})`}
            </AppText>
          </Pressable>
        </View>

        <AppText variant="heading" accessibilityRole="header" style={styles.heading}>
          Explore places that work for you.
        </AppText>
        <AppText>
          Search place names, categories, and location descriptions, then review the available accessibility information.
        </AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit an accessibility report"
          accessibilityHint="Choose a listed place and report an observed accessibility feature."
          onPress={() => router.push('/report')}
          style={({ pressed }) => [styles.reportLink, pressed && styles.pressed]}
        >
          <AppText variant="label" style={styles.resetText}>Submit a report</AppText>
        </Pressable>

        <View style={styles.sampleNotice}>
          <AppText variant="label" style={styles.noticeTitle}>{isFirebaseMode ? 'Firebase place records' : 'Development sample data'}</AppText>
          <AppText variant="caption">
          {isFirebaseMode
            ? 'Place information comes from published Firebase records. Community reports are shown separately and remain unverified.'
            : 'These examples are fictional. Accessibility details have not been verified with real places.'}
          </AppText>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Search places and categories"
            accessibilityHint="Type a place name, category, or location."
            placeholder="Search places or categories"
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            selectionColor={colors.primary}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearchText('')}
              style={({ pressed }) => [styles.clearSearch, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.clearSearchText}>Clear</AppText>
            </Pressable>
          )}
        </View>

        <View style={styles.filterHeading}>
          <AppText variant="label">Categories</AppText>
          {hasActiveFilters && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset search and category filters"
              onPress={resetFilters}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.resetText}>Reset filters</AppText>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Place category filters. Scroll horizontally for more options."
          contentContainerStyle={styles.chipList}
        >
          {[ALL_CATEGORIES, ...PLACE_CATEGORIES].map((category) => (
            <CategoryFilterChip
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>

        <AppText variant="caption" style={styles.resultCount}>
          {isFirebaseMode
            ? `${filteredPlaces.length + filteredOsmPlaces.length} places`
            : `${filteredPlaces.length} sample places · ${filteredOsmPlaces.length} OpenStreetMap places`}
        </AppText>
        <View style={styles.viewSwitch} accessibilityRole="tablist" accessibilityLabel="Place display mode">
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="List view"
            accessibilityState={{ selected: viewMode === 'list' }}
            onPress={() => setViewMode('list')}
            style={[styles.viewOption, viewMode === 'list' && styles.viewOptionSelected]}
          >
            <AppText variant="label" style={viewMode === 'list' ? styles.viewOptionTextSelected : styles.viewOptionText}>List</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Map view"
            accessibilityState={{ selected: viewMode === 'map' }}
            onPress={() => setViewMode('map')}
            style={[styles.viewOption, viewMode === 'map' && styles.viewOptionSelected]}
          >
            <AppText variant="label" style={viewMode === 'map' ? styles.viewOptionTextSelected : styles.viewOptionText}>Map</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    if (isPlacesLoading) {
      return <View style={styles.loadingState} accessibilityRole="progressbar" accessibilityLabel="Loading places">
        <ActivityIndicator color={colors.primary} />
        <AppText>Loading places…</AppText>
      </View>;
    }
    if (placesError) {
      return <Card style={styles.emptyCard} accessibilityRole="alert">
        <AppText variant="subheading" accessibilityRole="header">Places are unavailable</AppText>
        <AppText>{placesError}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry loading places" onPress={retryPlaces} style={styles.emptyReset}>
          <AppText variant="label" style={styles.resetText}>Try again</AppText>
        </Pressable>
      </Card>;
    }
    return (
      <Card style={styles.emptyCard}>
        <AppText variant="subheading" accessibilityRole="header">No places match your search</AppText>
        <AppText>Try another place name, category, or location description, or reset your filters.</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search and filters"
          onPress={resetFilters}
          style={({ pressed }) => [styles.emptyReset, pressed && styles.pressed]}
        >
          <AppText variant="label" style={styles.resetText}>Clear search and filters</AppText>
        </Pressable>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <FlatList
        data={viewMode === 'map' ? [{ id: 'explore-map' }] : listPlaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (viewMode === 'map' ? (
          <View style={styles.mapSection}>
            {canUseMapLocation ? <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFindingLocation ? 'Finding your location' : 'Use my location'}
              accessibilityHint="Requests foreground location permission only after you choose this button."
              disabled={isFindingLocation}
              onPress={useMyLocation}
              style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}
            >
              {isFindingLocation ? <ActivityIndicator color={colors.primary} /> : null}
              <AppText variant="label" style={styles.locationButtonText}>
                {isFindingLocation ? 'Finding location…' : userLocation ? 'Update my location' : 'Use my location'}
              </AppText>
            </Pressable> : null}
            {locationError ? (
              <Card style={styles.locationError} accessibilityRole="alert">
                <AppText>{locationError}</AppText>
                {Platform.OS !== 'web' && locationError.includes('app settings') ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Open EqualEase app settings" onPress={() => Linking.openSettings()} style={styles.settingsButton}>
                    <AppText variant="label" style={styles.locationButtonText}>Open app settings</AppText>
                  </Pressable>
                ) : null}
              </Card>
            ) : null}
            <PlacesMap
              places={filteredPlaces}
              osmPlaces={osmPlaces}
              userLocation={userLocation}
              selectedPlace={mapSelectedPlace}
              googleMapsConfigured={googleMapsConfigured}
              mapBounds={mapBounds}
              onBoundsChange={setMapBounds}
              onSearchArea={searchThisArea}
              isSearchingArea={isSearchingArea}
              searchError={osmSearchError}
              searchText={searchText}
              onSelectPlace={openPlace}
              height={mapHeight}
            />
          </View>
        ) : (
          item.informationSource?.type === 'openStreetMap' ? (
          <OpenStreetMapPlaceCard
            place={item}
            onShowOnMap={() => focusOnMap(item)}
          />
          ) : <PlaceCard
            place={item}
            onViewDetails={() => openPlace(item)}
            onShowOnMap={item.coordinates ? () => focusOnMap(item) : undefined}
            isSaved={savedPlaceIds.includes(item.id)}
            savedPlacesLoading={isSavedPlacesLoading}
            onToggleSaved={() => toggleSavedPlace(item.id)}
          />
        ))}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.listContent, viewMode === 'map' && styles.mapListContent]}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  listContent: {
    ...componentStyles.screen,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  mapListContent: { maxWidth: 1200 },
  header: { gap: spacing.md, marginBottom: spacing.md },
  brandRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  brandIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  savedLink: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  reportLink: {
    minHeight: 48,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  brandMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.primaryStrong,
  },
  brandMarkText: { color: colors.onPrimary },
  heading: { marginTop: spacing.xs },
  sampleNotice: {
    gap: spacing.xxs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  noticeTitle: { color: colors.primary },
  searchRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingLeft: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  clearSearch: { minHeight: 48, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { color: colors.primary },
  filterHeading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resetButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  resetText: { color: colors.primary },
  chipList: { paddingRight: spacing.md },
  resultCount: { marginTop: spacing.xs },
  separator: { height: spacing.md },
  emptyCard: { gap: spacing.md },
  viewSwitch: { flexDirection: 'row', minHeight: 48, borderRadius: radii.md, padding: 3, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  viewOption: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  viewOptionSelected: { backgroundColor: colors.primary },
  viewOptionText: { color: colors.textSecondary },
  viewOptionTextSelected: { color: colors.onPrimary },
  mapSection: { gap: spacing.md },
  locationButton: { minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md, backgroundColor: colors.surface },
  locationButtonText: { color: colors.primary },
  locationError: { gap: spacing.xs },
  settingsButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  loadingState: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyReset: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.82 },
});
