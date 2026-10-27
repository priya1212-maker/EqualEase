import { View } from 'react-native';
import { componentStyles } from '../theme';

export function Card({ style, ...props }) {
  return <View {...props} style={[componentStyles.card, style]} />;
}
