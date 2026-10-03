import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { DEV_MODULE_IDS, DEFAULT_DEV_MODULE_FLAGS } from '@moxt/shared/config/moduleFlags.js';
import { fetchAppModuleFlags } from '@moxt/shared/services/moduleFlagsService.js';
import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { TransferStatusBadge } from '@/components/transfers/TransferStatusBadge';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

const VIEWS = [
  ['overview', 'Vue'],
  ['users', 'Utilisateurs'],
  ['transfers', 'Transferts'],
  ['p2p', 'P2P'],
  ['verifications', 'Vérifications'],
  ['modules', 'Modules'],
  ['rates', 'Taux'],
  ['support', 'Support'],
  ['audit', 'Audit'],
] as const;

type ViewId = (typeof VIEWS)[number][0];
type Row = Record<string, any>;

const RATES_KEY = 'moxt-platform-rates-v1';

async function rows(table: string, limit = 40) {
  if (!supabase) return [] as Row[];
  const { data, error } = await supabase.from(table).select('*').limit(limit);
  if (error) return [];
  return fromRows(data || []) as Row[];
}

/** Centre d’administration : les vues du web (utilisateurs, transferts, P2P, vérifications, modules, taux, support, audit). */
export function AdminDesk() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [view, setView] = useState<ViewId>('overview');
  const [users, setUsers] = useState<Row[]>([]);
  const [transfers, setTransfers] = useState<Row[]>([]);
  const [offers, setOffers] = useState<Row[]>([]);
  const [orders, setOrders] = useState<Row[]>([]);
  const [verifications, setVerifications] = useState<Row[]>([]);
  const [tickets, setTickets] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({ ...DEFAULT_DEV_MODULE_FLAGS });
  const [fees, setFees] = useState({ transferFeePercent: '2.5', p2pFeePercent: '1' });
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    void Promise.all([
      rows('profiles', 60),
      rows('transfers', 40),
      rows('p2p_offers', 40),
      rows('p2p_orders', 40),
      rows('verification_requests', 40),
      rows('support_tickets', 40),
      rows('moxt_audit_log', 40),
    ]).then(([nextUsers, nextTransfers, nextOffers, nextOrders, nextVerifications, nextTickets, nextAudit]) => {
      setUsers(nextUsers);
      setTransfers(nextTransfers);
      setOffers(nextOffers);
      setOrders(nextOrders);
      setVerifications(nextVerifications);
      setTickets(nextTickets);
      setAudit(nextAudit);
    });
    if (supabase) {
      void fetchAppModuleFlags(supabase).then((result) => setFlags(result.flags as Record<string, boolean>));
    }
    void AsyncStorage.getItem(RATES_KEY).then((raw) => {
      if (!raw) return;
      try {
        setFees((current) => ({ ...current, ...JSON.parse(raw) }));
      } catch {
        // taux locaux illisibles : on garde les valeurs par défaut
      }
    });
  }, [isAdmin]);

  async function patch(table: string, id: string, values: Record<string, unknown>, apply: (row: Row) => void) {
    if (!supabase) return;
    const { error } = await supabase.from(table).update(values).eq('id', id);
    if (error) showNotice('Admin', error.message);
    else apply({ id, ...values });
  }

  if (!isAdmin) {
    return (
      <AppChrome pathname="/admin">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 8 }}>
          <AppText className="text-2xl font-black text-app-text">Accès réservé</AppText>
          <AppText className="text-sm text-app-text-muted">Cette section est réservée aux administrateurs.</AppText>
        </View>
      </AppChrome>
    );
  }

  const chip = (id: ViewId, label: string) => (
    <Pressable key={id} onPress={() => setView(id)} style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: view === id ? colors.accent : colors.surfaceMuted }}>
      <AppText className="text-xs font-bold" style={{ color: view === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
    </Pressable>
  );

  return (
    <AppChrome pathname="/admin">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Administration</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {VIEWS.map(([id, label]) => chip(id, label))}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Pressable onPress={() => router.push('/moderation' as never)}><AppText className="text-sm font-bold text-app-accent">Modération</AppText></Pressable>
          <Pressable onPress={() => router.push('/feature-matrix' as never)}><AppText className="text-sm font-bold text-app-accent">Matrice</AppText></Pressable>
          <Pressable onPress={() => router.push('/admin/guide' as never)}><AppText className="text-sm font-bold text-app-accent">Guide admin</AppText></Pressable>
          <Pressable onPress={() => router.push('/contribute' as never)}><AppText className="text-sm font-bold text-app-accent">Contribuer</AppText></Pressable>
          {user?.role === 'superadmin' ? (
            <Pressable onPress={() => router.push('/superadmin' as never)}><AppText className="text-sm font-bold text-app-accent">Pilotage</AppText></Pressable>
          ) : null}
        </View>

        {view === 'overview' ? (
          <View style={{ gap: 8 }}>
            {[
              ['Utilisateurs', users.length],
              ['Transferts', transfers.length],
              ['Offres P2P', offers.length],
              ['Vérifications', verifications.filter((item) => item.status === 'pending_review' || item.status === 'pending').length],
              ['Support', tickets.filter((item) => item.status !== 'resolved').length],
            ].map(([label, value]) => (
              <AppText key={String(label)} className="text-sm text-app-text">{label} · {value}</AppText>
            ))}
            <Pressable onPress={() => router.push('/admin/stats' as never)}><AppText className="font-bold text-app-accent">Statistiques détaillées</AppText></Pressable>
          </View>
        ) : null}

        {view === 'users'
          ? users.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
                <AppText className="font-bold text-app-text">{[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email || item.id}</AppText>
                <AppText className="text-xs text-app-text-muted">{item.role || 'user'} · {item.status || 'active'}</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable onPress={() => void patch('profiles', item.id, { status: item.status === 'suspended' ? 'active' : 'suspended' }, () => setUsers((list) => list.map((row) => (row.id === item.id ? { ...row, status: item.status === 'suspended' ? 'active' : 'suspended' } : row))))}>
                    <AppText className="text-xs font-bold text-app-accent">{item.status === 'suspended' ? 'Réactiver' : 'Suspendre'}</AppText>
                  </Pressable>
                  {['user', 'professional', 'moderator', ...(user?.role === 'superadmin' ? ['admin'] : [])].map((role) => (
                    <Pressable key={role} onPress={() => void patch('profiles', item.id, { role }, () => setUsers((list) => list.map((row) => (row.id === item.id ? { ...row, role } : row))))}>
                      <AppText className="text-xs font-bold text-app-text">{role}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          : null}

        {view === 'transfers'
          ? transfers.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/transfer/${item.id}` as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
                <TransferStatusBadge status={String(item.status || '')} />
                <AppText className="font-bold text-app-text">{item.id}</AppText>
              </Pressable>
            ))
          : null}

        {view === 'p2p' ? (
          <View style={{ gap: 10 }}>
            {offers.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
                <AppText className="font-bold text-app-text">{item.fromCurrency} → {item.toCurrency} · {item.status}</AppText>
                <Pressable onPress={() => void patch('p2p_offers', item.id, { status: item.status === 'archived' ? 'active' : 'archived' }, () => setOffers((list) => list.map((row) => (row.id === item.id ? { ...row, status: item.status === 'archived' ? 'active' : 'archived' } : row))))}>
                  <AppText className="text-xs font-bold text-app-accent">{item.status === 'archived' ? 'Réactiver' : 'Archiver'}</AppText>
                </Pressable>
              </View>
            ))}
            {orders.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
                <AppText className="font-bold text-app-text">Commande {item.status}</AppText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {['completed', 'cancelled', 'disputed'].map((status) => (
                    <Pressable key={status} onPress={() => void patch('p2p_orders', item.id, { status }, () => setOrders((list) => list.map((row) => (row.id === item.id ? { ...row, status } : row))))}>
                      <AppText className="text-xs font-bold text-app-text">{status}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {view === 'verifications'
          ? verifications.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
                <AppText className="font-bold text-app-text">{item.userId || item.id}</AppText>
                <AppText className="text-xs text-app-text-muted">{item.status}</AppText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => void patch('verification_requests', item.id, { status: 'verified' }, () => setVerifications((list) => list.map((row) => (row.id === item.id ? { ...row, status: 'verified' } : row))))}>
                    <AppText className="text-xs font-bold text-app-accent">Approuver</AppText>
                  </Pressable>
                  <Pressable onPress={() => void patch('verification_requests', item.id, { status: 'rejected' }, () => setVerifications((list) => list.map((row) => (row.id === item.id ? { ...row, status: 'rejected' } : row))))}>
                    <AppText className="text-xs font-bold text-red-600">Refuser</AppText>
                  </Pressable>
                </View>
              </View>
            ))
          : null}

        {view === 'modules'
          ? DEV_MODULE_IDS.map((id: string) => (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                <AppText className="font-bold text-app-text">{id}</AppText>
                <Switch
                  value={flags[id] !== false}
                  onValueChange={(value) => {
                    const next = { ...flags, [id]: value };
                    setFlags(next);
                    void supabase?.rpc('admin_update_app_module_flags', { p_config: next }).then(({ error }) => {
                      if (error) showNotice('Modules', error.message);
                    });
                  }}
                />
              </View>
            ))
          : null}

        {view === 'rates' ? (
          <View style={{ gap: 8 }}>
            <AppText className="text-sm text-app-text-muted">Frais de plateforme conservés sur cet appareil, comme le réglage local du web.</AppText>
            <TextInput value={fees.transferFeePercent} onChangeText={(transferFeePercent) => setFees((current) => ({ ...current, transferFeePercent }))} keyboardType="decimal-pad" placeholder="Frais transfert %" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
            <TextInput value={fees.p2pFeePercent} onChangeText={(p2pFeePercent) => setFees((current) => ({ ...current, p2pFeePercent }))} keyboardType="decimal-pad" placeholder="Frais P2P %" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
            <Pressable onPress={() => void AsyncStorage.setItem(RATES_KEY, JSON.stringify(fees)).then(() => showNotice('Taux', 'Frais enregistrés sur cet appareil.'))}>
              <AppText className="font-bold text-app-accent">Enregistrer</AppText>
            </Pressable>
          </View>
        ) : null}

        {view === 'support'
          ? tickets.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
                <AppText className="font-bold text-app-text">{item.subject || item.id}</AppText>
                <AppText className="text-xs text-app-text-muted">{item.status} · {item.category || 'support'}</AppText>
                <TextInput value={reply} onChangeText={setReply} placeholder="Réponse" placeholderTextColor={colors.textFaint} style={{ minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
                <Pressable
                  onPress={() =>
                    void patch('support_tickets', item.id, { status: 'resolved', reply }, () =>
                      setTickets((list) => list.map((row) => (row.id === item.id ? { ...row, status: 'resolved' } : row))),
                    )
                  }>
                  <AppText className="text-xs font-bold text-app-accent">Résoudre</AppText>
                </Pressable>
              </View>
            ))
          : null}

        {view === 'audit'
          ? audit.map((item) => (
              <View key={item.id || `${item.action}-${item.createdAt}`} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                <AppText className="font-bold text-app-text">{item.action || item.event || item.id}</AppText>
                <AppText className="text-xs text-app-text-muted">{item.createdAt || item.actorId || ''}</AppText>
              </View>
            ))
          : null}
      </ScrollView>
    </AppChrome>
  );
}
