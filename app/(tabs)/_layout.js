import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, spacing } from '../../theme';
import { TabGlyph } from '../../components/TabGlyph';

export default function MainTabsLayout() {
  const { fontScale } = useWindowDimensions();
  const tabBarHeight = Math.max(68, 44 + Math.ceil(16 * fontScale));

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: spacing.xxs,
          paddingBottom: spacing.xs,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarItemStyle: { minHeight: 48, paddingHorizontal: 2 },
        tabBarIconStyle: { marginTop: 1 },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarAccessibilityLabel: 'Explore places',
          tabBarIcon: ({ color, focused }) => <TabGlyph name="explore" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarLabel: 'Saved',
          tabBarAccessibilityLabel: 'Saved Places',
          tabBarIcon: ({ color, focused }) => <TabGlyph name="saved" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarLabel: 'Report',
          tabBarAccessibilityLabel: 'Submit an accessibility report',
          tabBarIcon: ({ color, focused }) => <TabGlyph name="report" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
