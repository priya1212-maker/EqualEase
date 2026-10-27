import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ACCESSIBILITY_FEATURES, getFeatureStatus } from '../data/samplePlaces';
import { AccessibilityStatus } from './AccessibilityStatus';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, spacing } from '../theme';

export function OpenStreetMapPlaceCard({ place, onShowOnMap }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={styles.card}>
      <AppText variant="label" style={styles.category}>{place.category}</AppText>
      <AppText variant="subheading" accessibilityRole="header">{place.name}</AppText>
      <AppText variant="caption">{place.location || 'Address unavailable'}</AppText>
      <AccessibilityStatus label="Wheelchair access" status={getFeatureStatus(place, 'wheelchairAccess')} />
      <AppText variant="caption">OpenStreetMap community data · Unverified · Missing information is Unknown.</AppText>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Show ${place.name} on map`} onPress={onShowOnMap} style={styles.action}>
          <AppText variant="label" style={styles.actionText}>Show on map</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Hide' : 'Show'} accessibility details for ${place.name}`} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.action}>
          <AppText variant="label" style={styles.actionText}>{expanded ? 'Hide details' : 'Accessibility details'}</AppText>
        </Pressable>
      </View>
      {expanded ? (
        <View style={styles.details}>
          {ACCESSIBILITY_FEATURES.map((feature) => (
            <AccessibilityStatus key={feature.key} label={feature.label} status={getFeatureStatus(place, feature.key)} />
          ))}
          {place.sourceDetails?.wheelchairTag === 'limited' ? <AppText>OSM records limited access; EqualEase shows this as Unknown rather than Yes or No.</AppText> : null}
          <AppText variant="caption">Last verified: Not available</AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  category: { color: colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.md },
  actionText: { color: colors.primary },
  details: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border },
});
