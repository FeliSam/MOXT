import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FileText, ShieldCheck } from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/providers/LanguageProvider';
import { fr } from '@moxt/shared/i18n/locales/fr.js';
import { resolveLocale } from '@moxt/shared/i18n/translate.js';

export const LEGAL_SECTIONS = [
  { id: 'mentions', labelKey: 'legal.nav.mentions', defaultLabel: 'Mentions légales' },
  { id: 'cgu', labelKey: 'legal.nav.cgu', defaultLabel: 'CGU' },
  { id: 'entreprises', labelKey: 'legal.nav.entreprises', defaultLabel: 'Entreprises' },
  { id: 'annonces', labelKey: 'legal.nav.annonces', defaultLabel: 'Règles annonces' },
  { id: 'privacy', labelKey: 'legal.nav.privacy', defaultLabel: 'Confidentialité' },
];

export default function LegalScreen() {
  const params = useLocalSearchParams<{ sectionId?: string }>();
  const { language, t } = useLanguage();

  const initialSection = LEGAL_SECTIONS.some((s) => s.id === params.sectionId)
    ? params.sectionId!
    : 'mentions';

  const [activeSectionId, setActiveSectionId] = useState(initialSection);

  const sectionData = useMemo(() => {
    try {
      const resolved = resolveLocale(language, `legal.sections.${activeSectionId}`);
      if (resolved && typeof resolved === 'object') return resolved as { title?: string; paragraphs?: string[] };
    } catch {
      // fallback
    }
    const fallbackSection = (fr as any)?.legal?.sections?.[activeSectionId];
    return fallbackSection || { title: 'Informations légales', paragraphs: [] };
  }, [language, activeSectionId]);

  const paragraphs: string[] = Array.isArray(sectionData?.paragraphs) ? sectionData.paragraphs : [];
  const year = new Date().getFullYear();

  return (
    <AppChrome pathname="/legal">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
      >
        {/* Header Hero */}
        <View className="py-2">
          <View className="flex-row items-center gap-2 mb-1.5">
            <ShieldCheck size={16} color="#6366f1" />
            <Text className="text-[11px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-300">
              {t('legal.pageEyebrow') || 'Informations légales & Conformité'}
            </Text>
          </View>
          <Text className="text-2xl font-black text-app-text">
            {sectionData?.title || t('legal.pageEyebrow') || 'Mentions légales'}
          </Text>
          <Text className="text-xs text-app-text-muted mt-1">
            {t('legal.copyright', { year }) || `© ${year} MOXT Technologies. Tous droits réservés.`}
          </Text>
        </View>

        {/* Section Tabs Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {LEGAL_SECTIONS.map((sec) => {
            const isActive = sec.id === activeSectionId;
            const label = t(sec.labelKey) || sec.defaultLabel;

            return (
              <Pressable
                key={sec.id}
                onPress={() => setActiveSectionId(sec.id)}
                className={`rounded-xl px-4 py-2.5 active:opacity-80 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-app-surface border border-app-border'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-white' : 'text-app-text'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Legal Text Card */}
        <Card className="p-5 gap-4">
          {paragraphs.map((p, index) => (
            <Text
              key={`${activeSectionId}-${index}`}
              className="text-xs leading-relaxed text-app-text-muted"
            >
              {p}
            </Text>
          ))}
        </Card>

        {/* Footer Notice */}
        <View className="items-center py-2">
          <Text className="text-[10px] text-center text-app-text-faint">
            {t('legal.footer') ||
              'Pour toute question relative aux mentions légales ou à vos données, contactez support@moxtapp.ru.'}
          </Text>
        </View>
      </ScrollView>
    </AppChrome>
  );
}
