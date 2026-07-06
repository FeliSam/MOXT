import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '@/services/supabase';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';

import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';

import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card, Button, Input, PageHeader } from '@/components/ui';

const DIRECTIONS = [
  { key: 'BJ_TO_RU', label: 'Bénin → Russie' },
  { key: 'RU_TO_BJ', label: 'Russie → Bénin' },
];

export default function CreateTransferScreen() {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [direction, setDirection] = useState('BJ_TO_RU');
  const [amount, setAmount] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const currencyFrom = direction === 'BJ_TO_RU' ? 'XOF' : 'RUB';

  async function handleSubmit() {
    if (!amount || !firstName.trim()) {
      Alert.alert('Champs requis', 'Renseignez le montant et le prénom du destinataire.');
      return;
    }

    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase non configuré.');
      const now = new Date().toISOString();
      const transferId = `MXT-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from('transfers').insert({
        id: transferId,
        user_id: user?.id,
        status: 'pending_payment',
        direction,
        amount_sent: Number(amount),
        currency_from: currencyFrom,
        currency_to: direction === 'BJ_TO_RU' ? 'RUB' : 'XOF',
        recipient: { firstName: firstName.trim(), lastName: lastName.trim() },
        origin_country: user?.originCountry || 'BJ',
        created_at: now,
        updated_at: now,
      });

      if (error) throw new Error(error.message);

      await dispatch(loadCoreData());
      Alert.alert('Transfert créé', `Référence : ${transferId}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de créer le transfert.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BOTTOM_NAV_PADDING }]}>
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
            <Text style={[styles.backLabel, { color: colors.primary }]}>Transferts</Text>
          </Pressable>

          <PageHeader
            eyebrow="NOUVEAU"
            title="Nouveau transfert"
            description="MVP — montant, direction, destinataire"
          />

          {/* Direction */}
          <Card>
            <Text style={[typography.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
              Direction
            </Text>
            <View style={styles.directionRow}>
              {DIRECTIONS.map((d) => (
                <Pressable
                  key={d.key}
                  style={[
                    styles.directionBtn,
                    {
                      borderColor: colors.borderMd,
                      backgroundColor: colors.surface,
                    },
                    direction === d.key && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                  onPress={() => setDirection(d.key)}>
                  <Text
                    style={[
                      styles.directionBtnText,
                      { color: colors.textMuted },
                      direction === d.key && { color: colors.primary },
                    ]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Amount */}
          <Input
            label={`Montant (${currencyFrom})`}
            keyboardType="numeric"
            placeholder="ex. 50000"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Recipient */}
          <Input
            label="Prénom du destinataire"
            placeholder="Prénom"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Input
            label="Nom (optionnel)"
            placeholder="Nom"
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            onPress={handleSubmit}
            style={{ marginTop: spacing.md }}
          >
            Créer le transfert
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.md },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  directionRow: { flexDirection: 'row', gap: spacing.sm },
  directionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  directionBtnText: { fontSize: 14, fontWeight: '600' },
});
