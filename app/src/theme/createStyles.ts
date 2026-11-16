import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { Theme } from './theme';

/**
 * Theme-aware StyleSheet. Usage:
 *   const useStyles = createStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
 *   function Box() { const s = useStyles(); return <View style={s.box} />; }
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
