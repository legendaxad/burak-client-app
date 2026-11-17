import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './themes';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Creates a hook returning theme-aware styles, so components never read raw colors.
 *   const useStyles = makeStyles((t) => ({ root: { backgroundColor: t.colors.surface } }));
 */
export function makeStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (theme: Theme) => T,
) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
