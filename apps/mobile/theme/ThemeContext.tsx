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
import { useColorScheme as useSystemColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import { colorScheme as nativewindColorScheme } from 'react-native-css-interop';
import { hexToRgbTriplet, themeColors } from '@moxt/shared/design/index.js';

import { darkColors, getShadows, lightColors, type ThemeColors, type ThemeMode } from './colors';

/** Même clé que le web (localStorage 'moxt-theme'). Valeurs : light | dark | system. */
const STORAGE_KEY = 'moxt-theme';

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`);

function buildCssVars(mode: 'light' | 'dark') {
  const palette = themeColors[mode] as Record<string, string>;
  return vars(
    Object.fromEntries(
      Object.entries(palette).map(([key, hex]) => [`--app-${kebab(key)}`, hexToRgbTriplet(hex)]),
    ),
  );
}

const CSS_VARS = { light: buildCssVars('light'), dark: buildCssVars('dark') } as const;

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

/**
 * Racine visuelle : pose les variables CSS `--app-*` (couleurs `app-*` de
 * tailwind.config.js) et le fond de page, pour le thème résolu.
 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const { resolvedTheme, colors } = useContext(ThemeContext);
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, CSS_VARS[resolvedTheme]]}>
      {children}
    </View>
  );
}

/**
 * Variables CSS `--app-*` du thème courant, à reposer sur la racine d'un <Modal> :
 * sur le web, la modale est rendue hors de ThemeRoot et n'en hérite pas.
 */
export function useThemeCssVars() {
  const { resolvedTheme } = useContext(ThemeContext);
  return CSS_VARS[resolvedTheme];
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
