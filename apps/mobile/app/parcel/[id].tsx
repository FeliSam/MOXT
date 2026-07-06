import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { Button } from '@/components/ui/Button';
import { DetailFacts, DetailMetrics, DetailSection, TrustPanel } from '@/components/ui/DetailBlocks';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { useAppSelector } from '@/store/store';

export default function ParcelDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const parcel = useAppSelector((state) =>
    state.parcels.items.find((p: any) => p.id === id),
  ) as any;

  if (!parcel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>Colis introuvable</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  const canReserve = parcel.status === 'active' || parcel.status === 'open';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: spacing.lg }}>
        {/* ── Web : PageHeader eyebrow = ID, titre "Origine vers Destination" ── */}
        <PageHeader
          eyebrow={parcel.id}
          title={`${parcel.origin || '?'} vers ${parcel.destination || '?'}`}
          description={parcel.ownerName ? `Voyageur : ${parcel.ownerName}` : undefined}
          actions={
            <Button variant="secondary" onPress={() => router.back()}>← Retour</Button>
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {/* ── Web : DetailMetrics (date, kg, prix, transporteur) ── */}
          <DetailMetrics
            items={[
              { emoji: '📅', label: 'Départ', value: parcel.departureDate ? formatShortDate(parcel.departureDate) : '—' },
              { emoji: '⚖️', label: 'Kg disponibles', value: `${parcel.remainingKg ?? parcel.capacityKg ?? 0} kg` },
              { emoji: '💰', label: 'Prix / kg', value: parcel.pricePerKg != null ? `${parcel.pricePerKg} RUB` : '—' },
              { emoji: '🧳', label: 'Transporteur', value: parcel.ownerName || '—' },
            ]}
          />

          {/* ── Web : bloc route visuel, badge statut flottant -top-3 right-3 ── */}
          <View style={sx.routeWrap}>
            <View style={sx.routeBadge}>
              <StatusBadge status={parcel.status} />
            </View>
            <LinearGradient
              colors={[colors.accentSoft, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[sx.routeCard, { borderColor: colors.border }]}>
              <View style={sx.routeCities}>
                <View style={{ flex: 1 }}>
                  <Text style={[sx.routeCode, { color: colors.text }]}>{parcel.origin || '—'}</Text>
                  {parcel.fromCountry || parcel.originCountry ? (
                    <Text style={[sx.routeCountry, { color: colors.textMuted }]}>
                      {parcel.fromCountry || parcel.originCountry}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 18, color: brand[600] }}>✈</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[sx.routeCode, { color: colors.text }]}>{parcel.destination || '—'}</Text>
                  {parcel.toCountry || parcel.destinationCountry ? (
                    <Text style={[sx.routeCountry, { color: colors.textMuted }]}>
                      {parcel.toCountry || parcel.destinationCountry}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={[sx.routeKg, { color: colors.text }]}>
                {parcel.remainingKg ?? parcel.capacityKg ?? 0} kg disponibles
              </Text>
            </LinearGradient>
          </View>

          {/* ── Web : carte "Réservation" ── */}
          <View style={[sx.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <Text style={[sx.cardTitle, { color: colors.text }]}>Réservation</Text>
            <Text style={[sx.cardDesc, { color: colors.textMuted }]}>
              {canReserve
                ? 'Réservez vos kilos auprès du transporteur en quelques étapes.'
                : 'Ce trajet n’accepte plus de réservations.'}
            </Text>
            {canReserve ? (
              <Button
                variant="primary"
                size="lg"
                style={{ marginTop: 14 }}
                onPress={() => router.push(`/parcel/reserve?parcelId=${parcel.id}` as any)}>
                Réserver de l'espace
              </Button>
            ) : null}
          </View>

          {/* ── Web : DetailSection "Informations du transport" → DetailFacts ── */}
          <DetailSection title="Informations du transport">
            <DetailFacts
              items={[
                { label: 'Capacité totale', value: parcel.capacityKg != null ? `${parcel.capacityKg} kg` : null },
                { label: 'Kg restants', value: parcel.remainingKg != null ? `${parcel.remainingKg} kg` : null },
                { label: 'Max / article', value: parcel.maxWeightPerItem != null ? `${parcel.maxWeightPerItem} kg` : null },
                { label: 'Date limite de dépôt', value: parcel.depositDeadline ? formatShortDate(parcel.depositDeadline) : null },
                { label: 'Types acceptés', value: parcel.acceptedTypes?.length ? parcel.acceptedTypes.join(', ') : null },
                { label: 'Types refusés', value: parcel.rejectedTypes?.length ? parcel.rejectedTypes.join(', ') : null },
                { label: 'Conditions', value: parcel.conditions },
              ]}
            />
          </DetailSection>

          {/* ── Web : TrustPanel "Transport sécurisé" ── */}
          <TrustPanel
            title="Transport sécurisé"
            items={[
              'Vérifiez l’identité du transporteur avant de remettre un colis.',
              'Utilisez la messagerie MOXT pour garder une trace des échanges.',
              'Ne transportez jamais d’objets interdits ou non déclarés.',
              'Confirmez la remise du colis dans l’application.',
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const sx = StyleSheet.create({
  routeWrap: { position: 'relative', marginTop: 6 },
  /* web : badge absolu -top-3 right-3 flottant sur la bordure */
  routeBadge: { position: 'absolute', top: -12, right: 12, zIndex: 2 },
  routeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  routeCities: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeCode: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  routeCountry: { marginTop: 2, fontSize: 11, fontWeight: '700' },
  routeKg: { marginTop: 14, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },

  card: { borderRadius: radii.lg, borderWidth: 1, padding: 20 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  cardDesc: { marginTop: 6, fontSize: 13, lineHeight: 19 },
});
