import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadVerification } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackHeader } from '@/components/chrome/BackHeader';

type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

function toKycStatus(status: string | null, verified: boolean): KycStatus {
  if (verified || status === 'approved' || status === 'verified') return 'verified';
  if (status === 'rejected') return 'rejected';
  if (status) return 'pending';
  return 'not_started';
}

/**
 * Vérification d’identité : statut lu dans `verification_requests` / `identity_profiles`
 * comme le web (les tables mobiles `kyc` / `kyc_requests` n’existent pas côté web).
 * L’envoi de pièces depuis le mobile (documents personnels du web) = phase 3.
 */
export default function KycScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const verification = useAppSelector((state) => state.account.verification);

  useEffect(() => {
    if (userId) dispatch(loadVerification(userId));
  }, [dispatch, userId]);

  const status = toKycStatus(verification.status, verification.verified);

  const statusConfig: Record<KycStatus, { icon: string; label: string; color: string }> = {
    not_started: { icon: '🪪', label: 'Non vérifié', color: colors.textMuted },
    pending: { icon: '⏳', label: 'En cours de vérification', color: colors.warning },
    verified: { icon: '✅', label: 'Identité vérifiée', color: colors.success },
    rejected: { icon: '❌', label: 'Refusée — renvoyez un document depuis le site', color: colors.danger },
  };

  const cfg = statusConfig[status];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackHeader inline title="Vérification" />

        <PageHeader eyebrow="SÉCURITÉ" title="Vérification d'identité" />

        <Card>
          <View style={styles.statusInner}>
            <Text style={styles.statusIcon}>{cfg.icon}</Text>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            {verification.requestedAt ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Demande du {new Date(verification.requestedAt).toLocaleDateString('fr-FR')}
              </Text>
            ) : null}
          </View>
        </Card>

        {status === 'verified' ? (
          <View style={[styles.verifiedCard, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
            <Text style={[styles.verifiedText, { color: colors.success }]}>
              Votre identité est confirmée. Vous bénéficiez de limites de transfert élevées.
            </Text>
          </View>
        ) : (
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            L’envoi des pièces d’identité se fait pour l’instant depuis le site MOXT (Compte → Vérification).
          </Text>
        )}
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
  statusInner: { alignItems: 'center', gap: spacing.sm },
  statusIcon: { fontSize: 40 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.sm },
  verifiedCard: { borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1 },
  verifiedText: { ...typography.body, fontWeight: '600', lineHeight: 22 },
});
