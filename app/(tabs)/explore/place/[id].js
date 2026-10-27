import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibilityStatus } from '../../../../components/AccessibilityStatus';
import { AppText } from '../../../../components/AppText';
import { Card } from '../../../../components/Card';
import { PrimaryButton } from '../../../../components/PrimaryButton';
import { useSavedPlaces } from '../../../../contexts/SavedPlacesContext';
import {
  ACCESSIBILITY_FEATURES,
  getFeatureStatus,
} from '../../../../data/samplePlaces';
import { colors, componentStyles, radii, spacing } from '../../../../theme';

export default function PlaceDetailsRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const placeId = Array.isArray(id) ? id[0] : id;
  const {
    places,
    isPlacesLoading,
    placesError,
    retryPlaces,
    isFirebaseMode,
    savedPlaceIds,
    isSavedPlacesLoading,
    savedPlacesError,
    retrySavedPlaces,
    userReports,
    isUserReportsLoading,
    userReportsError,
    retryUserReports,
    toggleSavedPlace,
  } = useSavedPlaces();
  const place = places.find((item) => item.id === placeId);
  const isSaved = place ? savedPlaceIds.includes(place.id) : false;
  const reports = place ? (userReports[place.id] ?? []) : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Explore"
              onPress={() => router.replace('/explore')}
              style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.topButtonLabel}>Back to Explore</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Saved Places"
              onPress={() => router.push('/saved')}
              style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.topButtonLabel}>Saved Places</AppText>
            </Pressable>
          </View>

          {place ? (
            <>
              <AppText variant="label" style={styles.category}>{place.category}</AppText>
              <AppText variant="heading" accessibilityRole="header">{place.name}</AppText>
              <AppText>{place.location}</AppText>

              <View style={styles.actions}>
                <PrimaryButton
                  label={isSavedPlacesLoading ? 'Loading saved places…' : isSaved ? 'Remove from Saved Places' : 'Save Place'}
                  accessibilityLabel={isSavedPlacesLoading
                    ? 'Loading saved places'
                    : isSaved ? `Remove ${place.name} from Saved Places` : `Save ${place.name} to Saved Places`}
                  accessibilityState={{ selected: isSaved }}
                  accessibilityHint="Saves only this place's ID on this device."
                  disabled={isSavedPlacesLoading}
                  onPress={() => toggleSavedPlace(place.id)}
                />
                {savedPlacesError ? (
                  <Card style={styles.errorCard} accessibilityRole="alert">
                    <AppText>{savedPlacesError}</AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry saving places on this device"
                      onPress={retrySavedPlaces}
                      style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}
                    >
                      <AppText variant="label" style={styles.topButtonLabel}>Retry</AppText>
                    </Pressable>
                  </Card>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Submit an accessibility report"
                  accessibilityHint="Opens a form for submitting an unverified user report about this place."
                  onPress={() => router.push({ pathname: '/report', params: { placeId: place.id } })}
                  style={({ pressed }) => [styles.reportAction, pressed && styles.pressed]}
                >
                  <AppText variant="label" style={styles.reportActionLabel}>Submit an accessibility report</AppText>
                </Pressable>
              </View>

              <Card style={styles.sourceCard}>
                <AppText variant="subheading" accessibilityRole="header">Information source</AppText>
                {place.informationSource ? (
                  <>
                    <AppText variant="label" style={place.informationSource.verified ? styles.verified : styles.unverified}>
                    {place.informationSource.verified ? 'Verified information' : isFirebaseMode ? 'Unverified place information' : 'Unverified sample information'}
                    </AppText>
                    <AppText>{place.informationSource.label}</AppText>
                  </>
                ) : <AppText>Source information is unavailable.</AppText>}
                <AppText variant="caption">Last reported: {formatDate(place.lastReportedAt)}</AppText>
                <AppText variant="caption">Last verified: {formatDate(place.lastVerifiedAt)}</AppText>
              </Card>

              <Card style={styles.featuresCard}>
                <AppText variant="subheading" accessibilityRole="header">Accessibility features</AppText>
                <AppText variant="caption">
                  {isFirebaseMode
                    ? 'Place records and community reports are separate. Unknown means information is unavailable; it does not mean No.'
                    : 'Sample information only. Unknown means information is unavailable; it does not mean No.'}
                </AppText>
                <View style={styles.featureList}>
                  {ACCESSIBILITY_FEATURES.map((feature) => (
                    <View key={feature.key} style={styles.featureRow}>
                      <View
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={styles.featureIcon}
                      >
                        <AppText accessible={false} style={styles.featureIconText}>{feature.icon}</AppText>
                      </View>
                      <View style={styles.featureText}>
                        <AppText variant="label">{feature.label}</AppText>
                        <AccessibilityStatus label="Status" status={getFeatureStatus(place, feature.key)} />
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              {(isUserReportsLoading || userReportsError || reports.length > 0) && (
                <Card style={styles.reportsCard}>
                  <AppText variant="subheading" accessibilityRole="header">Submitted user reports</AppText>
                  <AppText variant="caption">
                    {isFirebaseMode
                      ? 'Community reports are stored separately and remain unverified. They do not change this place record.'
                      : 'Reports are stored on this device and remain unverified. They do not change the sample accessibility record.'}
                  </AppText>
                  {isUserReportsLoading ? <AppText>Loading reports…</AppText> : null}
                  {userReportsError ? (
                    <View style={styles.reportItem}>
                      <AppText>{userReportsError}</AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Retry loading submitted reports"
                        onPress={retryUserReports}
                        style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}
                      >
                        <AppText variant="label" style={styles.topButtonLabel}>Retry</AppText>
                      </Pressable>
                    </View>
                  ) : null}
                  {reports.map((report) => {
                    const feature = ACCESSIBILITY_FEATURES.find((item) => item.key === report.featureKey);
                    return (
                      <View key={report.id} style={styles.reportItem}>
                        <AccessibilityStatus label={feature?.label ?? 'Accessibility feature'} status={report.status} />
                        <AppText variant="caption">User report · Unverified · Observed {formatDate(report.observationDate)}</AppText>
                        {report.note ? <AppText>{report.note}</AppText> : null}
                        {report.sourceContext ? <AppText variant="caption">Source or context: {report.sourceContext}</AppText> : null}
                        <AppText variant="caption">Submitted {formatDate(report.submittedAt)}</AppText>
                      </View>
                    );
                  })}
                </Card>
              )}
            </>
          ) : isPlacesLoading ? (
            <Card style={styles.featuresCard}>
              <AppText variant="subheading" accessibilityRole="header">Loading place</AppText>
              <AppText>Place details are loading.</AppText>
            </Card>
          ) : placesError ? (
            <Card style={styles.featuresCard} accessibilityRole="alert">
              <AppText variant="subheading" accessibilityRole="header">Place details are unavailable</AppText>
              <AppText>{placesError}</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Retry loading places" onPress={retryPlaces} style={styles.topButton}>
                <AppText variant="label" style={styles.topButtonLabel}>Try again</AppText>
              </Pressable>
            </Card>
          ) : (
            <Card style={styles.featuresCard}>
              <AppText variant="subheading" accessibilityRole="header">Place not found</AppText>
              <AppText>This place is not available in the current data source.</AppText>
            </Card>
          )}

          <PrimaryButton label="Return to Explore" accessibilityHint="Returns to the places list." onPress={() => router.replace('/explore')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value) {
  if (!value) return 'Not available';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? (() => {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    })()
    : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    ...componentStyles.screen,
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  inner: { width: '100%', maxWidth: 560, gap: spacing.md },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  topButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  topButtonLabel: { color: colors.primary },
  category: { color: colors.primary },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  errorCard: { gap: spacing.xs, borderColor: colors.statusNo },
  reportAction: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  reportActionLabel: { color: colors.primary, textAlign: 'center' },
  sourceCard: { gap: spacing.sm },
  verified: { color: colors.statusYes },
  unverified: { color: colors.textSecondary },
  featuresCard: { gap: spacing.md },
  featureList: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
  },
  featureIconText: { color: colors.primary, fontSize: 22, lineHeight: 28 },
  featureText: { flex: 1, gap: spacing.xxs },
  reportsCard: { gap: spacing.md },
  reportItem: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.82 },
});
