import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { directionLabel } from '@moxt/shared/utils/transfers.js';
import { formatCurrency, formatShortDate } from '@moxt/shared/utils/formatters.js';

import { useAppSelector } from '@/store/store';

import { BOTTOM_NAV_PADDING } from '@/components/navigation/BottomNavBar';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card, Button, StatusBadge } from '@/components/ui';

export default function TransferReceiptScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transfer = useAppSelector((state) =>
    state.transfers.items.find((t) => t.id === id),
  );

  if (!transfer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Transfert introuvable
        </Text>
      </SafeAreaView>
    );
  }

  const recipientName = [transfer.recipient?.firstName, transfer.recipient?.lastName].filter(Boolean).join(' ') || '-';

  const receiptText = [
    '═══════════════════════════',
    '         REÇU MOXT',
    '═══════════════════════════',
    '',
    `Réf : ${transfer.id}`,
    `Date : ${transfer.createdAt ? formatShortDate(transfer.createdAt) : '-'}`,
    `Statut : ${transfer.status?.toUpperCase()}`,
    '',
    `Direction : ${directionLabel(transfer.direction || 'bj_to_ru')}`,
    '',
    `Montant envoyé : ${formatCurrency(transfer.amountSent ?? 0, transfer.currencyFrom || 'XOF')}`,
    `Montant reçu : ${formatCurrency(transfer.receivedAmount ?? 0, transfer.currencyTo || 'RUB')}`,
    `Frais : ${formatCurrency(transfer.fee ?? 0, transfer.currencyFrom || 'XOF')}`,
    '',
    `Bénéficiaire : ${recipientName}`,
    '',
    '───────────────────────────',
    ' Merci d\'utiliser MOXT !',
    '═══════════════════════════',
  ].join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        message: receiptText,
        title: `Reçu MOXT — ${transfer.id}`,
      });
    } catch {
      Alert.alert('Erreur', 'Partage impossible.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BOTTOM_NAV_PADDING }]}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>

        <Card style={shadows.card}>
          <Text
            style={[
              typography.eyebrow,
              {
                color: colors.primary,
                textAlign: 'center',
                marginBottom: spacing.md,
              },
            ]}>
            REÇU DE TRANSFERT
          </Text>

          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Référence
            </Text>
            <Text style={[typography.label, { color: colors.text, maxWidth: '55%', textAlign: 'right' }]}>
              {transfer.id}
            </Text>
          </View>
          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Date
            </Text>
            <Text style={[typography.label, { color: colors.text }]}>
              {transfer.createdAt ? formatShortDate(transfer.createdAt) : '-'}
            </Text>
          </View>
          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Statut
            </Text>
            <StatusBadge status={transfer.status || ''} />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Direction
            </Text>
            <Text style={[typography.label, { color: colors.text }]}>
              {directionLabel(transfer.direction || 'bj_to_ru')}
            </Text>
          </View>
          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Montant envoyé
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary }}>
              {formatCurrency(transfer.amountSent ?? 0, transfer.currencyFrom || 'XOF')}
            </Text>
          </View>
          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Montant reçu
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.primary }}>
              {formatCurrency(transfer.receivedAmount ?? 0, transfer.currencyTo || 'RUB')}
            </Text>
          </View>
          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Frais
            </Text>
            <Text style={[typography.label, { color: colors.text }]}>
              {formatCurrency(transfer.fee ?? 0, transfer.currencyFrom || 'XOF')}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <View style={styles.line}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Bénéficiaire
            </Text>
            <Text style={[typography.label, { color: colors.text }]}>
              {recipientName}
            </Text>
          </View>
        </Card>

        <Button variant="primary" size="lg" onPress={handleShare}>
          Partager le reçu
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  separator: { height: 1, marginVertical: spacing.sm },
  empty: { fontSize: 18, textAlign: 'center', marginTop: 40 },
});
