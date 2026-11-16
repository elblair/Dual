import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'orange' | 'outline' | 'soft';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Full-width pill-ish button. primary = maroon, orange = "do this now" (check-in only), outline, soft = gray. */
export function Button({ label, onPress, variant = 'primary', icon: Icon, disabled, style }: ButtonProps) {
  const t = useTheme();
  const look: Record<ButtonVariant, { bg: ColorName | null; fg: ColorName; border?: ColorName }> = {
    primary: { bg: 'maroon', fg: 'white' },
    orange: { bg: 'orange', fg: 'onOrange' },
    outline: { bg: 'bg', fg: 'ink', border: 'border' },
    soft: { bg: 'surfaceStrong', fg: 'ink' },
  };
  const { bg, fg, border } = look[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          paddingVertical: t.spacing.xxl,
          paddingHorizontal: t.spacing.xxxl,
          borderRadius: t.radii.lg,
          backgroundColor: bg ? t.colors[bg] : undefined,
          borderWidth: border ? t.borders.hairline : 0,
          borderColor: border ? t.colors[border] : undefined,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={t.sizes.icon.md} color={t.colors[fg]} strokeWidth={2} /> : null}
      <Text variant="button" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}
