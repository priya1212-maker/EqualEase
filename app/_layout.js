import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SavedPlacesProvider } from '../contexts/SavedPlacesContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SavedPlacesProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SavedPlacesProvider>
  );
}
