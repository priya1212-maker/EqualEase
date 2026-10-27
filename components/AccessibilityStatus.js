import { AppText } from './AppText';
import { ACCESSIBILITY_STATUSES } from '../data/samplePlaces';

export function AccessibilityStatus({ label, status }) {
  const description = ACCESSIBILITY_STATUSES[status] ?? ACCESSIBILITY_STATUSES.unknown;

  return (
    <AppText variant="caption" accessibilityRole="text">
      <AppText variant="caption">{label}: </AppText>
      <AppText variant="label" style={{ color: description.color }}>
        {description.label}
      </AppText>
    </AppText>
  );
}
