import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import type { Business } from '@/store/account';
import { useThemeColors } from '@/theme/ThemeContext';

type Check = {
  key: string;
  setupStep?: string;
  professionalTab?: string;
  isApplicable?: (business: Business) => boolean;
  test: (business: Business, documentCount: number) => boolean;
};

const str = (value: unknown) => String(value ?? '').trim();
const services = (business: Business) => (Array.isArray(business.services) ? (business.services as string[]) : []);

/** Miroir de BUSINESS_COMPLETION_CHECKS (moxt-react/src/features/businesses/businessCompletion.js). */
const CHECKS: Check[] = [
  { key: 'name', setupStep: 'identity', test: (b) => Boolean(str(b.name)) },
  { key: 'sector', setupStep: 'activity', test: (b) => Boolean(str(b.sector) || b.primaryActivity) },
  { key: 'country', setupStep: 'location', test: (b) => Boolean(b.country) },
  { key: 'city', setupStep: 'location', test: (b) => Boolean(str(b.city)) },
  { key: 'phone', setupStep: 'contact', test: (b) => Boolean(str(b.phone)) },
  { key: 'description', setupStep: 'presentation', test: (b) => Boolean(str(b.description)) },
  { key: 'services', setupStep: 'services', test: (b) => services(b).length > 0 },
  {
    key: 'averageDelay',
    setupStep: 'transfer',
    isApplicable: (b) => services(b).includes('Transfert'),
    test: (b) => Boolean(str(b.averageDelay)),
  },
  { key: 'documents', professionalTab: 'documents', test: (_b, count) => count > 0 },
  { key: 'verified', test: (b) => ['verified', 'approved', 'active'].includes(String(b.status)) },
];

export function BusinessVerificationProgress({ business }: { business: Business }) {
  const colors = useThemeColors();
  const { t } = useLanguage();
  const isDark = colors.background === '#0c0c0e';
  const [documentCount, setDocumentCount] = useState(0);
  const [showValidated, setShowValidated] = useState(false);

  useEffect(() => {
    if (!supabase || !business.id) return;
    let alive = true;
    supabase
      .from('business_documents')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .then(({ count }) => {
        if (alive) setDocumentCount(count ?? 0);
      });
    return () => {
      alive = false;
    };
  }, [business.id]);

  const applicable = CHECKS.filter((check) => !check.isApplicable || check.isApplicable(business));
  const complete = applicable.filter((check) => check.test(business, documentCount));
  const missing = applicable.filter((check) => !check.test(business, documentCount));
  const percent = applicable.length ? Math.round((complete.length / applicable.length) * 100) : 0;
  const label = (key: string) => t(`businesses.completion.${key}.label`);

  if (percent === 100) {
    return (
      <View style={{ borderRadius: 16, borderWidth: 1, padding: 14, borderColor: isDark ? 'rgba(16,185,129,0.4)' : '#a7f3d0', backgroundColor: isDark ? 'rgba(6,78,59,0.35)' : '#ecfdf5' }}>
        <Text style={{ fontWeight: '900', color: isDark ? '#6ee7b7' : '#065f46' }}>{t('businesses.verification.completeTitle')}</Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: isDark ? '#a7f3d0' : '#047857' }}>{t('businesses.verification.completeBody')}</Text>
      </View>
    );
  }

  const amberBorder = isDark ? 'rgba(120,53,15,0.45)' : 'rgba(253,230,138,0.8)';

  return (
    <View testID="business-verification-progress" style={{ gap: 14, borderRadius: 20, borderWidth: 1, padding: 18, borderColor: amberBorder, backgroundColor: isDark ? 'rgba(69,26,3,0.25)' : 'rgba(255,251,235,0.6)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', fontSize: 16, color: colors.text }}>🛡  {t('businesses.verification.title')}</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }}>
            {t('businesses.verification.progressHint', { complete: complete.length, total: applicable.length, missing: missing.length })}
          </Text>
        </View>
        <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: colors.surface }}>
          <Text style={{ fontWeight: '900', color: colors.accent }}>{percent}%</Text>
        </View>
      </View>

      <View style={{ height: 12, borderRadius: 999, overflow: 'hidden', backgroundColor: isDark ? colors.surfaceMuted : 'rgba(255,255,255,0.8)' }}>
        <View style={{ height: '100%', width: `${percent}%`, borderRadius: 999, backgroundColor: colors.accent }} />
      </View>

      {missing.length ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase', color: colors.textMuted }}>
            {t('businesses.verification.missingHeading')}
          </Text>
          {missing.map((item) => (
            <View key={item.key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1, padding: 12, borderColor: amberBorder, backgroundColor: colors.surface }}>
              <Text style={{ color: '#d97706', fontWeight: '900' }}>!</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{label(item.key)}</Text>
                <Text style={{ marginTop: 2, fontSize: 12, lineHeight: 18, color: colors.textMuted }}>{t(`businesses.completion.${item.key}.hint`)}</Text>
              </View>
              {item.professionalTab || item.setupStep ? (
                <Pressable
                  onPress={() => router.push((item.professionalTab ? `/professional?tab=${item.professionalTab}` : '/organization/setup') as never)}
                  style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceMuted }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                    {item.professionalTab ? t('businesses.verification.documents') : t('businesses.verification.complete')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {complete.length ? (
        <View style={{ gap: 6 }}>
          <Pressable onPress={() => setShowValidated((value) => !value)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>
              {t('businesses.verification.seeValidated', { count: complete.length })}
            </Text>
          </Pressable>
          {showValidated
            ? complete.map((item) => (
                <Text key={item.key} style={{ fontSize: 13, color: colors.textMuted }}>
                  <Text style={{ color: '#059669' }}>✓  </Text>
                  {label(item.key)}
                </Text>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
