import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/lib/storage';
import { lightTheme, midnightTheme, type Theme } from './theme';

/** What the person picked on You. "system" follows the phone's light/dark setting. */
export type Appearance = 'system' | 'light' | 'dark';

const KEY = 'dual.appearance';

const ThemeContext = createContext<Theme>(lightTheme);
const AppearanceContext = createContext<{ appearance: Appearance; setAppearance: (next: Appearance) => void }>({
  appearance: 'system',
  setAppearance: () => {},
});

/** Provides the active theme: Midnight (dark) or the light Base theme, from the phone setting or the person's choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  useEffect(() => {
    storage.get(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setAppearanceState(v);
    });
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    storage.set(KEY, next);
  }, []);

  const dark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');
  const choice = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);

  return (
    <AppearanceContext.Provider value={choice}>
      <ThemeContext.Provider value={dark ? midnightTheme : lightTheme}>{children}</ThemeContext.Provider>
    </AppearanceContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
