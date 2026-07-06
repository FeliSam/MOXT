import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { createTicket, TicketCategory, TicketPriority } from '@/store/support';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

const CATEGORIES: { key: TicketCategory; label: string; icon: string }[] = [
  { key: 'account', label: 'Compte', icon: '👤' },
  { key: 'transfer', label: 'Transfert', icon: '💸' },
  { key: 'parcel', label: 'Colis', icon: '📦' },
  { key: 'payment', label: 'Paiement', icon: '💳' },
  { key: 'technical', label: 'Technique', icon: '🔧' },
  { key: 'other', label: 'Autre', icon: '❓' },
];

const PRIORITIES: { key: TicketPriority; label: string }[] = [
  { key: 'low', label: 'Basse' },
  { key: 'normal', label: 'Normale' },
  { key: 'high', label: 'Haute' },
  { key: 'urgent', label: 'Urgente' },
];

export default function CreateTicketScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const user = useAppSelector((s) => s.auth.user);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('other');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || !user?.id) {
      Alert.alert('Erreur', 'Veuillez remplir le sujet et le message.');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createTicket({
        userId: user.id,
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        userName: `${user.firstName} ${user.lastName}`.trim(),
      })).unwrap();
      Alert.alert('Ticket créé', 'Notre équipe vous répondra rapidement.', [
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

        <PageHeader eyebrow="NOUVEAU TICKET" title="Nouveau ticket" />

        <Input
          label="Sujet *"
          placeholder="Résumé de votre problème"
          value={subject}
          onChangeText={setSubject}
        />

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Catégorie</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                style={[
                  styles.chip,
                  {
                    borderColor: category === c.key ? colors.primary : colors.border,
                    backgroundColor: category === c.key ? colors.primaryLight : colors.surface,
                  },
                ]}
                onPress={() => setCategory(c.key)}
              >
                <Text>{c.icon}</Text>
                <Text style={[styles.chipText, { color: category === c.key ? colors.primary : colors.text }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Priorité</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.key}
                style={[
                  styles.prioChip,
                  {
                    borderColor: priority === p.key ? colors.primary : colors.border,
                    backgroundColor: priority === p.key ? colors.primaryLight : 'transparent',
                  },
                ]}
                onPress={() => setPriority(p.key)}
              >
                <Text style={[styles.chipText, { color: priority === p.key ? colors.primary : colors.textSecondary }]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Message *"
          placeholder="Décrivez votre problème en détail..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 140 }}
        />

        <Button size="lg" onPress={handleSubmit} loading={submitting} style={styles.submitBtn}>
          Envoyer
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
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
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  prioChip: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
  },
  chipText: { ...typography.label, fontSize: 13 },
  submitBtn: { marginTop: spacing.sm },
});
