import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
import { AppText } from '@/components/ui/AppText';
import { loadBusinesses, selectOwnedBusinesses } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

const TABS = [
  ['ops', 'Opérations'],
  ['rates', 'Taux'],
  ['stats', 'Stats'],
] as const;

/** Tableau de bord échangeur : file, taux déclarés, volumes (ExchangerDashboardPage). */
export default function ExchangerDashboardScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
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

  if (!business || !services.includes('Transfert')) {
    return (
      <AppChrome pathname="/exchanger">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-2xl font-black text-app-text">Espace échangeur</AppText>
          <AppText className="text-sm text-app-text-muted">Déclarez une entreprise avec le service Transfert pour traiter les opérations.</AppText>
          <Pressable onPress={() => router.push('/professional' as never)}><AppText className="font-bold text-app-accent">Ouvrir l’espace pro</AppText></Pressable>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/exchanger">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">{business.name}</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['En attente', waiting.length],
            ['Terminés', done.length],
            ['Volume', mine.length],
          ].map(([label, value]) => (
            <View key={String(label)} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <AppText className="text-lg font-black text-app-text">{String(value)}</AppText>
              <AppText className="text-xs text-app-text-muted">{label}</AppText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TABS.map(([id, label]) => (
            <Pressable key={id} onPress={() => setTab(id)} style={{ flex: 1, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === id ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: tab === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
            </Pressable>
          ))}
        </View>
        {tab === 'ops'
          ? mine.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/transfer/${item.id}` as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
                <TransferStatusBadge status={String(item.status || '')} />
                <AppText className="font-bold text-app-text">{item.id}</AppText>
              </Pressable>
            ))
          : null}
        {tab === 'rates' ? (
          <AppText className="text-sm text-app-text-muted">
            Frais déclarés : {String(business.feePercent ?? '—')} % · délai {String(business.averageDelay || business.hours || '—')}
          </AppText>
        ) : null}
        {tab === 'stats' ? (
          <AppText className="text-sm text-app-text-muted">
            {done.length} opération(s) terminée(s) sur {mine.length}. Le détail des graphiques reste sur le web.
          </AppText>
        ) : null}
        {tab === 'ops' && mine.length === 0 ? <AppText className="text-sm text-app-text-muted">Aucune opération rattachée.</AppText> : null}
      </ScrollView>
    </AppChrome>
  );
}
