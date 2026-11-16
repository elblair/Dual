import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Theme } from './theme';

type AnyStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Theme-aware StyleSheet. Usage:
 *   const useStyles = createStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
 *   function Box() { const s = useStyles(); return <View style={s.box} />; }
 */
export function createStyles<T extends Record<string, AnyStyle>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
