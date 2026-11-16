import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

/** Two vertical bars (ink + orange) and the word "dual". sm = 14pt (chips), lg = 22pt (Hobby header). */
export function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const t = useTheme();
  const l = t.sizes.logo[size];
  const bar = { width: l.barWidth, height: l.barHeight, borderRadius: size === 'lg' ? t.radii.bar : t.radii.xs };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: l.textGap }} accessibilityLabel="dual">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: l.barGap }}>
        <View style={[bar, { backgroundColor: t.colors.ink }]} />
        <View style={[bar, { backgroundColor: t.colors.orange }]} />
      </View>
      <Text color="ink" style={{ fontFamily: t.fonts.bold, fontSize: l.font }}>
        dual
      </Text>
    </View>
  );
}
