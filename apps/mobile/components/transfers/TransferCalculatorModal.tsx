import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing } from '@/theme/colors';
import { DIRECTIONS, RATE_RUB_XOF, calculateTransfer } from '@/constants/transfers';

export function TransferCalculatorModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const [direction, setDirection] = useState<string>(DIRECTIONS.RU_TO_BJ);
  const [amount, setAmount] = useState('50000');

  const calc = useMemo(() => {
    const num = Number(amount) || 0;
    return calculateTransfer(num, direction);
  }, [amount, direction]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Calculatrice de transfert</Text>
                <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
                  Estimation au taux de référence disponible, avant confirmation de l'entreprise.
                </Text>
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
              </Pressable>
            </View>

            <View style={[styles.badge, { backgroundColor: brand[50] }]}>
              <Text style={[styles.badgeText, { color: brand[800] }]}>Frankfurter</Text>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>DIRECTION</Text>
                <Pressable
                  style={[styles.select, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() =>
                    setDirection((d) =>
                      d === DIRECTIONS.BJ_TO_RU ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU,
                    )
                  }>
                  <Text style={[styles.selectText, { color: colors.text }]}>
                    {calc.from} vers {calc.to}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>⇄</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  MONTANT EN {calc.from}
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                />
              </View>
            </View>

            <View style={[styles.metrics, { backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Le destinataire reçoit</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatCurrency(calc.amountReceived, calc.to)}
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Frais {calc.feePercent}%</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatCurrency(calc.fees, calc.from)}
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total à payer</Text>
                <Text style={[styles.metricValue, { color: brand[700] }]}>
                  {formatCurrency(calc.totalToPay, calc.from)}
                </Text>
              </View>
            </View>

            <Text style={[styles.rateNote, { color: colors.textFaint }]}>
              1 {calc.from} = {(calc.from === 'RUB' ? RATE_RUB_XOF : 1 / RATE_RUB_XOF).toFixed(6)} {calc.to}.
              Référence du 2026-07-03, avec une marge plateforme de 1%.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadows.float },
  content: { padding: spacing.xl, paddingBottom: 40, gap: spacing.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  sheetTitle: { fontSize: 20, fontWeight: '900' },
  sheetSub: { fontSize: 13, lineHeight: 18, marginTop: 4, maxWidth: 280 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  select: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  metrics: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  metric: { gap: 4 },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricDivider: { height: 1 },
  rateNote: { fontSize: 11, lineHeight: 16 },
});
