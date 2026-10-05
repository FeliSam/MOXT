import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { requestParcelReservation } from '@moxt/shared/services/contentWrites.js';
import { openContactConversation } from '@moxt/shared/services/contactService.js';
import { createAuthorNotification } from '@moxt/shared/services/authorNotifications.js';

import { supabase } from '@/services/supabase';
import { loadCoreData } from '@/store/data';
import { mapConversationRow, receiveRemoteConversation, sendMessage } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { BackHeader } from '@/components/chrome/BackHeader';

export default function ReserveParcelScreen() {
  const colors = useThemeColors();
  const { parcelId } = useLocalSearchParams<{ parcelId?: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const parcel = useAppSelector((state) =>
    state.parcels.items.find((p) => p.id === parcelId),
  );

  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReserve = async () => {
    if (!supabase || !user || !parcelId) return;
    if (!weight || Number(weight) <= 0) {
      Alert.alert('Poids requis', 'Indiquez le poids souhaité en kg.');
      return;
    }
    setLoading(true);
    try {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      const kg = Number(weight);
      await requestParcelReservation(supabase, {
        parcelId,
        userId: user.id,
        requesterName: name,
        ownerId: parcel?.ownerId || null,
        businessId: parcel?.businessId || null,
        kg,
      });
      const ownerId = parcel?.ownerId;
      if (ownerId && ownerId !== user.id) {
        const route = `${parcel?.origin || '—'} → ${parcel?.destination || '—'}`;
        const chatMessage = [route, `${kg} kg`, description.trim() || null].filter(Boolean).join('\n');
        await createAuthorNotification(supabase, {
          id: `NTF-${Date.now().toString(36).toUpperCase()}`,
          userId: ownerId,
          title: 'Nouvelle demande de colis',
          message: `${name || 'Un membre'} demande ${kg} kg.`,
          type: 'parcel',
          link: `/parcels/${parcelId}`,
          priority: 'high',
        }).catch(() => undefined);
        const result = await openContactConversation(supabase, {
          createdBy: user.id,
          ownerId,
          senderName: name,
          relatedType: 'parcel',
          relatedId: parcelId,
          relatedPath: `/parcels/${parcelId}`,
          relatedSnapshot: {
            type: 'parcel',
            id: parcelId,
            title: route,
            path: `/parcels/${parcelId}`,
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
      Alert.alert('Réservation envoyée', 'Le voyageur sera notifié de votre demande.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de réserver.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
          <BackHeader inline title="Réserver un colis" />

          <Text style={{ ...typography.title, color: colors.text }}>Réserver un colis</Text>

          {parcel ? (
            <Card variant="flat">
              <View style={{ gap: spacing.xs }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                  {parcel.origin} → {parcel.destination}
                </Text>
                <Text style={{ ...typography.bodySmall, color: colors.primary }}>
                  Capacité restante : {parcel.remainingKg ?? parcel.capacityKg ?? '?'} kg
                </Text>
              </View>
            </Card>
          ) : null}

          <Input
            label="Poids souhaité (kg) *"
            keyboardType="numeric"
            placeholder="ex. 3"
            value={weight}
            onChangeText={setWeight}
          />

          <Input
            label="Description du contenu"
            placeholder="Décrivez brièvement le contenu (vêtements, documents, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <Button variant="primary" size="lg" loading={loading} onPress={handleReserve}>
            Envoyer la demande
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
