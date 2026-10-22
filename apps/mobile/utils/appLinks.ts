import { router } from 'expo-router';
import { Linking } from 'react-native';

import { isLegalWebPath, isMoxtHost, resolveNativePath } from '@/utils/nativePath';

export { isLegalWebPath, isMoxtHost, resolveNativePath };

/** Ouvre l'écran natif, ou le navigateur pour un tiers / une page légale. */
export function openLink(url: string) {
  const native = resolveNativePath(url);
  if (native) {
    router.push(native as never);
    return;
  }
  if (!/^(https?:|tel:|mailto:)/i.test(url)) return;
  try {
    const parsed = new URL(url);
    if (isMoxtHost(parsed.hostname) && !isLegalWebPath(parsed.pathname)) return;
  } catch {
    return;
  }
  void Linking.openURL(url);
}
