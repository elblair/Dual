import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface HobbyTileProps {
  label: string;
  icon: LucideIcon;
  /** e.g. '-45deg' to straighten an icon that is drawn diagonally. */
  iconRotation?: string;
  selected: boolean;
  onPress: () => void;
}

/** Hobby picker tile: icon over label. Selected = maroon fill, white content. */
export function HobbyTile({ label, icon: Icon, iconRotation, selected, onPress }: HobbyTileProps) {
  const t = useTheme();
  const fg = selected ? t.colors.white : t.colors.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: t.spacing.sm,
        paddingHorizontal: t.spacing.s6,
        paddingVertical: t.spacing.xl,
        borderRadius: t.radii.lg,
        backgroundColor: selected ? t.colors.maroon : t.colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={iconRotation ? { transform: [{ rotate: iconRotation }] } : undefined}>
        <Icon size={t.sizes.icon.xl} color={fg} strokeWidth={2} />
      </View>
      <Text variant="smallStrong" color={selected ? 'white' : 'ink'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
