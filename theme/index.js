export const colors = {
  background: '#F7F5FB',
  surface: '#FFFFFF',
  surfaceRaised: '#EFE9F8',
  border: '#D5CDE1',
  textPrimary: '#211A2D',
  textSecondary: '#443B52',
  textMuted: '#625971',
  primary: '#5B35A8',
  primaryStrong: '#5B35A8',
  onPrimary: '#FFFFFF',
  focus: '#321C60',
  scrim: 'rgba(31, 24, 45, 0.62)',
  statusYes: '#216B3A',
  statusNo: '#A83232',
  statusUnknown: '#443B52',
  statusNotApplicable: '#5B35A8',
};

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const componentStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryStrong,
  },
};

export const theme = { colors, typography, spacing, radii, componentStyles };
