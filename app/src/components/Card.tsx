import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type ColorName } from '@/theme';

export type CardVariant = 'surface' | 'white' | 'outline' | 'maroon' | 'orangeTint' | 'successTint' | 'slate' | 'selected';

const look: Record<CardVariant, { bg: ColorName; border?: ColorName; thick?: boolean }> = {
  surface: { bg: 'surface' },
  white: { bg: 'cardRaised' },
  outline: { bg: 'card', border: 'border' },
  maroon: { bg: 'maroon' },
  orangeTint: { bg: 'orangeTint' },
  successTint: { bg: 'successTint' },
  slate: { bg: 'blue' },
  selected: { bg: 'maroonTint', border: 'maroon', thick: true },
};

interface CardProps {
  variant?: CardVariant;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Rounded container (radius 18, padding 16 x 14). Override padding/radius through `style` (`padding` replaces both defaults). */
export function Card({ variant = 'surface', children, style }: CardProps) {
  const t = useTheme();
  const { bg, border, thick } = look[variant];
  const overridesPadding = StyleSheet.flatten(style)?.padding !== undefined;
  return (
    <View
      style={[
        {
          backgroundColor: t.colors[bg],
          borderRadius: t.radii.xl,
          ...(overridesPadding ? null : { paddingHorizontal: t.spacing.xxl, paddingVertical: t.spacing.xl }),
          borderWidth: border ? (thick ? t.borders.thick : t.borders.hairline) : 0,
          borderColor: border ? t.colors[border] : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
