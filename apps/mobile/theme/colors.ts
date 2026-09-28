// Jetons de design : source unique dans packages/shared/src/design/tokens.json
// (extraits de moxt-react/src/index.css, vérifiés par tokens.test.js).
import {
  boxShadowStyle,
  brandScale,
  radiusTokens,
  spacingTokens,
  themeColors,
  themeShadows,
} from '@moxt/shared/design/index.js';

export const brand = brandScale as Readonly<Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900', string>>;

const light = themeColors.light;
const dark = themeColors.dark;

export const lightColors: ThemeColors = {
  background: light.bg,
  surface: light.surface,
  surfaceElevated: light.surface,
  surfaceInteractive: light.surfaceMuted,
  surfaceMuted: light.surfaceMuted,

  text: light.text,
  textSecondary: light.text2,
  textMuted: light.textMuted,
  textFaint: light.textFaint,

  border: light.border,
  borderMd: light.borderMd,
  surfaceBorder: light.border,

  primary: brand[700],
  primaryDark: brand[800],
  primaryLight: brand[50],
  primaryBorder: brand[200],
  onPrimary: '#ffffff',
  accent: light.accent,
  accentSoft: light.accentSoft,
  teal: light.teal,
  tealSoft: light.tealSoft,
  cobalt: light.cobalt,
  cobaltSoft: light.cobaltSoft,
  warm: light.warm,
  warmSoft: light.warmSoft,
  gold: light.gold,
  goldSoft: light.goldSoft,
  amber: light.amber,

  success: light.success,
  successBg: light.successSoft,
  successBorder: '#6ee7b7',
  warning: light.warning,
  warningBg: light.warningSoft,
  warningBorder: '#fcd34d',
  danger: light.danger,
  dangerBg: light.dangerSoft,
  dangerBorder: '#fecaca',

  inputBorder: light.borderMd,
  inputBg: light.surfaceMuted,

  cardShadow: 'rgba(0,0,0,0.04)',
  financeGlow: 'rgba(8,112,95,0.08)',

  tabIconDefault: light.textFaint,
  tabIconSelected: light.accent,
  tabBarBg: light.surface,
  tabBarBorder: light.border,

  heroGradient: [brand[800], brand[700], light.cobalt] as const,
  statusBarStyle: 'dark' as const,

  inverseBg: '#020617',
  inverseText: '#ffffff',
};

export const darkColors: ThemeColors = {
  background: dark.bg,
  surface: dark.surface,
  surfaceElevated: dark.surface,
  surfaceInteractive: dark.surfaceMuted,
  surfaceMuted: dark.surfaceMuted,

  text: dark.text,
  textSecondary: dark.text2,
  textMuted: dark.textMuted,
  textFaint: dark.textFaint,

  border: dark.border,
  borderMd: dark.borderMd,
  surfaceBorder: dark.border,

  primary: brand[400],
  primaryDark: brand[600],
  primaryLight: dark.accentSoft,
  primaryBorder: brand[800],
  onPrimary: '#020617',
  accent: dark.accent,
  accentSoft: dark.accentSoft,
  teal: dark.teal,
  tealSoft: dark.tealSoft,
  cobalt: dark.cobalt,
  cobaltSoft: dark.cobaltSoft,
  warm: dark.warm,
  warmSoft: dark.warmSoft,
  gold: dark.gold,
  goldSoft: dark.goldSoft,
  amber: dark.amber,

  success: dark.success,
  successBg: dark.successSoft,
  successBorder: '#166534',
  warning: dark.warning,
  warningBg: dark.warningSoft,
  warningBorder: '#92400e',
  danger: dark.danger,
  dangerBg: dark.dangerSoft,
  dangerBorder: '#7f1d1d',

  inputBorder: dark.borderMd,
  inputBg: dark.surfaceMuted,

  cardShadow: 'rgba(0,0,0,0.35)',
  financeGlow: 'rgba(54,198,170,0.12)',

  tabIconDefault: dark.textFaint,
  tabIconSelected: dark.teal,
  tabBarBg: dark.surface,
  tabBarBorder: dark.border,

  heroGradient: [brand[900], brand[800], '#1e40af'] as const,
  statusBarStyle: 'light' as const,

  inverseBg: '#020617',
  inverseText: '#ffffff',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceInteractive: string;
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
export type ThemeMode = 'light' | 'dark' | 'system';

export const spacing = spacingTokens as Readonly<{
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}>;

export const radii = {
  sm: 8,
  md: radiusTokens.btn as number, // boutons / champs : 12
  lg: radiusTokens.card as number, // cartes : 16
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

/**
 * Ombres du web (--shadow-card, --shadow-float…) en `boxShadow` CSS, pris en
 * charge par React Native (nouvelle architecture) et react-native-web.
 */
export function getShadows(isDark: boolean) {
  const set = themeShadows[isDark ? 'dark' : 'light'];
  return {
    card: boxShadowStyle(set.card),
    cardHover: boxShadowStyle(set.cardHover),
    cardLg: boxShadowStyle(set.cardLg),
    float: boxShadowStyle(set.float),
    bottomNav: boxShadowStyle(set.bottomNav),
    finance: boxShadowStyle(set.finance),
  } as const;
}

/** @deprecated use getShadows(isDark) for theme-aware shadows */
export const shadows = getShadows(false);

/** Familles chargées dans app/_layout.tsx (Inter 400/600, Manrope 700). */
export const fontFamilies = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  display: 'Manrope_700Bold',
} as const;

export const typography = {
  eyebrow: {
    fontSize: 11,
    fontFamily: fontFamilies.semibold,
    fontWeight: 'normal' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamilies.display,
    fontWeight: 'normal' as const,
    letterSpacing: -0.5,
  },
  titleLg: {
    fontSize: 28,
    fontFamily: fontFamilies.display,
    fontWeight: 'normal' as const,
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.semibold,
    fontWeight: 'normal' as const,
  },
  body: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    fontWeight: 'normal' as const,
  },
  bodySmall: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    fontWeight: 'normal' as const,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamilies.semibold,
    fontWeight: 'normal' as const,
  },
} as const;
