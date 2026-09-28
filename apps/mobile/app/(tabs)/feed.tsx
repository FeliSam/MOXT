import { View } from 'react-native';

import { FeatherIcon } from '@/components/chrome/icons';
import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';

/** Onglet Fil — écran d'attente propre (le fil vidéo arrive en phase 3). */
export default function FeedTab() {
  const { t, translateLabel } = useLanguage();
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: BOTTOM_NAV_PADDING, gap: 12 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <FeatherIcon name="rss" size={26} color={isDark ? colors.teal : colors.accent} />
      </View>
      <AppText display className="text-xl text-app-text" style={{ textAlign: 'center' }}>
        {translateLabel('Fil d’actualité')}
      </AppText>
      <AppText className="text-sm text-app-text-muted" style={{ textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
        {translateLabel('Le fil arrive bientôt dans l’application.')}
      </AppText>
      <AppText className="text-xs font-semibold uppercase text-app-text-faint" style={{ letterSpacing: 1.2 }}>
        {t('nav.feed')}
      </AppText>
    </View>
  );
}
