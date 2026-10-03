import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { ContactButton } from '@/components/communications/ContactButton';
import { AppText } from '@/components/ui/AppText';
import { FALLBACK_EXCHANGERS } from '@/constants/transfers';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Fiche partenaire (ExchangerDetailPage). */
export default function ExchangerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const businesses = useAppSelector((state) => state.account.businesses);
  const business = businesses.find((item) => item.id === id);
  const fallback = FALLBACK_EXCHANGERS.find((item) => item.id === id);
  const name = business?.name || fallback?.name;

  if (!name) {
    return (
      <AppChrome pathname="/exchangers">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Échangeur introuvable.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/exchangers">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <Pressable onPress={() => router.push('/exchangers' as never)}><AppText className="text-sm font-bold text-app-accent">← Échangeurs</AppText></Pressable>
        <AppText className="text-2xl font-black text-app-text">{name}</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Note', business?.rating ? String(business.rating) : String(fallback?.rating ?? '—')],
            ['Délai', String(business?.averageDelay || fallback?.averageDelay || '—')],
            ['Frais', `${business?.feePercent ?? fallback?.feePercent ?? '—'} %`],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <AppText className="font-black text-app-text">{value}</AppText>
              <AppText className="text-xs text-app-text-muted">{label}</AppText>
            </View>
          ))}
        </View>
        <AppText className="text-sm text-app-text-muted">{[business?.city, business?.country].filter(Boolean).join(', ') || 'Partenaire MOXT'}</AppText>
        <Pressable onPress={() => router.push(`/transfer/wizard?exchangerId=${id}` as never)} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Démarrer un transfert</AppText>
        </Pressable>
        {business ? (
          <>
            <Pressable onPress={() => router.push(`/organization/${business.id}` as never)}><AppText className="font-bold text-app-accent">Voir l’entreprise</AppText></Pressable>
            <ContactButton ownerId={business.ownerId} relatedType="business" relatedId={business.id} relatedPath={`/organization/${business.id}`} relatedTitle={business.name} label="Contacter" />
          </>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
