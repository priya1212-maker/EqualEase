import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { AccessibilityStatus } from './AccessibilityStatus';
import { Card } from './Card';
import { colors, radii, spacing } from '../theme';

export function PlaceCard({ place, onViewDetails, onShowOnMap, isSaved = false, onToggleSaved, savedPlacesLoading = false }) {
  return (
    <Card style={styles.card}>
      <AppText variant="label" style={styles.category}>{place.category}</AppText>
      <AppText variant="subheading" accessibilityRole="header">{place.name}</AppText>
      <AppText variant="caption">{place.location}</AppText>
      <View style={styles.accessibilityList}>
        <AccessibilityStatus label="Step-free entrance" status={place.accessibility.stepFreeEntrance} />
        <AccessibilityStatus label="Accessible washroom" status={place.accessibility.accessibleWashroom} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${place.name}`}
        accessibilityHint="Opens this sample place's accessibility information."
        onPress={onViewDetails}
        style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
      >
        <AppText variant="label" style={styles.detailsLabel}>View details</AppText>
      </Pressable>
      {onShowOnMap ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Show ${place.name} on map`}
          onPress={onShowOnMap}
          style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
        >
          <AppText variant="label" style={styles.detailsLabel}>Show on map</AppText>
        </Pressable>
      ) : null}
      {onToggleSaved ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove ${place.name} from Saved Places` : `Save ${place.name} to Saved Places`}
          accessibilityState={{ selected: isSaved, disabled: savedPlacesLoading }}
          accessibilityHint="Stores only this place's ID on this device."
          disabled={savedPlacesLoading}
          onPress={onToggleSaved}
          style={({ pressed }) => [styles.saveButton, isSaved && styles.savedButton, pressed && !savedPlacesLoading && styles.pressed]}
        >
          <AppText variant="label" style={isSaved ? styles.savedLabel : styles.detailsLabel}>
            {isSaved ? 'Remove from Saved Places' : 'Save Place'}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  category: { color: colors.primary },
  accessibilityList: { gap: spacing.xs, marginTop: spacing.xs },
  detailsButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailsLabel: { color: colors.primary, textAlign: 'center' },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceRaised,
  },
  savedButton: { backgroundColor: colors.primaryStrong },
  savedLabel: { color: colors.onPrimary, textAlign: 'center' },
  pressed: { opacity: 0.82 },
});
