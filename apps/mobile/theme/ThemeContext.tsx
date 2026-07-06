import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'react-native-css-interop';

import { darkColors, getShadows, lightColors, type ThemeColors, type ThemeMode } from './colors';

const STORAGE_KEY = 'moxt-theme';

type ThemeContextValue = {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  ready: boolean;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colors: lightColors,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  ready: false,
});

async function readStoredTheme(): Promise<ThemeMode | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    nativewindColorScheme.set(theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    readStoredTheme().then((stored) => {
      if (!mounted) return;
      if (stored) setThemeState(stored);
      else setThemeState(systemScheme === 'dark' ? 'dark' : 'light');
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [systemScheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme === 'dark' ? darkColors : lightColors,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
      ready,
    }),
    [theme, setTheme, toggleTheme, ready],
  );

  if (!ready) {
    return (
      <ThemeContext.Provider
        value={{
          theme: systemScheme === 'dark' ? 'dark' : 'light',
          colors: systemScheme === 'dark' ? darkColors : lightColors,
          isDark: systemScheme === 'dark',
          setTheme,
          toggleTheme,
          ready: false,
        }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

export function useIsDark(): boolean {
  return useContext(ThemeContext).isDark;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useShadows() {
  const { isDark } = useTheme();
  return getShadows(isDark);
}
