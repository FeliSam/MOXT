import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ImagePickerButton } from '@/components/ImagePickerButton';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export default function KycScreen() {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [status, setStatus] = useState<KycStatus>('not_started');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!frontUri) { Alert.alert('Photo requise', 'Veuillez prendre la photo du recto de votre pièce.'); return; }
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const frontName = `kyc_${user.id}_front_${Date.now()}.jpg`;
      const frontResponse = await fetch(frontUri);
      const frontBlob = await frontResponse.blob();
      await supabase.storage.from('kyc').upload(frontName, frontBlob, { contentType: 'image/jpeg' });

      if (backUri) {
        const backName = `kyc_${user.id}_back_${Date.now()}.jpg`;
        const backResponse = await fetch(backUri);
        const backBlob = await backResponse.blob();
        await supabase.storage.from('kyc').upload(backName, backBlob, { contentType: 'image/jpeg' });
      }

      await supabase.from('kyc_requests').insert({
        id: `KYC-${Date.now().toString(36).toUpperCase()}`,
        user_id: user.id,
        front_image: frontName,
        back_image: backUri ? `kyc_${user.id}_back_${Date.now()}.jpg` : null,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      setStatus('pending');
      Alert.alert('Document envoyé', 'Votre pièce d\'identité est en cours de vérification.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<KycStatus, { icon: string; label: string; color: string }> = {
    not_started: { icon: '🪪', label: 'Non vérifié', color: colors.textMuted },
    pending: { icon: '⏳', label: 'En cours de vérification', color: colors.warning },
    verified: { icon: '✅', label: 'Identité vérifiée', color: colors.success },
    rejected: { icon: '❌', label: 'Rejeté — renvoyez un document', color: colors.danger },
  };

  const cfg = statusConfig[status];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>

        <PageHeader eyebrow="SÉCURITÉ" title="Vérification d'identité" />

        {/* Status card */}
        <Card>
          <View style={styles.statusInner}>
            <Text style={styles.statusIcon}>{cfg.icon}</Text>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </Card>

        {status === 'not_started' || status === 'rejected' ? (
          <>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recto de la pièce *</Text>
              <ImagePickerButton label="Photo recto" currentUri={frontUri} onImageSelected={setFrontUri} />
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Verso (optionnel)</Text>
              <ImagePickerButton label="Photo verso" currentUri={backUri} onImageSelected={setBackUri} />
            </Card>

            <Button variant="primary" size="lg" onPress={handleSubmit} loading={loading}>
              Envoyer pour vérification
            </Button>
          </>
        ) : null}

        {status === 'verified' ? (
          <View style={[styles.verifiedCard, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
            <Text style={[styles.verifiedText, { color: colors.success }]}>
              Votre identité est confirmée. Vous bénéficiez de limites de transfert élevées.
            </Text>
          </View>
        ) : null}
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
