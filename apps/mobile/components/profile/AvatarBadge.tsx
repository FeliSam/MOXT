import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeContext';
import { brand } from '@/theme/palette';

const PORTRAIT_PREFIXES = ['https://cdn.moxtapp.ru/avatars/portraits/', 'https://storage.yandexcloud.net/moxt-public/avatars/portraits/'];
const LORELEI_PATH_RE = /\/avatars\/[^/?#]+\/lorelei\.(?:png|jpe?g)(?:[?#]|$)/i;

/** isGeneratedAvatar du web : portrait de la bibliothèque ou avatar illustré (Lorelei). */
export function isGeneratedAvatar(url?: string | null) {
  if (!url || typeof url !== 'string') return false;
  const value = url.trim();
  return PORTRAIT_PREFIXES.some((prefix) => value.startsWith(prefix)) || LORELEI_PATH_RE.test(value);
}

/** Pastille « • Avatar » posée au-dessus d'un avatar créé avec l'éditeur Moxt. */
export function AvatarBadge({ url, top = -8 }: { url?: string | null; top?: number }) {
  const { isDark } = useTheme();
  if (!isGeneratedAvatar(url)) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center', zIndex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(94,234,212,0.4)' : 'rgba(255,255,255,0.7)',
          backgroundColor: isDark ? 'rgba(2,6,23,0.7)' : 'rgba(255,255,255,0.8)',
          paddingHorizontal: 6,
          paddingVertical: 1,
          boxShadow: isDark ? '0 0 12px -2px rgba(45,212,191,0.6)' : '0 2px 10px -3px rgba(8,112,95,0.55)',
        }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isDark ? '#5eead4' : brand[600] }} />
        <AppText className="font-bold uppercase" style={{ fontSize: 9, lineHeight: 12.6, letterSpacing: 1.25, color: isDark ? '#5eead4' : brand[800] }}>
          Avatar
        </AppText>
      </View>
    </View>
  );
}
