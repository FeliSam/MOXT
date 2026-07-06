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
import { supabase } from '@/services/supabase';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';

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
    if (!supabase || !user) return;
    if (!weight || Number(weight) <= 0) {
      Alert.alert('Poids requis', 'Indiquez le poids souhaité en kg.');
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('parcel_requests').insert({
        id: `REQ-${Date.now().toString(36).toUpperCase()}`,
        parcel_id: parcelId,
        user_id: user.id,
        weight_kg: Number(weight),
        description: description.trim(),
        status: 'pending',
        created_at: now,
      });
      if (error) throw new Error(error.message);
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
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }} onPress={() => router.back()}>
            <Text style={{ fontSize: 20, color: colors.primary }}>←</Text>
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Retour</Text>
          </Pressable>

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
