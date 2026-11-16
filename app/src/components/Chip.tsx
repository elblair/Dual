import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  icon?: LucideIcon;
  /** neutral = gray; orange = "Rematch?"; success = "Live". */
  tone?: 'neutral' | 'orange' | 'success';
}

/** Small info pill on a dual card: "Eleanor confirms", "2 days left". Not tappable. */
export function Chip({ label, icon: Icon, tone = 'neutral' }: ChipProps) {
  const t = useTheme();
  const bg = tone === 'orange' ? 'orangeTint' : tone === 'success' ? 'successTint' : 'surfaceStrong';
  const fg = tone === 'orange' ? 'orangeDark' : tone === 'success' ? 'success' : 'ink';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.s6,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.s9 - t.spacing.hairline,
        borderRadius: t.radii.pill,
        backgroundColor: t.colors[bg],
      }}
    >
      {Icon ? <Icon size={t.sizes.icon.xs} color={t.colors[fg]} strokeWidth={2} /> : null}
      <Text variant="captionStrong" color={fg} style={{ fontFamily: t.fonts.medium }}>
        {label}
      </Text>
    </View>
  );
}
