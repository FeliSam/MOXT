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
  resolvedTheme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  ready: boolean;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  resolvedTheme: 'light',
  colors: lightColors,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  ready: false,
});

function resolveTheme(preference: ThemeMode, systemScheme: string | null | undefined): 'light' | 'dark' {
  if (preference === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return preference;
}

async function readStoredTheme(): Promise<ThemeMode | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  const resolvedTheme = resolveTheme(theme, systemScheme);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    nativewindColorScheme.set(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    let mounted = true;
    readStoredTheme().then((stored) => {
      if (!mounted) return;
      if (stored) setThemeState(stored);
      else setThemeState('light');
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode =
        current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      colors: isDark ? darkColors : lightColors,
      isDark,
      setTheme,
      toggleTheme,
      ready,
    }),
    [theme, resolvedTheme, isDark, setTheme, toggleTheme, ready],
  );

  if (!ready) {
    const bootResolved = resolveTheme('light', systemScheme);
    const bootDark = bootResolved === 'dark';
    return (
      <ThemeContext.Provider
        value={{
          theme: 'light',
          resolvedTheme: bootResolved,
          colors: bootDark ? darkColors : lightColors,
          isDark: bootDark,
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
