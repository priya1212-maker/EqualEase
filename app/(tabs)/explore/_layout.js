import { Stack } from 'expo-router';
import { colors } from '../../../theme';

export default function ExploreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
