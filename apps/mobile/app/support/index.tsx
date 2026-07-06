import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { loadTickets, TicketStatus } from '@/store/support';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_CONFIG: Record<TicketStatus, { label: string; tone: Tone }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  in_progress: { label: 'En cours', tone: 'brand' },
  waiting_user: { label: 'En attente', tone: 'info' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Fermé', tone: 'neutral' },
};

export default function SupportScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const { tickets, faq, loading } = useAppSelector((s) => s.support);
  const [tab, setTab] = useState<'tickets' | 'faq'>('faq');
  const [faqSearch, setFaqSearch] = useState('');

  useEffect(() => {
    if (userId) dispatch(loadTickets(userId));
  }, [dispatch, userId]);

  const filteredFaq = faq.filter((item) =>
    !faqSearch.trim() || item.question.toLowerCase().includes(faqSearch.toLowerCase()) || item.answer.toLowerCase().includes(faqSearch.toLowerCase()),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
        <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
      </Pressable>

      <PageHeader eyebrow="AIDE" title="Support" />

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'faq' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('faq')}
        >
          <Text style={[styles.tabText, { color: tab === 'faq' ? colors.primary : colors.textSecondary }]}>
            FAQ
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'tickets' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('tickets')}
        >
          <Text style={[styles.tabText, { color: tab === 'tickets' ? colors.primary : colors.textSecondary }]}>
            Mes tickets ({tickets.length})
          </Text>
        </Pressable>
      </View>

      {tab === 'faq' && (
        <>
          <View style={styles.searchWrap}>
            <Input
              placeholder="Rechercher dans la FAQ..."
              value={faqSearch}
              onChangeText={setFaqSearch}
            />
          </View>
          <FlatList
            data={filteredFaq}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.faqCard}>
                <Text style={[styles.faqQ, { color: colors.text }]}>❓ {item.question}</Text>
                <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.answer}</Text>
              </Card>
            )}
          />
        </>
      )}

      {tab === 'tickets' && (
        <>
          <View style={styles.searchWrap}>
            <Button onPress={() => router.push('/support/create' as any)}>
              + Nouveau ticket
            </Button>
          </View>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={() => { if (userId) dispatch(loadTickets(userId)); }}
            renderItem={({ item }) => {
              const cfg = STATUS_CONFIG[item.status];
              return (
                <Pressable onPress={() => router.push(`/support/${item.id}` as any)}>
                  <Card variant="interactive" style={styles.ticketCard}>
                    <View style={styles.ticketRow}>
                      <View style={styles.ticketBody}>
                        <Text style={[styles.ticketSubject, { color: colors.text }]}>{item.subject}</Text>
                        <Text style={[styles.ticketMeta, { color: colors.textMuted }]}>
                          {item.category} • {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                      <Badge tone={cfg.tone}>{cfg.label}</Badge>
                    </View>
                  </Card>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 40 }}>💬</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucun ticket. Créez-en un si vous avez besoin d'aide.
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  tab: { paddingBottom: spacing.sm },
  tabText: { ...typography.label, fontSize: 15 },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  faqCard: { gap: spacing.sm },
  faqQ: { ...typography.label, fontSize: 14 },
  faqA: { ...typography.bodySmall, lineHeight: 20 },
  ticketCard: { padding: spacing.lg },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ticketBody: { flex: 1, gap: spacing.xs },
  ticketSubject: { ...typography.label },
  ticketMeta: { fontSize: 11 },
  empty: { paddingVertical: spacing['3xl'], alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing['3xl'] },
});
