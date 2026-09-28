import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilies } from '@/theme/colors';

/**
 * Texte aux polices du web : Inter 400 / 600 pour le corps, Manrope 700 pour
 * les titres. Le composant `Text` de React Native 0.86 ne peut plus recevoir de
 * police par défaut globale : ce composant associe la graisse demandée
 * (style `fontWeight` ou prop `weight`) à la bonne famille chargée.
 * Une classe NativeWind `font-*` reste prioritaire (voir tailwind.config.js).
 */
export type AppTextProps = TextProps & {
  className?: string;
  /** Titre (Manrope 700, h1–h3 / .font-display du web). */
  display?: boolean;
  weight?: 'regular' | 'semibold';
};

const WEIGHT_CLASS = /(^|\s)(dark:)?font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|display)(\s|$)/;

export function familyForWeight(weight: TextStyle['fontWeight'] | undefined): string {
  if (weight == null || weight === 'normal') return fontFamilies.regular;
  if (weight === 'bold') return fontFamilies.semibold;
  const numeric = Number(weight);
  if (Number.isFinite(numeric)) return numeric >= 600 ? fontFamilies.semibold : fontFamilies.regular;
  return fontFamilies.regular;
}

export function AppText({ display, weight, style, className, ...props }: AppTextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  let fontFamily: string | undefined;
  if (display) fontFamily = fontFamilies.display;
  else if (weight) fontFamily = weight === 'semibold' ? fontFamilies.semibold : fontFamilies.regular;
  else if (!flat.fontFamily && flat.fontWeight != null) fontFamily = familyForWeight(flat.fontWeight);
  else if (!flat.fontFamily && !(className && WEIGHT_CLASS.test(className))) fontFamily = fontFamilies.regular;

  return (
    <Text
      {...props}
      className={className}
      style={fontFamily ? [style, { fontFamily, fontWeight: 'normal' }] : style}
    />
  );
}
