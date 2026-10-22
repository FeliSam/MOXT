import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { useThemeColors } from '@/theme/ThemeContext';

/** DashboardSearch du web (carte sans ombre, champ 3.25rem). Ouvre l'écran de recherche. */
export function DashboardSearchSection() {
  const { t } = useLanguage();
  const colors = useThemeColors();
  return (
    <View className="min-w-0 rounded-2xl bg-app-surface p-4">
      <View className="mb-3">
        <AppText className="text-xs font-black uppercase text-brand-700 dark:text-brand-300" style={{ letterSpacing: 1.44 }}>
          {t('dashboard.search.title')}
        </AppText>
        <AppText className="mt-1 text-xs text-app-text-faint">{t('dashboard.search.hint')}</AppText>
      </View>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={t('dashboard.search.title')}
        onPress={() => router.push('/search' as never)}
        className="min-h-[52px] flex-row items-center rounded-xl bg-app-surface-muted pl-11 pr-12">
        <View style={{ position: 'absolute', left: 16 }}>
          <Search size={16} color={colors.textFaint} strokeWidth={2} />
        </View>
        <AppText numberOfLines={1} className="flex-1 text-sm text-app-text-faint">
          {t('dashboard.search.placeholder')}
        </AppText>
      </Pressable>
    </View>
  );
}
