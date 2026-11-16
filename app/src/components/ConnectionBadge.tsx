import { View } from 'react-native';
import { useConnection } from '@/data';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

/** "Live · host" / "Offline · host" / "Mock data": always visible on Today and the Database screen. */
export function ConnectionBadge() {
  const t = useTheme();
  const { status, host } = useConnection();

  const look: Record<typeof status, { dot: ColorName; label: string }> = {
    live: { dot: 'success', label: `Live · ${host}` },
    offline: { dot: 'maroonBright', label: `Offline · ${host}` },
    checking: { dot: 'mutedSoft', label: `Connecting · ${host}` },
    mock: { dot: 'orange', label: 'Mock data · not the database' },
  };
  const { dot, label } = look[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.s6,
        borderRadius: t.radii.pill,
        backgroundColor: t.colors.surface,
      }}
    >
      <View style={{ width: t.spacing.md - 2, height: t.spacing.md - 2, borderRadius: t.radii.pill, backgroundColor: t.colors[dot] }} />
      <Text variant="captionStrong" color="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </Text>
    </View>
  );
}
