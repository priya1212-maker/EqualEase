import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

export function TabGlyph({ name, color, focused }) {
  const backing = focused ? colors.surfaceRaised : colors.surface;

  return (
    <View style={[styles.backing, { backgroundColor: backing }]} importantForAccessibility="no-hide-descendants">
      {name === 'explore' ? (
        <View style={styles.exploreIcon}>
          <View style={[styles.lens, { borderColor: color }]} />
          <View style={[styles.handle, { backgroundColor: color }]} />
        </View>
      ) : name === 'saved' ? (
        <View style={styles.savedIcon}>
          <View style={[styles.bookmark, { borderColor: color }]} />
          <View style={[styles.bookmarkNotch, { borderTopColor: backing }]} />
        </View>
      ) : (
        <View style={[styles.reportIcon, { borderColor: color }]}>
          <View style={[styles.plusHorizontal, { backgroundColor: color }]} />
          <View style={[styles.plusVertical, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backing: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  exploreIcon: { width: 24, height: 24 },
  lens: { position: 'absolute', left: 2, top: 1, width: 15, height: 15, borderWidth: 2, borderRadius: radii.pill },
  handle: { position: 'absolute', width: 9, height: 2, right: 1, bottom: 4, borderRadius: 1, transform: [{ rotate: '45deg' }] },
  savedIcon: { width: 20, height: 24, alignItems: 'center' },
  bookmark: { width: 15, height: 21, borderWidth: 2, borderRadius: 2 },
  bookmarkNotch: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  reportIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 5,
  },
  plusHorizontal: { position: 'absolute', width: 10, height: 2, borderRadius: 1 },
  plusVertical: { position: 'absolute', width: 2, height: 10, borderRadius: 1 },
});
