import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

export function CategoryFilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} category filter`}
      accessibilityState={{ selected }}
      accessibilityHint="Filters the sample places by category."
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="label" style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryStrong },
  label: { color: colors.textSecondary },
  selectedLabel: { color: colors.onPrimary },
  pressed: { opacity: 0.82 },
});
