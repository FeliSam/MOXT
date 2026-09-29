import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';
import { requestParcelReservation } from '@moxt/shared/services/contentWrites.js';
import { openContactConversation } from '@moxt/shared/services/contactService.js';
import { createAuthorNotification } from '@moxt/shared/services/authorNotifications.js';

import { Button } from '@/components/ui/Button';
import { DetailFacts, DetailMetrics, DetailSection, TrustPanel } from '@/components/ui/DetailBlocks';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { supabase } from '@/services/supabase';
import { loadCoreData } from '@/store/data';
import { loadParcelById } from '@/store/parcels';
import { mapConversationRow, receiveRemoteConversation, sendMessage } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { asStringList } from '@/utils/stringList';

/** publish.parcel.types du web (fr). */
const PARCEL_TYPE_LABELS: Record<string, string> = {
  clothes: 'Vêtements',
  food: 'Alimentaire',
  electronics: 'Électronique',
  documents: 'Documents',
  cosmetics: 'Cosmétiques',
  gifts: 'Cadeaux',
  medicine: 'Médicaments',
};

function parcelTypeLabels(value: unknown) {
  const labels = asStringList(value).map((slug) => PARCEL_TYPE_LABELS[slug] || slug);
  return labels.length ? labels.join(', ') : null;
}

