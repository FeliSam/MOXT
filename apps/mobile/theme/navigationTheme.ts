import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from 'expo-router';

import type { ThemeColors } from './colors';

type NavigationTheme = typeof NavigationDefaultTheme;

export function getNavigationTheme(isDark: boolean, colors: ThemeColors): NavigationTheme {
  const base = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}
