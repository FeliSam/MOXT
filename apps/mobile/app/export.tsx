import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { exportSummaryText, exportTransfersCSV } from '@/services/exportData';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ExportScreen() {
  const colors = useThemeColors();
  const [exporting, setExporting] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const listings = useAppSelector((state) => state.marketplace.items);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await exportTransfersCSV(
        transfers.map((t) => ({
          id: t.id,
          direction: t.direction,
          amount: t.amountSent,
          currencyFrom: t.currencyFrom,
          currencyTo: t.currencyTo,
          status: t.status,
          createdAt: t.createdAt,
        })),
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Export échoué');
    }
    setExporting(false);
  };

  const handleExportSummary = async () => {
    setExporting(true);
    try {
      const totalSent = transfers
        .filter((t) => t.direction === 'envoi')
        .reduce((s, t) => s + (t.amountSent || 0), 0);
      const totalReceived = transfers
        .filter((t) => t.direction === 'reception')
        .reduce((s, t) => s + (t.receivedAmount || 0), 0);
      await exportSummaryText({
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Utilisateur',
        transferCount: transfers.length,
        totalSent,
        totalReceived,
        currency: 'XOF',
        parcelCount: parcels.length,
        listingCount: listings.length,
      });
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Export échoué');
    }
    setExporting(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <PageHeader eyebrow="DONNÉES" title="Exporter mes données" />

        {exporting && <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />}

        {/* CSV export */}
        <Card>
          <Text style={styles.cardIcon}>📊</Text>
          <View style={{ gap: spacing.xs }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Transferts (CSV)</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Exporte tous vos transferts en format CSV, compatible Excel et Google Sheets.
            </Text>
          </View>
          <Button variant="primary" size="sm" onPress={handleExportCSV} disabled={exporting}>
            Exporter
          </Button>
        </Card>

        {/* Summary export */}
        <Card>
          <Text style={styles.cardIcon}>📄</Text>
          <View style={{ gap: spacing.xs }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Récapitulatif (TXT)</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Résumé de votre activité : transferts, colis, annonces.
            </Text>
          </View>
          <Button variant="primary" size="sm" onPress={handleExportSummary} disabled={exporting}>
            Exporter
          </Button>
        </Card>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Vos données sont exportées localement sur votre appareil. Aucune donnée n'est envoyée à un serveur tiers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  cardIcon: { fontSize: 32 },
  cardTitle: { ...typography.sectionTitle },
  cardDesc: { ...typography.bodySmall, lineHeight: 18 },
  infoBox: { borderRadius: radii.md, padding: 14, borderWidth: 1 },
  infoText: { ...typography.bodySmall, lineHeight: 20 },
});
