import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react-native';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { twTransfer } from '@/constants/transferTailwind';
import { calculateTransfer } from '@/constants/transfers';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';

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
      <TransferWizardSectionTitle icon={ShieldCheck} label="Récapitulatif et confirmation" />

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
        <ArrowRight size={24} color="rgba(255,255,255,0.7)" />
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
          {acceptTerms ? <Check size={11} color="#ffffff" strokeWidth={3} /> : null}
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
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={18} color="#fff" />
            <Text className={twTransfer.submitBtnText}>Créer et transmettre le transfert</Text>
          </View>
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
  const { colors, isDark } = useTheme();

  return (
    <View className={twTransfer.navRow}>
      <Pressable className={twTransfer.navBack} onPress={onBack} disabled={step === 1 && loading}>
        <ArrowLeft size={16} color={colors.text} />
        <Text className={twTransfer.navBackText}>Précédent</Text>
      </Pressable>
      {step < 4 ? (
        <Pressable className={cn(twTransfer.navNext, loading && 'opacity-60')} disabled={loading} onPress={onNext}>
          <Text className={twTransfer.navNextText}>Continuer</Text>
          <ArrowRight size={16} color={isDark ? '#020617' : '#ffffff'} />
        </Pressable>
      ) : null}
    </View>
  );
}

