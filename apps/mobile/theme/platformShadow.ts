import { Platform, type ViewStyle } from 'react-native';
import { boxShadowStyle, cssShadowToNative } from '@moxt/shared/design/index.js';

/**
 * Ombre du web (`boxShadow`) sur Expo web, ombre native (`shadow*`) sur iOS/Android.
 * react-native-web avertit dès qu’un style porte encore `shadowColor` / `shadowOffset`.
 */
export function platformShadow(css: string): ViewStyle {
  if (!css) return {};
  if (Platform.OS === 'web') return boxShadowStyle(css) as ViewStyle;
  return cssShadowToNative(css) as ViewStyle;
}
