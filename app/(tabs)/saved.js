import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { PlaceCard } from '../../components/PlaceCard';
import { useSavedPlaces } from '../../contexts/SavedPlacesContext';
import { colors, componentStyles, radii, spacing } from '../../theme';

export default function SavedPlacesRoute() {
  const router = useRouter();
  const {
    places,
    isPlacesLoading,
    placesError,
    retryPlaces,
    savedPlaceIds,
    isSavedPlacesLoading,
    savedPlacesError,
    retrySavedPlaces,
    isFirebaseMode,
  } = useSavedPlaces();
  const savedPlaces = places.filter((place) => savedPlaceIds.includes(place.id));

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Explore"
          onPress={() => router.replace('/explore')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppText variant="label" style={styles.backLabel}>Back to Explore</AppText>
        </Pressable>
        <AppText variant="heading" accessibilityRole="header">Saved Places</AppText>
        <AppText variant="caption">
          {isFirebaseMode
            ? 'Saved place IDs are stored on this device. Review each place’s information source and status.'
            : 'Saved place IDs are stored on this device. Sample accessibility details are unverified.'}
        </AppText>
        {savedPlacesError ? (
          <Card style={styles.errorCard} accessibilityRole="alert">
            <AppText>{savedPlacesError}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry saving places on this device"
              onPress={retrySavedPlaces}
              style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.exploreLabel}>Retry</AppText>
            </Pressable>
          </Card>
        ) : null}
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <Card style={styles.emptyCard}>
        <AppText variant="subheading" accessibilityRole="header">No saved places yet</AppText>
        <AppText>Explore the sample places and save one to find it here later.</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore sample places"
          onPress={() => router.replace('/explore')}
          style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
        >
          <AppText variant="label" style={styles.exploreLabel}>Explore sample places</AppText>
        </Pressable>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {isSavedPlacesLoading || isPlacesLoading ? (
        <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Loading saved places">
          <ActivityIndicator color={colors.primary} />
          <AppText>Loading saved places…</AppText>
        </View>
      ) : placesError ? (
        <View style={styles.listContent}>
          <Card style={styles.errorCard} accessibilityRole="alert">
            <AppText variant="subheading" accessibilityRole="header">Saved places are unavailable</AppText>
            <AppText>{placesError}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Retry loading saved places" onPress={retryPlaces} style={styles.exploreButton}>
              <AppText variant="label" style={styles.exploreLabel}>Try again</AppText>
            </Pressable>
          </Card>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={(place) => place.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onViewDetails={() => router.push({ pathname: '/explore/place/[id]', params: { id: item.id } })}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  header: { gap: spacing.md, marginBottom: spacing.md },
  backButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.xs },
  backLabel: { color: colors.primary },
  separator: { height: spacing.md },
  emptyCard: { gap: spacing.md },
  errorCard: { gap: spacing.sm, borderColor: colors.statusNo },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  exploreButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  exploreLabel: { color: colors.primary },
  pressed: { opacity: 0.82 },
});
