import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DsButton } from '@/components/ds/Button';
import { useLanguage } from '@/providers/LanguageProvider';
import { withAlphaColor } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';

import { FeatherIcon } from './icons';

const BRAND_MARK = require('../../../../moxt-react/public/assets/brand/mark.png');

/** En-tête public (PublicSiteLayout du web) pour le mode invité. */
export function GuestHeader() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors, isDark, setTheme } = useTheme();

  const squareButton = {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View
      style={{
        paddingTop: Math.max(12, insets.top + 8),
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: withAlphaColor(colors.background, 0.9),
      }}>
      <Pressable accessibilityRole="link" accessibilityLabel={t('public.nav.homeAria')} onPress={() => router.push('/login' as never)}>
        <Image source={BRAND_MARK} style={{ width: 36, height: 36, borderRadius: 12 }} />
      </Pressable>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('public.nav.searchAria')} style={squareButton} onPress={() => router.push('/(tabs)/marketplace' as never)}>
          <FeatherIcon name="search" size={16} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDark ? t('nav.enableLightTheme') : t('nav.enableDarkTheme')}
          style={squareButton}
          onPress={() => setTheme(isDark ? 'light' : 'dark')}>
          <FeatherIcon name={isDark ? 'sun' : 'moon'} size={16} color={colors.text} />
        </Pressable>
        <DsButton onPress={() => router.push('/register' as never)}>{t('public.auth.register')}</DsButton>
      </View>
    </View>
  );
}
