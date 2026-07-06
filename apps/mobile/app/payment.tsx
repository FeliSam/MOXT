import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';

import {
  createPaymentIntent,
  getSupportedProviders,
  getProviderLabel,
  initiateMobileMoneyPayment,
  MobileMoneyProvider,
  PaymentMethod,
} from '@/services/payments';
import { useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

type Step = 'method' | 'details' | 'processing' | 'done';

export default function PaymentScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ amount?: string; currency?: string; transferId?: string }>();
  const user = useAppSelector((state) => state.auth.user);

  const amount = parseFloat(params.amount || '0');
  const currency = params.currency || 'XOF';
  const transferId = params.transferId;

  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider | null>(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const providers = getSupportedProviders(user?.country || 'sn');

  const handleSelectMethod = (m: PaymentMethod) => {
    setMethod(m);
    setStep('details');
  };

  const handlePay = async () => {
    if (!method) return;
    setLoading(true);
    setStep('processing');

    try {
      if (method === 'mobile_money') {
        if (!mobileProvider || !phone) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs');
          setStep('details');
          setLoading(false);
          return;
        }
        const intent = await initiateMobileMoneyPayment({
          phone,
          provider: mobileProvider,
          amount,
          currency,
          transferId,
        });
        if (intent.redirectUrl) {
          await Linking.openURL(intent.redirectUrl);
        }
        setStep('done');
      } else if (method === 'stripe') {
        const intent = await createPaymentIntent({
          amount,
          currency,
          method: 'stripe',
          transferId,
          description: `Transfert MOXT #${transferId || 'unknown'}`,
        });
        if (intent.redirectUrl) {
          await Linking.openURL(intent.redirectUrl);
        }
        setStep('done');
      } else {
        const intent = await createPaymentIntent({
          amount,
          currency,
          method: 'bank_transfer',
          transferId,
        });
        setStep('done');
      }
    } catch (e: any) {
      Alert.alert('Erreur de paiement', e.message || 'Le paiement a échoué');
      setStep('details');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <PageHeader eyebrow="TRANSACTION" title="Paiement" />

        {/* Amount summary */}
        <View style={[styles.amountCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.amountLabel, { color: colors.primary }]}>Montant à payer</Text>
          <Text style={[styles.amountValue, { color: colors.primary }]}>{amount.toLocaleString('fr-FR')} {currency}</Text>
        </View>

        {/* Step: method selection */}
        {step === 'method' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choisir un moyen de paiement</Text>
            <Pressable
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => handleSelectMethod('mobile_money')}
            >
              <Text style={styles.methodIcon}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>Mobile Money</Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>Orange Money, Wave, MTN, Moov</Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
            </Pressable>
            <Pressable
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => handleSelectMethod('stripe')}
            >
              <Text style={styles.methodIcon}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>Carte bancaire</Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>Visa, Mastercard via Stripe</Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
            </Pressable>
            <Pressable
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              onPress={() => handleSelectMethod('bank_transfer')}
            >
              <Text style={styles.methodIcon}>🏦</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>Virement bancaire</Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>SEPA, virement international</Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
            </Pressable>
          </View>
        )}

        {/* Step: details */}
        {step === 'details' && method === 'mobile_money' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mobile Money</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Opérateur</Text>
            <View style={styles.providersRow}>
              {providers.map((p) => (
                <Pressable
                  key={p}
                  style={[
                    styles.providerChip,
                    {
                      borderColor: mobileProvider === p ? colors.primary : colors.border,
                      backgroundColor: mobileProvider === p ? colors.primaryLight : colors.surface,
                    },
                  ]}
                  onPress={() => setMobileProvider(p)}
                >
                  <Text style={[styles.providerText, { color: mobileProvider === p ? colors.primary : colors.text }]}>
                    {getProviderLabel(p)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Numéro de téléphone"
              placeholder="+221 7X XXX XX XX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Button variant="primary" size="lg" onPress={handlePay}>
              Payer {amount.toLocaleString('fr-FR')} {currency}
            </Button>
          </View>
        )}

        {step === 'details' && method === 'stripe' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Carte bancaire</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Vous serez redirigé vers la page de paiement sécurisée Stripe.
            </Text>
            <Button variant="primary" size="lg" onPress={handlePay}>
              Payer par carte
            </Button>
          </View>
        )}

        {step === 'details' && method === 'bank_transfer' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Virement bancaire</Text>
            <Card variant="flat">
              <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>IBAN</Text>
              <Text style={[styles.bankValue, { color: colors.text }]}>FR76 XXXX XXXX XXXX XXXX XXXX XXX</Text>
              <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>BIC</Text>
              <Text style={[styles.bankValue, { color: colors.text }]}>MOXTFRPP</Text>
              <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>Référence</Text>
              <Text style={[styles.bankValue, { color: colors.text }]}>MOXT-{transferId || 'REF'}</Text>
            </Card>
            <Button variant="primary" size="lg" onPress={handlePay}>
              J'ai effectué le virement
            </Button>
          </View>
        )}

        {/* Step: processing */}
        {step === 'processing' && (
          <View style={styles.centerSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.processingText, { color: colors.textSecondary }]}>Traitement en cours...</Text>
          </View>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <View style={styles.centerSection}>
            <Text style={styles.doneIcon}>✅</Text>
            <Text style={[styles.doneTitle, { color: colors.text }]}>Paiement initié</Text>
            <Text style={[styles.doneDesc, { color: colors.textSecondary }]}>
              Votre paiement est en cours de traitement. Vous recevrez une notification une fois confirmé.
            </Text>
            <Button variant="primary" size="lg" onPress={() => router.back()}>
              Retour
            </Button>
          </View>
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
  amountCard: { borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  amountLabel: { ...typography.label },
  amountValue: { fontSize: 28, fontWeight: '900' },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.sectionTitle },
  methodCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, padding: spacing.lg, gap: 14, borderWidth: 1 },
  methodIcon: { fontSize: 28 },
  methodTitle: { ...typography.label, fontSize: 15 },
  methodDesc: { ...typography.caption },
  label: { ...typography.label, marginTop: spacing.xs },
  providersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  providerChip: { borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  providerText: { ...typography.label },
  infoText: { ...typography.body, lineHeight: 22 },
  bankLabel: { ...typography.caption, fontWeight: '700' },
  bankValue: { fontSize: 15, fontWeight: '600', marginBottom: spacing.xs },
  centerSection: { alignItems: 'center', paddingVertical: 40, gap: spacing.md },
  processingText: { fontSize: 16, fontWeight: '600' },
  doneIcon: { fontSize: 48 },
  doneTitle: { fontSize: 20, fontWeight: '800' },
  doneDesc: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 22 },
});
