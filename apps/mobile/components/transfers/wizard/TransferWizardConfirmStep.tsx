import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { twTransfer } from '@/constants/transferTailwind';
import { calculateTransfer } from '@/constants/transfers';
import { cn } from '@/lib/cn';

export function TransferWizardConfirmStep({
  direction,
  amount,
  feePercent,
  exchangerName,
  senderName,
  recipientName,
  acceptTerms,
  setAcceptTerms,
  loading,
  onSubmit,
}: {
  direction: string;
  amount: number;
  feePercent: number;
  exchangerName: string;
  senderName: string;
  recipientName: string;
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const calc = calculateTransfer(amount, direction, feePercent);

  return (
    <View className={twTransfer.card}>
      <TransferWizardSectionTitle emoji="🛡️" label="Récapitulatif et confirmation" />

      <LinearGradient
        colors={['#0d9488', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={twTransfer.confirmGradient}>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-bold text-white/80">Vous envoyez</Text>
          <Text className="text-2xl font-black text-white">
            {formatCurrency(calc.totalToPay, calc.currencyFrom)}
          </Text>
        </View>
        <Text className="text-3xl text-white/70">→</Text>
        <View className="min-w-0 flex-1 items-end">
          <Text className="text-xs font-bold text-white/80">Le destinataire reçoit ~</Text>
          <Text className="text-2xl font-black text-white">
            {formatCurrency(calc.amountReceived, calc.currencyTo)}
          </Text>
        </View>
      </LinearGradient>

      <View className="gap-2">
        {[
          ['Entreprise partenaire', exchangerName],
          ['Frais', formatCurrency(calc.fees, calc.currencyFrom)],
          ['Expéditeur', senderName],
          ['Destinataire', recipientName],
        ].map(([label, value]) => (
          <View key={label} className={twTransfer.confirmRow}>
            <Text className={twTransfer.confirmRowLabel}>{label}</Text>
            <Text className={twTransfer.confirmRowValue}>{value || '—'}</Text>
          </View>
        ))}
      </View>

      <Pressable className={twTransfer.termsBox} onPress={() => setAcceptTerms(!acceptTerms)}>
        <View
          className={cn(
            twTransfer.checkbox,
            acceptTerms
              ? 'border-brand-700 bg-brand-700 dark:border-brand-400 dark:bg-brand-400'
              : 'border-app-border dark:border-zinc-600',
          )}>
          {acceptTerms ? <Text className="text-[10px] font-black text-white dark:text-slate-950">✓</Text> : null}
        </View>
        <Text className={twTransfer.termsText}>
          Je confirme ces informations et autorise leur transmission à l'entreprise sélectionnée pour le
          traitement de cette opération.
        </Text>
      </Pressable>

      <Pressable
        className={cn(twTransfer.submitBtn, loading && 'opacity-60')}
        disabled={loading}
        onPress={onSubmit}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className={twTransfer.submitBtnText}>🛡️  Créer et transmettre le transfert</Text>
        )}
      </Pressable>
    </View>
  );
}

export function TransferWizardNav({
  step,
  loading,
  onBack,
  onNext,
}: {
  step: number;
  loading?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View className={twTransfer.navRow}>
      <Pressable className={twTransfer.navBack} onPress={onBack} disabled={step === 1 && loading}>
        <Text className={twTransfer.navBackText}>← Précédent</Text>
      </Pressable>
      {step < 4 ? (
        <Pressable className={cn(twTransfer.navNext, loading && 'opacity-60')} disabled={loading} onPress={onNext}>
          <Text className={twTransfer.navNextText}>Continuer →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
