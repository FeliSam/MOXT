import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Pilotage superadmin : volumes et accès aux outils réservés. */
export default function SuperAdminScreen() {
  const { colors } = useTheme();
  const role = useAppSelector((state) => state.auth.user?.role);
  const [counts, setCounts] = useState({ profiles: 0, businesses: 0, audit: 0 });

  useEffect(() => {
    if (role !== 'superadmin' || !supabase) return;
    const client = supabase;
    void Promise.all([
      client.from('profiles').select('id', { count: 'exact', head: true }),
      client.from('businesses').select('id', { count: 'exact', head: true }),
      client.from('moxt_audit_log').select('id', { count: 'exact', head: true }),
    ]).then(([profiles, businesses, audit]) => {
      setCounts({
        profiles: profiles.count || 0,
        businesses: businesses.count || 0,
        audit: audit.count || 0,
      });
    });
  }, [role]);

  if (role !== 'superadmin') {
    return (
      <AppChrome pathname="/superadmin">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <AppText className="text-sm text-app-text-muted">Réservé au superadmin.</AppText>
        </View>
      </AppChrome>
    );
  }

  return (
    <AppChrome pathname="/superadmin">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Pilotage</AppText>
        <AppText className="text-sm text-app-text-muted">Seul un superadmin peut promouvoir un administrateur. La purge de compte reste une action web confirmée par mot de passe.</AppText>
        {[
          ['Profils', counts.profiles],
          ['Entreprises', counts.businesses],
          ['Événements d’audit', counts.audit],
        ].map(([label, value]) => (
          <View key={String(label)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
            <AppText className="text-xl font-black text-app-text">{value}</AppText>
            <AppText className="text-xs text-app-text-muted">{label}</AppText>
          </View>
        ))}
        <Pressable onPress={() => router.push('/admin' as never)}><AppText className="font-bold text-app-accent">Centre d’administration</AppText></Pressable>
        <Pressable onPress={() => router.push('/contribute' as never)}><AppText className="font-bold text-app-accent">Contribuer</AppText></Pressable>
        <Pressable onPress={() => router.push('/admin/guide' as never)}><AppText className="font-bold text-app-accent">Guide interne</AppText></Pressable>
      </ScrollView>
    </AppChrome>
  );
}
