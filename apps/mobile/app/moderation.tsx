import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Row = Record<string, any>;

/** Files de modération : annonces, signalements, litiges. */
export default function ModerationScreen() {
  const { colors } = useTheme();
  const role = useAppSelector((state) => state.auth.user?.role);
  const allowed = role === 'moderator' || role === 'admin' || role === 'superadmin';
  const [listings, setListings] = useState<Row[]>([]);
  const [reports, setReports] = useState<Row[]>([]);
  const [disputes, setDisputes] = useState<Row[]>([]);

  useEffect(() => {
    if (!allowed || !supabase) return;
    const client = supabase;
    void Promise.all([
      client.from('listings').select('id, title, status').in('status', ['pending_review', 'reported']).limit(30),
      client.from('listing_reports').select('*').limit(30),
      client.from('disputes').select('*').limit(30),
    ]).then(([listingRes, reportRes, disputeRes]) => {
      setListings(fromRows(listingRes.data || []) as Row[]);
      setReports(fromRows(reportRes.error ? [] : reportRes.data || []) as Row[]);
      setDisputes(fromRows(disputeRes.error ? [] : disputeRes.data || []) as Row[]);
    });
  }, [allowed]);

  async function update(table: string, id: string, status: string, apply: () => void) {
    if (!supabase) return;
    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (error) showNotice('Modération', error.message);
    else apply();
  }

  if (!allowed) {
    return (
      <AppChrome pathname="/moderation">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Réservé à la modération.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/moderation">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Modération</AppText>
        <AppText className="font-black text-app-text">Annonces</AppText>
        {listings.length === 0 ? <AppText className="text-sm text-app-text-muted">Aucune annonce en attente.</AppText> : null}
        {listings.map((item) => (
          <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
            <AppText className="font-bold text-app-text">{item.title || item.id}</AppText>
            <AppText className="text-xs text-app-text-muted">{item.status}</AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => void update('listings', item.id, 'active', () => setListings((list) => list.filter((row) => row.id !== item.id)))}>
                <AppText className="text-xs font-bold text-app-accent">Publier</AppText>
              </Pressable>
              <Pressable onPress={() => void update('listings', item.id, 'rejected', () => setListings((list) => list.filter((row) => row.id !== item.id)))}>
                <AppText className="text-xs font-bold text-red-600">Refuser</AppText>
              </Pressable>
            </View>
          </View>
        ))}
        <AppText className="font-black text-app-text">Signalements</AppText>
        {reports.map((item) => (
          <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
            <AppText className="text-sm text-app-text">{item.reason || item.id}</AppText>
            <Pressable onPress={() => void update('listing_reports', item.id, 'resolved', () => setReports((list) => list.filter((row) => row.id !== item.id)))}>
              <AppText className="text-xs font-bold text-app-accent">Clore</AppText>
            </Pressable>
          </View>
        ))}
        <AppText className="font-black text-app-text">Litiges</AppText>
        {disputes.map((item) => (
          <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
            <AppText className="text-sm text-app-text">{item.subject || item.reason || item.id}</AppText>
            <AppText className="text-xs text-app-text-muted">{item.status}</AppText>
            <Pressable onPress={() => void update('disputes', item.id, 'resolved', () => setDisputes((list) => list.map((row) => (row.id === item.id ? { ...row, status: 'resolved' } : row))))}>
              <AppText className="text-xs font-bold text-app-accent">Résoudre</AppText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </AppChrome>
  );
}
