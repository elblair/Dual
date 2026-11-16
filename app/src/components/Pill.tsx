import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

export type PillTone = 'maroon' | 'soft';

interface PillProps {
  label: string;
  onPress?: () => void;
  tone?: PillTone;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}

/** Small rounded action: "OK", "Copy", "Rest day · 2 left". */
export function Pill({ label, onPress, tone = 'soft', icon: Icon, style }: PillProps) {
  const t = useTheme();
  const bg: ColorName = tone === 'maroon' ? 'maroon' : 'surfaceStrong';
  const fg: ColorName = tone === 'maroon' ? 'white' : 'ink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          paddingHorizontal: t.spacing.xxl,
          paddingVertical: t.spacing.s9,
          borderRadius: t.radii.pill,
          backgroundColor: t.colors[bg],
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={t.sizes.icon.copy} color={t.colors[fg]} strokeWidth={2} /> : null}
      <Text variant="smallStrong" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}
