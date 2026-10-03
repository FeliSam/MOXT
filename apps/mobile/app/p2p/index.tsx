import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { P2POfferCard } from '@/components/dashboard/P2POfferCard';
import { AppText } from '@/components/ui/AppText';
import { PageHeader } from '@/components/ui/PageHeader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const CURRENCIES = ['XOF', 'RUB', 'EUR', 'USD'];

const CHECKLIST = [
  'p2p.trustChecklist.verifyIdentity',
  'p2p.trustChecklist.useInAppDetails',
  'p2p.trustChecklist.keepProofs',
  'p2p.trustChecklist.openDispute',
];

function CurrencyChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: active ? colors.accent : colors.surfaceMuted }}>
      <AppText className="text-xs font-bold" style={{ color: active ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
    </Pressable>
  );
}

/** Catalogue P2P (P2PPage) : bannière, checklist, onglets Actives / Archives. */
export default function P2PScreen() {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const offers = useAppSelector((state) => state.dashboard.p2pOffers);
  const orders = useAppSelector((state) => state.dashboard.p2pOrders);
  const reviews = useAppSelector((state) => state.dashboard.reviews);
  const [query, setQuery] = useState('');
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers
      .filter((offer) => (tab === 'active' ? offer.status === 'active' || !offer.status : offer.status !== 'active' && Boolean(offer.status)))
      .filter((offer) => !fromCurrency || offer.fromCurrency === fromCurrency)
      .filter((offer) => !toCurrency || offer.toCurrency === toCurrency)
      .filter((offer) => {
        if (!q) return true;
        return `${offer.fromCurrency} ${offer.toCurrency} ${offer.ownerName || ''} ${offer.method || ''}`.toLowerCase().includes(q);
      });
  }, [fromCurrency, offers, query, tab, toCurrency]);
  const myOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const row = order as { buyerId?: string; sellerId?: string; userId?: string };
          return row.buyerId === user?.id || row.sellerId === user?.id || row.userId === user?.id;
        })
        .slice(0, 5),
    [orders, user?.id],
  );

  return (
    <AppChrome pathname="/p2p">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <PageHeader
          className="mx-0"
          eyebrow={t('p2p.page.eyebrow')}
          title={t('p2p.page.title')}
          actions={
            <Pressable onPress={() => router.push('/p2p/publish' as never)}>
              <AppText className="text-xs font-bold" style={{ color: colors.accent }}>{t('p2p.page.proposeOffer')}</AppText>
            </Pressable>
          }
        />
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: isDark ? '#155e75' : '#a5f3fc', backgroundColor: isDark ? 'rgba(8,51,68,0.55)' : '#ecfeff', padding: 14 }}>
          <AppText className="text-sm leading-5 text-app-text">{t('p2p.noEscrowBanner')}</AppText>
        </View>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 8 }}>
          <AppText className="font-black text-app-text">{t('p2p.trustChecklist.title')}</AppText>
          {CHECKLIST.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <CheckCircle size={16} color={colors.accent} />
              <AppText className="flex-1 text-sm text-app-text-muted">{t(item)}</AppText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('p2p.page.searchPlaceholder')}
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 16 }}
          />
          <Pressable onPress={() => setAdvanced((value) => !value)}>
            <AppText className="text-xs font-bold" style={{ color: colors.accent }}>{advanced ? 'Masquer' : 'Filtres'}</AppText>
          </Pressable>
        </View>
        {advanced ? (
          <View style={{ gap: 8 }}>
            <AppText className="text-xs font-bold text-app-text-muted">{t('p2p.page.fromCurrency')}</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <CurrencyChip label={t('p2p.page.allCurrencies')} active={!fromCurrency} onPress={() => setFromCurrency('')} />
              {CURRENCIES.map((code) => (
                <CurrencyChip key={`from-${code}`} label={code} active={fromCurrency === code} onPress={() => setFromCurrency(code)} />
              ))}
            </ScrollView>
            <AppText className="text-xs font-bold text-app-text-muted">{t('p2p.page.toCurrency')}</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <CurrencyChip label={t('p2p.page.allCurrencies')} active={!toCurrency} onPress={() => setToCurrency('')} />
              {CURRENCIES.map((code) => (
                <CurrencyChip key={`to-${code}`} label={code} active={toCurrency === code} onPress={() => setToCurrency(code)} />
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 16 }}>
          {(
            [
              { key: 'active' as const, label: t('p2p.page.activeOffers'), count: offers.filter((offer) => offer.status === 'active' || !offer.status).length },
              { key: 'archived' as const, label: t('p2p.page.archives'), count: offers.filter((offer) => offer.status && offer.status !== 'active').length },
            ]
          ).map((item) => {
            const active = tab === item.key;
            return (
              <Pressable key={item.key} onPress={() => setTab(item.key)} style={{ paddingBottom: 10 }}>
                <AppText className="text-sm font-bold" style={{ color: active ? colors.text : colors.textMuted }}>
                  {item.label} · {item.count}
                </AppText>
                {active ? <View style={{ marginTop: 8, height: 2, borderRadius: 2, backgroundColor: colors.accent }} /> : null}
              </Pressable>
            );
          })}
        </View>
        {visible.map((offer) => (
          <P2POfferCard
            key={offer.id}
            offer={offer}
            orders={orders}
            reviews={reviews}
            ownerVerified={Boolean(offer.businessId) || (offer.ownerId === user?.id && Boolean(user?.verified))}
          />
        ))}
        {!visible.length ? (
          <AppText className="text-sm text-app-text-muted">
            {tab === 'active' ? t('p2p.page.emptyActiveTitle') : t('p2p.page.emptyArchiveTitle')}
          </AppText>
        ) : null}
        {myOrders.length ? (
          <View style={{ gap: 8 }}>
            <AppText className="font-black text-app-text">{t('p2p.page.recentOrders')}</AppText>
            {myOrders.map((order) => {
              const row = order as { id?: string; status?: string };
              return (
                <View key={String(row.id)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 12 }}>
                  <AppText className="text-sm font-bold text-app-text">{String(row.id || '')}</AppText>
                  <AppText className="text-xs text-app-text-muted">{String(row.status || '—')}</AppText>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
