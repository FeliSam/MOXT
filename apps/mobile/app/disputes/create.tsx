import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { createDispute, DisputeReason } from '@/store/disputes';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

const REASONS: { key: DisputeReason; label: string; icon: string }[] = [
  { key: 'non_received', label: 'Non reçu', icon: '📭' },
  { key: 'wrong_amount', label: 'Montant incorrect', icon: '💰' },
  { key: 'fraud', label: 'Fraude suspectée', icon: '🚨' },
  { key: 'damaged', label: 'Endommagé', icon: '📦' },
  { key: 'delay', label: 'Retard excessif', icon: '⏰' },
  { key: 'other', label: 'Autre', icon: '❓' },
];

const RELATED_TYPES: { key: string; label: string }[] = [
  { key: 'transfer', label: 'Transfert' },
  { key: 'parcel', label: 'Colis' },
  { key: 'listing', label: 'Annonce' },
  { key: 'payment', label: 'Paiement' },
];

export default function CreateDisputeScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [relatedType, setRelatedType] = useState<string>('transfer');
  const [relatedId, setRelatedId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description.trim() || !userId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createDispute({
        userId,
        relatedType: relatedType as any,
        relatedId: relatedId.trim() || 'N/A',
        reason,
        description: description.trim(),
      })).unwrap();
      Alert.alert('Litige créé', 'Votre litige a été enregistré. Nous vous répondrons rapidement.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>

        <PageHeader eyebrow="NOUVEAU LITIGE" title="Ouvrir un litige" />

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Motif *</Text>
          <View style={styles.chipGrid}>
            {REASONS.map((r) => (
              <Pressable
                key={r.key}
                style={[
                  styles.chip,
                  {
                    borderColor: reason === r.key ? colors.primary : colors.border,
                    backgroundColor: reason === r.key ? colors.primaryLight : colors.surface,
                  },
                ]}
                onPress={() => setReason(r.key)}
              >
                <Text style={{ fontSize: 18 }}>{r.icon}</Text>
                <Text style={[styles.chipText, { color: reason === r.key ? colors.primary : colors.text }]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Concerne</Text>
          <View style={styles.chipRow}>
            {RELATED_TYPES.map((t) => (
              <Pressable
                key={t.key}
                style={[
                  styles.typeChip,
                  {
                    borderColor: relatedType === t.key ? colors.primary : colors.border,
                    backgroundColor: relatedType === t.key ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => setRelatedType(t.key)}
              >
                <Text style={[styles.chipText, { color: relatedType === t.key ? colors.primary : colors.textSecondary }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Référence (ID)"
          placeholder="Ex: TRF-ABC123"
          value={relatedId}
          onChangeText={setRelatedId}
        />

        <Input
          label="Description *"
          placeholder="Décrivez votre problème en détail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
        />

        <Button size="lg" onPress={handleSubmit} loading={submitting} style={styles.submitBtn}>
          Soumettre le litige
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  section: { gap: spacing.sm },
  fieldLabel: { ...typography.label, marginTop: spacing.xs },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
  },
  chipText: { ...typography.label, fontSize: 13 },
  submitBtn: { marginTop: spacing.sm },
});
