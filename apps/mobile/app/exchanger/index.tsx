import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Clock, DollarSign, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';
import { loadBusinesses, selectOwnedBusinesses } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';

const TABS = [
  ['ops', 'Opérations'],
  ['rates', 'Taux & Délais'],
  ['stats', 'Statistiques'],
] as const;

/** Tableau de bord échangeur : file, taux déclarés, volumes (ExchangerDashboardPage). */
export default function ExchangerDashboardScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const shadows = useShadows();
  const { onScroll } = useSmartNavbarScroll();

  const user = useAppSelector((state) => state.auth.user);
  const businesses = useAppSelector((state) => state.account.businesses);
  const transfers = useAppSelector((state) => state.transfers.items) as Record<string, any>[];
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('ops');
  const owned = useMemo(() => selectOwnedBusinesses(businesses, user?.id), [businesses, user?.id]);
  const business = owned[0];
  const services = Array.isArray(business?.services) ? business.services.map(String) : [];

  useEffect(() => {
    if (user?.id) dispatch(loadBusinesses(user.id));
  }, [dispatch, user?.id]);

  const mine = transfers.filter((item) => item.businessId === business?.id || item.businessOwnerId === user?.id);
  const waiting = mine.filter((item) =>
    [TRANSFER_STATUS.PENDING_ACCEPTANCE, TRANSFER_STATUS.DECLARED, TRANSFER_STATUS.RECEIVED].includes(item.status),
  );
  const done = mine.filter((item) => item.status === TRANSFER_STATUS.COMPLETED);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/exchangers' as never);
  };

  if (!business || !services.includes('Transfert')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom + 100, 140),
            gap: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              accessibilityLabel="Retour"
              onPress={handleBack}
              style={[
                {
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                shadows.card,
              ]}
            >
              <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
            </Pressable>
            <AppText className="text-lg font-black text-app-text">Espace échangeur</AppText>
          </View>

          <Card variant="flat" className="p-5 gap-3 rounded-2xl" style={shadows.card}>
            <AppText className="text-base font-bold text-app-text">Aucun profil échangeur rattaché</AppText>
            <AppText className="text-sm text-app-text-muted leading-relaxed">
              Pour traiter les opérations de transfert et afficher vos taux sur Moxt, vous devez déclarer une entreprise et activer le service Transfert.
            </AppText>
            <Pressable
              onPress={() => router.push('/professional' as never)}
              style={[
                {
                  marginTop: 6,
                  minHeight: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                },
                shadows.card,
              ]}
            >
              <AppText className="text-xs font-bold" style={{ color: isDark ? '#020617' : '#ffffff' }}>
                Ouvrir l'espace pro
              </AppText>
            </Pressable>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom + 100, 140),
          gap: 16,
        }}
      >
        {/* Droplet Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={handleBack}
            style={[
              {
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
              shadows.card,
            ]}
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.4} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText className="text-lg font-black text-app-text" numberOfLines={1}>
              {business.name}
            </AppText>
            <AppText className="text-xs text-app-text-muted" numberOfLines={1}>
              Tableau de bord échangeur
            </AppText>
          </View>
        </View>

        {/* Metric tiles */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            ['En attente', waiting.length, colors.accent],
            ['Terminés', done.length, '#10b981'],
            ['Total', mine.length, colors.text],
          ].map(([label, value, tint]) => (
            <Card
              key={String(label)}
              variant="flat"
              className="flex-1 p-3.5 rounded-2xl items-center"
              style={shadows.card}
            >
              <AppText className="text-xl font-black" style={{ color: String(tint) }}>
                {String(value)}
              </AppText>
              <AppText className="text-xs text-app-text-muted mt-0.5">{String(label)}</AppText>
            </Card>
          ))}
        </View>

        {/* Tab Selector */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TABS.map(([id, label]) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={[
                  {
                    flex: 1,
                    minHeight: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : colors.surface,
                  },
                  shadows.card,
                ]}
              >
                <AppText
                  className="text-xs font-bold"
                  style={{ color: active ? (isDark ? '#020617' : '#ffffff') : colors.text }}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Tab: Operations */}
        {tab === 'ops' ? (
          mine.length > 0 ? (
            <View style={{ gap: 10 }}>
              {mine.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/transfer/${item.id}` as never)}
                >
                  <Card variant="flat" className="p-4 gap-2 rounded-2xl" style={shadows.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AppText className="font-bold text-app-text">{item.id}</AppText>
                      <TransferStatusBadge status={String(item.status || '')} />
                    </View>
                    {item.sendAmount ? (
                      <AppText className="text-xs text-app-text-muted">
                        Montant : {item.sendAmount} {item.sendCurrency || 'RUB'} → {item.receiveAmount || '—'} {item.receiveCurrency || 'XOF'}
                      </AppText>
                    ) : null}
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <Card variant="flat" className="p-6 items-center rounded-2xl" style={shadows.card}>
              <AppText className="text-sm text-app-text-muted">Aucune opération rattachée pour le moment.</AppText>
            </Card>
          )
        ) : null}

        {/* Tab: Rates */}
        {tab === 'rates' ? (
          <Card variant="flat" className="p-4 gap-3 rounded-2xl" style={shadows.card}>
            <AppText className="text-sm font-bold text-app-text">Taux et conditions actuelles</AppText>
            <View style={{ gap: 6 }}>
              <AppText className="text-xs text-app-text-muted">
                Frais déclarés : <AppText className="font-bold text-app-text">{String(business.feePercent ?? '—')} %</AppText>
              </AppText>
              <AppText className="text-xs text-app-text-muted">
                Délai moyen constaté : <AppText className="font-bold text-app-text">{String(business.averageDelay || business.hours || '—')}</AppText>
              </AppText>
            </View>
            <Pressable
              onPress={() => router.push('/organization/setup' as never)}
              style={[
                {
                  marginTop: 6,
                  minHeight: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                shadows.card,
              ]}
            >
              <AppText className="text-xs font-bold text-app-text">Modifier les paramètres du service</AppText>
            </Pressable>
          </Card>
        ) : null}

        {/* Tab: Stats */}
        {tab === 'stats' ? (
          <Card variant="flat" className="p-4 gap-2 rounded-2xl" style={shadows.card}>
            <AppText className="text-sm font-bold text-app-text">Synthèse d'activité</AppText>
            <AppText className="text-xs text-app-text-muted leading-relaxed">
              {done.length} opération(s) terminée(s) avec succès sur un total de {mine.length} transfert(s) reçus.
            </AppText>
            <AppText className="text-xs text-app-text-faint mt-1">
              Les rapports financiers détaillés et graphiques de rentabilité sont consultables sur le portail web.
            </AppText>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
