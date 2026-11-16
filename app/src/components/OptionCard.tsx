import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Radio } from './Radio';
import { Text } from './Text';

interface OptionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  selected: boolean;
  /** Red title and icon (Forfeit). */
  danger?: boolean;
  onPress: () => void;
}

/** Selectable option with icon, title, subtitle and a radio (Break screen). */
export function OptionCard({ icon: Icon, title, subtitle, selected, danger, onPress }: OptionCardProps) {
  const t = useTheme();
  const iconColor = danger ? t.colors.maroonBright : t.colors.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: t.spacing.lg,
        padding: t.spacing.xl,
        borderRadius: t.radii.lg,
        backgroundColor: selected ? t.colors.maroonTint : t.colors.surface,
        borderWidth: t.borders.thick,
        borderColor: selected ? t.colors.maroon : 'transparent',
      }}
    >
      <Icon size={t.sizes.icon.xl} color={iconColor} strokeWidth={2} />
      <View style={{ flex: 1, gap: t.spacing.s3 }}>
        <Text variant="bodyStrong" color={danger ? 'maroonBright' : 'ink'}>
          {title}
        </Text>
        <Text variant="caption" color="muted">
          {subtitle}
        </Text>
      </View>
      <Radio selected={selected} />
    </Pressable>
  );
}
