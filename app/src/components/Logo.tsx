import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

/** Two vertical bars (ink + orange) and the word "dual". */
export function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const t = useTheme();
  const l = t.sizes.logo[size];
  const bar = { width: l.barWidth, height: l.barHeight, borderRadius: t.radii.xs };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }} accessibilityLabel="dual">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: l.gap }}>
        <View style={[bar, { backgroundColor: t.colors.ink }]} />
        <View style={[bar, { backgroundColor: t.colors.orange }]} />
      </View>
      <Text color="ink" style={{ fontFamily: t.fonts.bold, fontSize: l.font }}>
        dual
      </Text>
    </View>
  );
}
