import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/theme/ThemeContext';

import { HeaderActionButton, HeaderChip } from './HeaderChrome';
import { HEADER, headerPaddingTop } from './headerTokens';

/**
 * En-tête de retour au style web : pastille (surface/65) contenant le bouton
 * rond sans bordure (HEADER_BACK_BTN_CLASS, LuArrowLeft) et le titre.
 * `inline` : rendu dans le contenu d'un écran déjà protégé (SafeAreaView + marges) ;
 * sinon l'en-tête applique le padding haut du web (max(1.25rem, safe-area + 0.5rem)).
 */
export function BackHeader({
  title,
  subtitle,
  onBack,
  actions,
  inline = false,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  inline?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, translateLabel } = useLanguage();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/' as never)));

  return (
    <View
      style={{
        paddingTop: inline ? 0 : headerPaddingTop(insets.top),
        paddingHorizontal: inline ? 0 : HEADER.padX,
        paddingBottom: inline ? 0 : 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: HEADER.gap,
      }}>
      <HeaderChip>
        <HeaderActionButton transparent size={HEADER.avatar} accessibilityLabel={t('common.back')} onPress={goBack}>
          <ArrowLeft size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />
        </HeaderActionButton>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText numberOfLines={1} className="text-sm font-black text-app-text" style={{ lineHeight: 16 }}>
            {title ? translateLabel(title) : 'MOXT'}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={1} className="text-[11px] text-app-text-muted" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </HeaderChip>
      {actions ? (
        <View style={{ height: HEADER.height, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap }}>{actions}</View>
      ) : null}
    </View>
  );
}
