import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { loadBusinesses, selectOwnedBusinesses } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

/** Espace pro : fiche, publications, transferts si le service est déclaré (ProfessionalPage). */
export default function ProfessionalScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const businesses = useAppSelector((state) => state.account.businesses);
  const listings = useAppSelector((state) => state.marketplace.items);
  const jobs = useAppSelector((state) => state.dashboard.jobs);
  const events = useAppSelector((state) => state.dashboard.events);
  const owned = useMemo(() => selectOwnedBusinesses(businesses, userId), [businesses, userId]);
  const business = owned[0];

  useEffect(() => {
    if (userId) dispatch(loadBusinesses(userId));
  }, [dispatch, userId]);

  if (!business) {
    return (
      <AppChrome pathname="/professional">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <AppText className="text-2xl font-black text-app-text">Espace professionnel</AppText>
          <AppText className="text-sm text-app-text-muted">Créez une entreprise pour publier au nom d’une activité et recevoir des transferts.</AppText>
          <Pressable onPress={() => router.push('/organization/setup' as never)} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <AppText className="font-bold text-white">Créer une entreprise</AppText>
          </Pressable>
        </View>
      </AppChrome>
    );
  }

  const services = Array.isArray(business.services) ? business.services.map(String) : [];
  const publications =
    listings.filter((item) => item.businessId === business.id).length +
    jobs.filter((item) => item.businessId === business.id).length +
    events.filter((item) => item.businessId === business.id).length;

  return (
    <AppChrome pathname="/professional">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">Professionnel</AppText>
        <AppText className="text-2xl font-black text-app-text">{business.name}</AppText>
        <AppText className="text-sm text-app-text-muted">
          {[businessActivityLabel(business.primaryActivity), business.city, business.status].filter(Boolean).join(' · ')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Publications', String(publications)],
            ['Services', String(services.length || 0)],
            ['Avis', business.rating ? String(business.rating) : '—'],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <AppText className="text-lg font-black text-app-text">{value}</AppText>
              <AppText className="text-xs text-app-text-muted">{label}</AppText>
            </View>
          ))}
        </View>
        <AppText className="font-black text-app-text">Identité</AppText>
        <AppText className="text-sm text-app-text">{business.description || 'Aucune présentation.'}</AppText>
        <AppText className="text-sm text-app-text-muted">{[business.address, business.phone, business.email].filter(Boolean).join(' · ') || 'Coordonnées à compléter'}</AppText>
        <AppText className="font-black text-app-text">Activité</AppText>
        <AppText className="text-sm text-app-text-muted">{services.join(', ') || 'Aucun service déclaré'}</AppText>
        <Pressable onPress={() => router.push(`/organization/${business.id}` as never)}><AppText className="font-bold text-app-accent">Voir la fiche publique</AppText></Pressable>
        <Pressable onPress={() => router.push('/publications/mine' as never)}><AppText className="font-bold text-app-accent">Publications</AppText></Pressable>
        {services.includes('Transfert') ? (
          <Pressable onPress={() => router.push('/exchanger' as never)}><AppText className="font-bold text-app-accent">Tableau des transferts</AppText></Pressable>
        ) : null}
        <Pressable onPress={() => router.push('/organization/setup' as never)}><AppText className="font-bold text-app-text-muted">Mettre à jour la fiche</AppText></Pressable>
      </ScrollView>
    </AppChrome>
  );
}
