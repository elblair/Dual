import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  icon?: LucideIcon;
}

/** Small info pill on a dual card: "Eleanor confirms", "2 days left". Not tappable. */
export function Chip({ label, icon: Icon }: ChipProps) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.s6,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.s9 - t.spacing.hairline,
        borderRadius: t.radii.pill,
        backgroundColor: t.colors.surfaceStrong,
      }}
    >
      {Icon ? <Icon size={t.sizes.icon.xs} color={t.colors.ink} strokeWidth={2} /> : null}
      <Text variant="captionStrong" style={{ fontFamily: t.fonts.medium }}>
        {label}
      </Text>
    </View>
  );
}
