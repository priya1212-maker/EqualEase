import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, componentStyles } from '../theme';

export function PrimaryButton({
  label,
  accessibilityLabel,
  accessibilityState,
  disabled = false,
  style,
  ...props
}) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        componentStyles.primaryButton,
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style({ pressed, disabled }) : style,
      ]}
    >
      <AppText variant="label" style={[styles.label, disabled && styles.disabledLabel]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'stretch' },
  label: { color: colors.onPrimary, textAlign: 'center' },
  disabled: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
  disabledLabel: { color: colors.textSecondary },
  pressed: { opacity: 0.85 },
});
