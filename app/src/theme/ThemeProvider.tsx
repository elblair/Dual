import { createContext, useContext, type ReactNode } from 'react';
import { lightTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * Provides the active theme. Always light for now.
 * When Midnight is added: `const scheme = useColorScheme(); const theme = scheme === 'dark' ? midnightTheme : lightTheme;`
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
