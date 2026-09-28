import { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';

import { BackHeader } from '@/components/chrome/BackHeader';
import { loadBusiness, loadSubscriptions, selectMySubscriptions } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

const STATUS_LABELS: Record<string, string> = {
  verified: 'Vérifiée',
  approved: 'Approuvée',
  active: 'Active',
  pending: 'En attente',
  pending_review: 'En cours de vérification',
  rejected: 'Refusée',
  suspended: 'Suspendue',
};

/** Fiche entreprise (table `businesses`, comme /businesses/:id sur le web). */
export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const business = useAppSelector((state) => (id ? state.account.businessById[id] : undefined));
  const loading = useAppSelector((state) => Boolean(state.account.loading.business));
  const subscriptions = useAppSelector((state) => state.account.subscriptions);

  useEffect(() => {
    if (id) dispatch(loadBusiness(id));
    if (!subscriptions.length) dispatch(loadSubscriptions());
  }, [dispatch, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const following = useMemo(
    () =>
      selectMySubscriptions(subscriptions, userId).some(
        (item) => item.publisherType === 'business' && item.publisherId === id,
      ),
    [subscriptions, userId, id],
  );

  const facts: [string, string | undefined][] = business
    ? [
        ['Activité', businessActivityLabel(business.primaryActivity) || undefined],
        ['Activité secondaire', businessActivityLabel(business.secondaryActivity) || undefined],
        ['Ville', [business.city, business.country].filter(Boolean).join(', ') || undefined],
        ['Adresse', business.address || undefined],
        ['Horaires', business.hours || undefined],
        ['Téléphone', business.phone || undefined],
        ['E-mail', business.email || undefined],
        ['Statut', business.status ? STATUS_LABELS[business.status] || business.status : undefined],
        ['Membre depuis', business.createdAt ? new Date(business.createdAt).toLocaleDateString('fr-FR') : undefined],
      ]
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <BackHeader inline title="Entreprise" />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!business ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {loading ? 'Chargement…' : 'Entreprise introuvable.'}
          </Text>
        ) : (
          <>
            {business.bannerUrl ? (
              <Image source={{ uri: String(business.bannerUrl) }} style={styles.banner} />
            ) : (
              <View style={[styles.banner, { backgroundColor: brand[100] }]} />
            )}
            <View style={styles.identity}>
              {business.logoUrl ? (
                <Image source={{ uri: String(business.logoUrl) }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, { backgroundColor: brand[700] }]}>
                  <Text style={styles.logoText}>{String(business.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text testID="business-name" style={[styles.name, { color: colors.text }]}>
                  {business.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {following ? '✓ Abonné' : business.ownerId === userId ? 'Votre entreprise' : 'Entreprise'}
                </Text>
              </View>
            </View>
            {business.description ? (
              <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                {String(business.description)}
              </Text>
            ) : null}
            <View style={[styles.facts, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              {facts
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <View key={label} style={styles.factRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
                    <Text style={[styles.factValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  content: { padding: spacing.xl, gap: spacing.lg },
  banner: { width: '100%', height: 120, borderRadius: radii.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  name: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  facts: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  factRow: { gap: 2 },
  factValue: { ...typography.label, fontSize: 15 },
});
