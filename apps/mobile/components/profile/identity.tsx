import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { vars } from 'nativewind';
import { hexToRgbTriplet, palettes } from '@moxt/shared/design/index.js';

import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

export type BrandScale = Readonly<Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900', string>>;
export type ProfileKind = 'personal' | 'business';

type Accent = { accent: string; accentSoft: string; teal: string; tealSoft: string };
const PRUNE = (palettes as { prune: { brand: BrandScale; light: Accent; dark: Accent } }).prune;

/** Échelle prune de [data-profile-kind='personal'] (index.css). */
export const prune = PRUNE.brand as BrandScale;

/** Échelle brand-* effective : prune pour un profil perso, vert sinon. */
export function useBrandScale(kind?: ProfileKind | null): BrandScale {
  return kind === 'personal' ? prune : brand;
}

function cssVars(entries: Record<string, string>) {
  return vars(Object.fromEntries(Object.entries(entries).map(([k, hex]) => [k, hexToRgbTriplet(hex)])));
}

const PERSONAL_VARS = {
  light: cssVars({
    '--app-accent': PRUNE.light.accent,
    '--app-accent-soft': PRUNE.light.accentSoft,
    '--app-teal': PRUNE.light.teal,
    '--app-teal-soft': PRUNE.light.tealSoft,
  }),
  dark: cssVars({
    '--app-accent': PRUNE.dark.accent,
    '--app-accent-soft': PRUNE.dark.accentSoft,
    '--app-teal': PRUNE.dark.teal,
    '--app-teal-soft': PRUNE.dark.tealSoft,
  }),
};

/** .theme-community (index.css) : pages /businesses, /marketplace… */
export const COMMUNITY = {
  light: { surfaceMuted: '#fff4ec', border: '#f0e4d8', accentSoft: '#e8faf5' },
  dark: { surfaceMuted: '#2a221c', border: '#3d342c', accentSoft: '#1a3d35' },
} as const;

const COMMUNITY_VARS = {
  light: cssVars({
    '--app-surface-muted': COMMUNITY.light.surfaceMuted,
    '--app-border': COMMUNITY.light.border,
    '--app-accent-soft': COMMUNITY.light.accentSoft,
  }),
  dark: cssVars({
    '--app-surface-muted': COMMUNITY.dark.surfaceMuted,
    '--app-border': COMMUNITY.dark.border,
    '--app-accent-soft': COMMUNITY.dark.accentSoft,
    '--app-warm-soft': '#2a1814',
  }),
};

/** Couleurs `app-*` remappées pour un sous-arbre (équivalent des sélecteurs CSS du web). */
export function useScopeColors(scope: 'personal' | 'community' | 'base') {
  const { colors, isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';
  if (scope === 'personal') {
    const p = PRUNE[mode];
    return { ...colors, accent: p.accent, accentSoft: p.accentSoft, teal: p.teal, tealSoft: p.tealSoft };
  }
  if (scope === 'community') {
    const c = COMMUNITY[mode];
    return { ...colors, surfaceMuted: c.surfaceMuted, border: c.border, accentSoft: c.accentSoft };
  }
  return colors;
}

/** Pose les variables CSS du périmètre (prune perso ou communauté) sur ses enfants. */
export function ThemeScope({
  scope,
  children,
  style,
}: {
  scope: 'personal' | 'community' | 'base';
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';
  const scoped = scope === 'personal' ? PERSONAL_VARS[mode] : scope === 'community' ? COMMUNITY_VARS[mode] : null;
  return <View style={[{ flex: 1 }, scoped, style]}>{children}</View>;
}