export default function ParcelDetailScreen() {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const parcel = useAppSelector((state) =>
    state.parcels.items.find((p: any) => p.id === id),
  ) as any;
  const [kg, setKg] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(!parcel);

  useEffect(() => {
    if (!id || parcel) {
      setPending(false);
      return undefined;
    }
    let alive = true;
    dispatch(loadParcelById(String(id)))
      .finally(() => {
        if (alive) setPending(false);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [dispatch, id, parcel]);

  if (!parcel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ ...typography.sectionTitle, color: colors.text }}>{pending ? 'Chargement…' : 'Colis introuvable'}</Text>
          <Button variant="primary" onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  const canReserve = (parcel.status === 'active' || parcel.status === 'open') && parcel.remainingKg > 0 && user?.id !== parcel.ownerId;
  const price = parcel.pricePerKg != null ? formatCurrency(parcel.pricePerKg, parcel.currency || 'RUB') : '—';
  const deposit = parcel.depositDeadline ? formatShortDate(parcel.depositDeadline) : '—';
  const distribution = parcel.distributionDate || parcel.pickupDate;

  async function submitReservation() {
    if (!supabase || !user || !parcel) return;
    const weight = Number(kg);
    if (!weight || weight <= 0) {
      Alert.alert('Poids requis', 'Indiquez le poids souhaité en kg.');
      return;
    }
    setSending(true);
    try {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      await requestParcelReservation(supabase, {
        parcelId: parcel.id,
        userId: user.id,
        requesterName: name,
        ownerId: parcel.ownerId || null,
        businessId: parcel.businessId || null,
        kg: weight,
      });
      const ownerId = parcel.ownerId;
      if (ownerId && ownerId !== user.id) {
        const route = `${parcel.origin || '—'} → ${parcel.destination || '—'}`;
        const chatMessage = [route, `${weight} kg`, message.trim() || null].filter(Boolean).join('\n');
        await createAuthorNotification(supabase, {
          id: `NTF-${Date.now().toString(36).toUpperCase()}`,
          userId: ownerId,
          title: 'Nouvelle demande de colis',
          message: `${name || 'Un membre'} demande ${weight} kg.`,
          type: 'parcel',
          link: `/parcels/${parcel.id}`,
          priority: 'high',
        }).catch(() => undefined);
        const result = await openContactConversation(supabase, {
          createdBy: user.id,
          ownerId,
          senderName: name,
          relatedType: 'parcel',
          relatedId: parcel.id,
          relatedPath: `/parcels/${parcel.id}`,
          relatedSnapshot: {
            type: 'parcel',
            id: parcel.id,
            title: route,
            path: `/parcels/${parcel.id}`,
          },
        });
        dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
        await dispatch(sendMessage({
          conversationId: result.id,
          senderId: user.id,
          senderName: name || 'Membre',
          text: chatMessage,
        }));
        router.replace(`/messages/${result.id}` as never);
        return;
      }
      await dispatch(loadCoreData());
      Alert.alert('Réservation envoyée', 'Le voyageur sera notifié de votre demande.');
      setKg('');
      setMessage('');
    } catch (error) {
      Alert.alert('Réservation', error instanceof Error ? error.message : 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: spacing.lg }}>
        <PageHeader
          title={`${parcel.origin || '?'} vers ${parcel.destination || '?'}`}
          actions={
            <Button variant="secondary" onPress={() => router.back()}>← Retour</Button>
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          <View style={sx.routeWrap}>
            <View style={sx.routeBadge}>
              <StatusBadge status={parcel.status} />
            </View>
            <View style={[sx.routeCard, { borderColor: colors.border, backgroundColor: colors.surface }, shadows.card]}>
              <View style={sx.routeCities}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[sx.routeLabel, { color: colors.textFaint }]}>ORIGINE</Text>
                  <Text style={[sx.routeCode, { color: colors.text }]} numberOfLines={1}>{parcel.origin || '—'}</Text>
                  {parcel.originAirportCode ? (
                    <Text style={[sx.routeCountry, { color: colors.textMuted }]}>{parcel.originAirportCode}</Text>
                  ) : null}
                </View>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: brand[700] }}>
                  <Text style={{ color: '#fff', fontWeight: '900' }}>→</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[sx.routeLabel, { color: colors.textFaint }]}>DESTINATION</Text>
                  <Text style={[sx.routeCode, { color: colors.text }]} numberOfLines={1}>{parcel.destination || '—'}</Text>
                  {parcel.destinationAirportCode ? (
                    <Text style={[sx.routeCountry, { color: colors.textMuted }]}>{parcel.destinationAirportCode}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <DetailMetrics
            items={[
              { emoji: '📦', label: 'Kg restants', value: `${parcel.remainingKg ?? parcel.capacityKg ?? 0} kg` },
              { emoji: '💰', label: 'Tarif', value: `${price} / kg` },
              { emoji: '📅', label: 'Départ', value: parcel.departureDate ? formatShortDate(parcel.departureDate) : '—' },
              { emoji: '📥', label: 'Limite de dépôt', value: deposit },
              { emoji: '📤', label: 'Distribution', value: distribution ? formatShortDate(distribution) : 'À confirmer' },
              { emoji: '📍', label: 'Trajet', value: `${parcel.origin || '—'} → ${parcel.destination || '—'}` },
            ]}
          />

          <View style={[sx.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <Text style={{ fontSize: 28 }}>📦</Text>
            <Text style={[sx.cardTitle, { color: colors.text, marginTop: 12, fontSize: 20 }]}>
              {parcel.remainingKg ?? 0} kg disponibles
            </Text>
            <Text style={[sx.cardDesc, { color: colors.textMuted }]}>{price} par kilogramme</Text>
            <Text style={{ marginTop: 12, borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 12, fontWeight: '700', color: colors.text }}>
              Dépôt avant le {deposit}
            </Text>
            {parcel.conditions ? (
              <Text style={{ marginTop: 12, fontSize: 14, lineHeight: 22, color: colors.text }}>{parcel.conditions}</Text>
            ) : null}
            {parcel.ownerName ? (
              <Text style={{ marginTop: 12, fontSize: 13, color: colors.textMuted }}>
                Transporteur : {parcel.ownerName}{parcel.contact ? ` · ${parcel.contact}` : ''}
              </Text>
            ) : null}
          </View>

          {canReserve ? (
            <View style={[sx.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <Text style={[sx.cardTitle, { color: colors.text }]}>Réserver de l'espace</Text>
              <Text style={[sx.cardDesc, { color: colors.textMuted }]}>
                Indiquez le poids et un message. La demande part au voyageur.
              </Text>
              <View style={{ marginTop: 12, gap: 12 }}>
                <Input
                  label="Poids (kg)"
                  keyboardType="numeric"
                  value={kg}
                  onChangeText={setKg}
                  placeholder={`1 – ${parcel.remainingKg ?? ''}`}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Message</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Précisez le colis, le lieu de dépôt…"
                  placeholderTextColor={colors.textFaint}
                  multiline
                  style={{
                    minHeight: 96,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                    padding: 12,
                    color: colors.text,
                    textAlignVertical: 'top',
                  }}
                />
                <Button variant="primary" size="lg" loading={sending} onPress={() => void submitReservation()}>
                  {sending ? 'Envoi…' : 'Envoyer la demande'}
                </Button>
              </View>
            </View>
          ) : null}

          <DetailSection title="Informations du transport">
            <DetailFacts
              items={[
                { label: 'Origine', value: parcel.origin },
                { label: 'Destination', value: parcel.destination },
                { label: 'Capacité totale', value: parcel.capacityKg != null ? `${parcel.capacityKg} kg` : null },
                { label: 'Kg restants', value: parcel.remainingKg != null ? `${parcel.remainingKg} kg` : null },
                { label: 'Max / article', value: parcel.maxWeightPerItem != null ? `${parcel.maxWeightPerItem} kg` : null },
                { label: 'Date limite de dépôt', value: parcel.depositDeadline ? formatShortDate(parcel.depositDeadline) : null },
                { label: 'Types acceptés', value: parcelTypeLabels(parcel.acceptedTypes) },
                { label: 'Types refusés', value: parcelTypeLabels(parcel.rejectedTypes) },
                { label: 'Conditions', value: parcel.conditions },
              ]}
            />
          </DetailSection>

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
  routeBadge: { position: 'absolute', top: -12, right: 12, zIndex: 2 },
  routeCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  routeCities: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  routeCode: { marginTop: 4, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  routeCountry: { marginTop: 2, fontSize: 11, fontWeight: '700' },
  card: { borderRadius: radii.lg, borderWidth: 1, padding: 20 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  cardDesc: { marginTop: 6, fontSize: 13, lineHeight: 19 },
});
