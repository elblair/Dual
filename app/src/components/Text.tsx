import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme, type ColorName, type TextVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
}

/** All app text goes through here so fonts, sizes and colors come from the theme. */
export function Text({ variant = 'body', color = 'ink', align, style, ...rest }: TextProps) {
  const t = useTheme();
  return <RNText {...rest} style={[t.text[variant], { color: t.colors[color] }, align && { textAlign: align }, style]} />;
}
