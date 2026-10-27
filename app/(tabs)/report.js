import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useSavedPlaces } from '../../contexts/SavedPlacesContext';
import { ACCESSIBILITY_FEATURES, ACCESSIBILITY_STATUSES } from '../../data/samplePlaces';
import { localDateString, validateUserReport } from '../../services/userReportsRepository';
import { colors, componentStyles, radii, spacing } from '../../theme';

const MAX_NOTE_LENGTH = 500;
const MAX_SOURCE_LENGTH = 240;

export default function SubmitReportRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const initialPlaceId = Array.isArray(params.placeId) ? params.placeId[0] : params.placeId;
  const [placeId, setPlaceId] = useState(initialPlaceId ?? '');
  const [featureKey, setFeatureKey] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [observationDate, setObservationDate] = useState(localDateString());
  const [sourceContext, setSourceContext] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);
  const submittingRef = useRef(false);
  const { places, isPlacesLoading, placesError, retryPlaces, isFirebaseMode, submitUserReport, isUserReportsLoading } = useSavedPlaces();
  const selectedPlace = places.find((place) => place.id === placeId);

  function updateField(field, value, setter) {
    setter(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionError('');
    setSubmittedReport(null);
  }

  async function handleSubmit() {
    if (submittingRef.current || isUserReportsLoading) return;
    const report = {
      placeId,
      featureKey,
      status,
      note,
      observationDate,
      sourceContext,
    };
    const validationErrors = validateUserReport(report, places.map((place) => place.id));
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    try {
      const savedReport = await submitUserReport(report);
      setSubmittedReport(savedReport);
    } catch {
      setSubmissionError(isFirebaseMode
        ? 'The report could not be submitted to Firebase. Your entries are still here; check your connection and try again.'
        : 'The report could not be stored on this device. Your entries are still here; please try again.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Explore"
            onPress={() => router.replace('/explore')}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <AppText variant="label" style={styles.link}>Back to Explore</AppText>
          </Pressable>

          <AppText variant="heading" accessibilityRole="header">Submit an accessibility report</AppText>
          <AppText>
            {isFirebaseMode
              ? 'Share what you observed at a place. Reports are visible to other users, remain unverified, and do not change verified place information. Do not include personal contact details.'
              : 'Share what you observed at a place. This development version stores reports only on this device; submissions are not reviewed or verified.'}
          </AppText>

          {submittedReport ? (
            <Card style={styles.confirmation} accessibilityRole="alert">
              <AppText variant="subheading" accessibilityRole="header">{isFirebaseMode ? 'Report submitted' : 'Report saved on this device'}</AppText>
              <AppText>
                {isFirebaseMode
                  ? `Your report for ${selectedPlace?.name ?? 'this place'} is marked unverified and has not changed the place record.`
                  : `Your report for ${selectedPlace?.name ?? 'this place'} is marked unverified and has not changed the sample accessibility information.`}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${selectedPlace?.name ?? 'place'} details and submitted report`}
                onPress={() => router.replace({ pathname: '/explore/place/[id]', params: { id: submittedReport.placeId } })}
                style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
              >
                <AppText variant="label" style={styles.link}>View place details and report</AppText>
              </Pressable>
            </Card>
          ) : null}

          {submissionError ? (
            <Card style={styles.errorCard} accessibilityRole="alert">
              <AppText>{submissionError}</AppText>
            </Card>
          ) : null}

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">1. Select a place</AppText>
            <AppText variant="caption">{isFirebaseMode ? 'Choose a published place record.' : 'Choose one of the current development sample places.'}</AppText>
            {isPlacesLoading ? <AppText>Loading available places…</AppText> : null}
            {placesError ? (
              <View>
                <AppText accessibilityRole="alert">{placesError}</AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Retry loading places" onPress={retryPlaces} style={styles.outlineButton}>
                  <AppText variant="label" style={styles.link}>Try again</AppText>
                </Pressable>
              </View>
            ) : null}
            {errors.placeId ? <FieldError>{errors.placeId}</FieldError> : null}
            <View style={styles.optionList}>
              {places.map((place) => {
                const selected = placeId === place.id;
                return (
                  <Pressable
                    key={place.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${place.name}, ${place.category}, ${place.location}`}
                    accessibilityState={{ selected }}
                    onPress={() => updateField('placeId', place.id, setPlaceId)}
                    style={({ pressed }) => [styles.placeOption, selected && styles.selectedOption, pressed && styles.pressed]}
                  >
                    <AppText variant="label" style={selected && styles.selectedText}>{place.name}</AppText>
                    <AppText variant="caption" style={selected && styles.selectedText}>{place.category} · {place.location}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">2. Select an accessibility feature</AppText>
            {errors.featureKey ? <FieldError>{errors.featureKey}</FieldError> : null}
            <View style={styles.optionList}>
              {ACCESSIBILITY_FEATURES.map((feature) => {
                const selected = featureKey === feature.key;
                return (
                  <Pressable
                    key={feature.key}
                    accessibilityRole="button"
                    accessibilityLabel={feature.label}
                    accessibilityState={{ selected }}
                    onPress={() => updateField('featureKey', feature.key, setFeatureKey)}
                    style={({ pressed }) => [styles.choice, selected && styles.selectedOption, pressed && styles.pressed]}
                  >
                    <AppText variant="label" style={selected && styles.selectedText}>{feature.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">3. Choose a status</AppText>
            {errors.status ? <FieldError>{errors.status}</FieldError> : null}
            <View style={styles.optionList}>
              {Object.entries(ACCESSIBILITY_STATUSES).map(([statusKey, item]) => {
                const selected = status === statusKey;
                return (
                  <Pressable
                    key={statusKey}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected }}
                    onPress={() => updateField('status', statusKey, setStatus)}
                    style={({ pressed }) => [styles.choice, selected && styles.selectedOption, pressed && styles.pressed]}
                  >
                    <AppText variant="label" style={selected && styles.selectedText}>{item.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">4. Optional notes</AppText>
            <AppText variant="caption">Avoid including names, contact details, or other personal information.</AppText>
            <TextInput
              accessibilityLabel="Optional report notes"
              accessibilityHint={`Up to ${MAX_NOTE_LENGTH} characters.`}
              value={note}
              onChangeText={(value) => updateField('note', value, setNote)}
              maxLength={MAX_NOTE_LENGTH}
              multiline
              textAlignVertical="top"
              placeholder="Describe what you observed"
              placeholderTextColor={colors.textMuted}
              style={styles.multilineInput}
            />
            <AppText variant="caption">{note.length}/{MAX_NOTE_LENGTH}</AppText>
            {errors.note ? <FieldError>{errors.note}</FieldError> : null}
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">5. Observation date</AppText>
            <AppText variant="caption">Enter the date you observed this, using YYYY-MM-DD.</AppText>
            <TextInput
              accessibilityLabel="Observation date"
              accessibilityHint="Use year, month, day format. Future dates are not accepted."
              value={observationDate}
              onChangeText={(value) => updateField('observationDate', value, setObservationDate)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={styles.input}
            />
            {errors.observationDate ? <FieldError>{errors.observationDate}</FieldError> : null}
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="subheading" accessibilityRole="header">6. Source or supporting context (optional)</AppText>
            <AppText variant="caption">For example, a public information page or context for your observation.</AppText>
            <TextInput
              accessibilityLabel="Optional source or supporting context"
              accessibilityHint={`Up to ${MAX_SOURCE_LENGTH} characters. Do not include personal contact details.`}
              value={sourceContext}
              onChangeText={(value) => updateField('sourceContext', value, setSourceContext)}
              maxLength={MAX_SOURCE_LENGTH}
              placeholder="Add a source or context"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <AppText variant="caption">{sourceContext.length}/{MAX_SOURCE_LENGTH}</AppText>
            {errors.sourceContext ? <FieldError>{errors.sourceContext}</FieldError> : null}
          </View>

          <Card style={styles.notice}>
            <AppText variant="label">Unverified user report</AppText>
            <AppText variant="caption">
              A report records what a user shared. It is not a verified venue fact and will not replace the sample record.
            </AppText>
          </Card>

          <PrimaryButton
            label={isUserReportsLoading ? 'Loading local reports…' : isSubmitting ? 'Saving report…' : 'Submit report'}
            accessibilityHint="Saves this report locally on the device."
            disabled={isSubmitting || isUserReportsLoading || Boolean(submittedReport)}
            onPress={handleSubmit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel and return to Explore"
            onPress={() => router.replace('/explore')}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <AppText variant="label" style={styles.link}>Return to Explore</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldError({ children }) {
  return <AppText accessibilityRole="alert" style={styles.fieldError}>{children}</AppText>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    ...componentStyles.screen,
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  inner: { width: '100%', maxWidth: 560, gap: spacing.lg },
  backButton: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.xs },
  link: { color: colors.primary, textAlign: 'center' },
  fieldGroup: { gap: spacing.sm },
  optionList: { gap: spacing.xs },
  placeOption: {
    minHeight: 64,
    justifyContent: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  choice: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primaryStrong },
  selectedText: { color: colors.onPrimary },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 16,
    lineHeight: 24,
  },
  multilineInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 16,
    lineHeight: 24,
  },
  fieldError: { color: colors.statusNo },
  notice: { gap: spacing.xs },
  confirmation: { gap: spacing.sm, borderColor: colors.statusYes },
  errorCard: { gap: spacing.xs, borderColor: colors.statusNo },
  outlineButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cancelButton: { minHeight: 48, justifyContent: 'center' },
  pressed: { opacity: 0.82 },
});
