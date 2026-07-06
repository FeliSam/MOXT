// Design tokens aligned with moxt-react/src/index.css (MOXT v3)

export const brand = {
  50: '#edfdf8',
  100: '#d2f8ec',
  200: '#a8efdb',
  300: '#70dfc5',
  400: '#36c6aa',
  500: '#16a98f',
  600: '#0b8975',
  700: '#08705f',
  800: '#07594d',
  900: '#06493f',
} as const;

export const lightColors = {
  background: '#f7f8fa',
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',

  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',

  border: '#e5e7eb',
  borderMd: '#d1d5db',
  surfaceBorder: '#e5e7eb',

  primary: brand[700],
  primaryDark: brand[800],
  primaryLight: brand[50],
  primaryBorder: brand[200],
  onPrimary: '#ffffff',
  accent: brand[700],
  accentSoft: '#ecfdf8',
  teal: '#12bfa3',
  tealSoft: '#e0faf5',
  cobalt: '#245de8',
  cobaltSoft: '#e6eeff',
  warm: '#ff6b4a',
  warmSoft: '#fff0eb',
  gold: '#b8860b',
  goldSoft: '#fef9e7',
  amber: '#f4a340',

  success: '#059669',
  successBg: '#d1fae5',
  successBorder: '#6ee7b7',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningBorder: '#fcd34d',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fecaca',

  inputBorder: '#d1d5db',
  inputBg: '#ffffff',

  cardShadow: 'rgba(0,0,0,0.04)',
  financeGlow: 'rgba(8,112,95,0.08)',

  tabIconDefault: '#9ca3af',
  tabIconSelected: brand[700],
  tabBarBg: '#ffffff',
  tabBarBorder: brand[100],

  heroGradient: ['#07594d', '#08705f', '#245de8'] as const,
  statusBarStyle: 'dark' as const,

  inverseBg: '#020617',
  inverseText: '#ffffff',
};

export const darkColors: ThemeColors = {
  background: '#0c0c0e',
  surface: '#141416',
  surfaceMuted: '#1a1a1e',

  text: '#fafafa',
  textSecondary: '#e5e5e5',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',

  border: '#27272a',
  borderMd: '#3f3f46',
  surfaceBorder: '#27272a',

  primary: '#36c6aa',
  primaryDark: brand[600],
  primaryLight: '#0d2a24',
  primaryBorder: brand[800],
  onPrimary: '#0c0c0e',
  accent: '#36c6aa',
  accentSoft: '#0d2a24',
  teal: '#2dd4bf',
  tealSoft: '#0a2420',
  cobalt: '#79b8ff',
  cobaltSoft: '#0d1f3c',
  warm: '#ff8a6b',
  warmSoft: '#2a1814',
  gold: '#d4a017',
  goldSoft: '#231800',
  amber: '#f4a340',

  success: '#34d399',
  successBg: '#064e3b',
  successBorder: '#166534',
  warning: '#fbbf24',
  warningBg: '#451a03',
  warningBorder: '#92400e',
  danger: '#f87171',
  dangerBg: '#450a0a',
  dangerBorder: '#7f1d1d',

  inputBorder: '#3f3f46',
  inputBg: '#1a1a1e',

  cardShadow: 'rgba(0,0,0,0.35)',
  financeGlow: 'rgba(54,198,170,0.12)',

  tabIconDefault: '#71717a',
  tabIconSelected: '#36c6aa',
  tabBarBg: '#141416',
  tabBarBorder: '#27272a',

  heroGradient: ['#06493f', '#07594d', '#1e40af'] as const,
  statusBarStyle: 'light' as const,

  inverseBg: '#020617',
  inverseText: '#ffffff',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderMd: string;
  surfaceBorder: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBorder: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  teal: string;
  tealSoft: string;
  cobalt: string;
  cobaltSoft: string;
  warm: string;
  warmSoft: string;
  gold: string;
  goldSoft: string;
  amber: string;
  success: string;
  successBg: string;
  successBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  inputBorder: string;
  inputBg: string;
  cardShadow: string;
  financeGlow: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tabBarBg: string;
  tabBarBorder: string;
  heroGradient: readonly [string, string, string];
  statusBarStyle: 'light' | 'dark';
  inverseBg: string;
  inverseText: string;
};
export type ThemeMode = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export function getShadows(isDark: boolean) {
  return {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      shadowOpacity: isDark ? 0.35 : 0.04,
      shadowRadius: isDark ? 16 : 8,
      elevation: isDark ? 4 : 2,
    },
    cardHover: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isDark ? 4 : 4 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: isDark ? 20 : 12,
      elevation: isDark ? 6 : 4,
    },
    float: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isDark ? 24 : 10 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: isDark ? 64 : 24,
      elevation: isDark ? 12 : 8,
    },
    finance: {
      shadowColor: isDark ? brand[400] : brand[700],
      shadowOffset: { width: 0, height: isDark ? 8 : 4 },
      shadowOpacity: isDark ? 0.12 : 0.08,
      shadowRadius: isDark ? 32 : 24,
      elevation: isDark ? 6 : 3,
    },
  } as const;
}

/** @deprecated use getShadows(isDark) for theme-aware shadows */
export const shadows = getShadows(false);

export const typography = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  titleLg: {
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
} as const;
