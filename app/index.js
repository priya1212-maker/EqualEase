import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, componentStyles, radii, spacing } from '../theme';

export default function HomeRoute() {
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
      importantForAccessibility={helpVisible ? 'no-hide-descendants' : 'auto'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={false}
      >
        <View style={[styles.container, compact && styles.compactContainer]}>
          <View style={[styles.illustration, compact && styles.compactIllustration]}>
            <AppText
              accessible={false}
              style={[styles.accessibilitySymbol, compact && styles.compactSymbol]}
            >
              ♿
            </AppText>
          </View>

          <AppText variant="display" accessibilityRole="header" style={styles.title}>
            EqualEase
          </AppText>
          <AppText style={styles.tagline}>
            Accessibility for everyone. Independence for every journey.
          </AppText>

          <Card style={styles.introCard}>
            <AppText variant="subheading" accessibilityRole="header">
              Find places that fit your needs
            </AppText>
            <AppText>
              Explore places and review available accessibility information before you visit. We’re starting with wheelchair accessibility.
            </AppText>
          </Card>

          <View style={styles.actions}>
            <PrimaryButton
              label="Explore Places"
              accessibilityHint="Opens the list of sample places."
              onPress={() => router.push('/explore')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How EqualEase Works"
              accessibilityHint="Opens an explanation of EqualEase."
              onPress={() => setHelpVisible(true)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <AppText variant="label" style={styles.secondaryLabel}>
                How EqualEase Works
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={helpVisible}
        transparent
        animationType="none"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              accessibilityViewIsModal
              importantForAccessibility="yes"
            >
              <Card style={styles.modalCard}>
                <AppText variant="heading" accessibilityRole="header">
                  How EqualEase Works
                </AppText>
                <AppText>
                  EqualEase is being designed to help you consider accessibility before choosing a place to visit.
                </AppText>
                <AppText>
                  We’re starting with wheelchair accessibility. As place information becomes available, you’ll be able to review practical details and decide what may work for your journey.
                </AppText>
                <AppText>
                  Accessibility can vary from place to place. Always use the information that best supports your own needs.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close explanation"
                  onPress={() => setHelpVisible(false)}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                >
                  <AppText variant="label" style={styles.closeLabel}>Close</AppText>
                </Pressable>
              </Card>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  container: {
    ...componentStyles.screen,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  compactContainer: { paddingHorizontal: spacing.md },
  illustration: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactIllustration: { width: 72, height: 72, marginBottom: spacing.md },
  accessibilitySymbol: { color: colors.primary, fontSize: 48, lineHeight: 58 },
  compactSymbol: { fontSize: 40, lineHeight: 48 },
  title: { marginBottom: spacing.xs, textAlign: 'center' },
  tagline: {
    maxWidth: 400,
    marginBottom: spacing.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  introCard: { width: '100%', gap: spacing.sm },
  actions: { width: '100%', alignItems: 'stretch', marginTop: spacing.xl, gap: spacing.sm },
  comingSoon: { textAlign: 'center' },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryLabel: { color: colors.primary, textAlign: 'center' },
  pressed: { opacity: 0.82 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  modalSafeArea: { maxHeight: '100%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.md },
  closeButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.primaryStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeLabel: { color: colors.onPrimary },
});
