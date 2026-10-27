import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../theme';

const styles = StyleSheet.create({
  base: { includeFontPadding: true },
  primary: { color: colors.textPrimary },
  secondary: { color: colors.textSecondary },
  muted: { color: colors.textMuted },
});

const variants = {
  display: [typography.display, styles.primary],
  heading: [typography.heading, styles.primary],
  subheading: [typography.subheading, styles.primary],
  body: [typography.body, styles.secondary],
  label: [typography.label, styles.primary],
  caption: [typography.caption, styles.muted],
};

export function AppText({ variant = 'body', style, ...props }) {
  return <Text {...props} style={[styles.base, variants[variant] ?? variants.body, style]} />;
}
