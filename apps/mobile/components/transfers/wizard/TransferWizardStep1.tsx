import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { twTransfer } from '@/constants/transferTailwind';
import {
  DIRECTIONS,
  FALLBACK_EXCHANGERS,
  calculateTransfer,
  directionInfo,
} from '@/constants/transfers';
import { cn } from '@/lib/cn';

type Exchanger = (typeof FALLBACK_EXCHANGERS)[number];

export function TransferWizardStep1({
  direction,
  onDirectionChange,
  amount,
  setAmount,
  exchangerId,
  setExchangerId,
  originCountry,
}: {
  direction: string;
  onDirectionChange: (d: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  exchangerId: string;
  setExchangerId: (id: string) => void;
  originCountry: string;
}) {
  const exchanger = FALLBACK_EXCHANGERS.find((e) => e.id === exchangerId)!;
  const numAmount = Number(amount) || 0;
  const calc = calculateTransfer(numAmount, direction, exchanger.feePercent);
  const rateDate = new Date().toISOString().slice(0, 10);

  return (
    <View className="gap-5">
      {/* Sens du transfert */}
      <View className={twTransfer.card}>
        <TransferWizardSectionTitle emoji="⚡" label="Sens du transfert" />
        <View className="gap-3">
          {[DIRECTIONS.BJ_TO_RU, DIRECTIONS.RU_TO_BJ].map((dir) => {
            const cardInfo = directionInfo(dir, originCountry);
            const active = direction === dir;
            return (
              <Pressable
                key={dir}
                className={cn(
                  twTransfer.directionCard,
                  active ? twTransfer.directionCardActive : twTransfer.directionCardIdle,
                )}
                onPress={() => onDirectionChange(dir)}>
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className={twTransfer.directionFlags}>
                    {cardInfo.fromFlag} {cardInfo.from}
                  </Text>
                  <Text className={active ? 'text-brand-700' : 'text-app-text-muted'}>→</Text>
                  <Text className={twTransfer.directionFlags}>
                    {cardInfo.toFlag} {cardInfo.to}
                  </Text>
                </View>
                <Text
                  className={cn(
                    twTransfer.directionSub,
                    active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted',
                  )}>
                  {cardInfo.sub}
                </Text>
                {active ? (
                  <View className={cn(twTransfer.selectedPill, 'bg-brand-700 dark:bg-brand-400')}>
                    <Text className={twTransfer.selectedPillText}>✓ Sélectionné</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Montant */}
      <View className={twTransfer.card}>
        <TransferWizardSectionTitle emoji="📤" label={`Montant à envoyer en ${calc.currencyFrom}`} />
        <Text className={twTransfer.fieldLabel}>MONTANT EN {calc.currencyFrom}</Text>
        <TextInput
          keyboardType="numeric"
          placeholder={`Min. ${formatCurrency(calc.minimumRequired, calc.currencyFrom)}`}
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={setAmount}
          className={twTransfer.amountInput}
        />
        <View className={cn(twTransfer.infoBox, 'mt-4')}>
          <Text className="text-base text-brand-700">🕐</Text>
          <Text className={twTransfer.infoText}>
            Minimum :{' '}
            <Text className="font-bold">{formatCurrency(calc.minimumRequired, calc.currencyFrom)}</Text>.
            {' '}Utilisé ce mois : 0 {calc.currencyFrom}.
          </Text>
        </View>
      </View>

      {/* Partenaires */}
      <View className={twTransfer.card}>
        <View className={twTransfer.partnerHeader}>
          <View className="flex-row items-center gap-3">
            <View className={twTransfer.sectionIcon}>
              <Text className="text-base">⭐</Text>
            </View>
            <Text className={twTransfer.sectionLabel}>Choisir un partenaire</Text>
          </View>
          <Pressable onPress={() => router.push('/exchangers' as any)}>
            <Text className="text-xs font-bold text-brand-700 dark:text-brand-400">Tous les échangeurs ↗</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1">
          {FALLBACK_EXCHANGERS.map((ex) => (
            <PartnerCard
              key={ex.id}
              ex={ex}
              active={exchangerId === ex.id}
              onSelect={() => setExchangerId(ex.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Estimation */}
      {numAmount > 0 && exchangerId ? (
        <TransferEstimateCard calc={calc} exchanger={exchanger} rateDate={rateDate} />
      ) : null}
    </View>
  );
}

function PartnerCard({ ex, active, onSelect }: { ex: Exchanger; active: boolean; onSelect: () => void }) {
  return (
    <Pressable
      className={cn(
        twTransfer.partnerCard,
        active ? twTransfer.partnerCardActive : twTransfer.partnerCardIdle,
      )}
      onPress={onSelect}>
      <View
        className={cn(
          twTransfer.partnerAvatar,
          active ? 'bg-brand-700 dark:bg-brand-400' : 'bg-app-surface-muted dark:bg-zinc-800',
        )}>
        <Text
          className={cn(
            'text-base font-black',
            active ? 'text-white dark:text-slate-950' : 'text-app-text-muted',
          )}>
          {ex.name[0]}
        </Text>
      </View>
      <Text className={twTransfer.partnerName} numberOfLines={2}>
        {ex.name}
      </Text>
      <Text className={twTransfer.partnerRating}>⭐ {ex.rating.toFixed(1)}</Text>
      <View className="w-full gap-1">
        <View
          className={cn(
            twTransfer.partnerTag,
            active ? 'bg-brand-700 dark:bg-brand-400' : 'bg-app-surface-muted dark:bg-zinc-800',
          )}>
          <Text
            className={cn(
              'text-center text-[10px] font-bold',
              active ? 'text-white dark:text-slate-950' : 'text-app-text-muted',
            )}>
            {ex.feePercent}% frais
          </Text>
        </View>
        <View
          className={cn(
            twTransfer.partnerTag,
            active ? 'bg-brand-600 dark:bg-brand-500' : 'bg-app-surface-muted dark:bg-zinc-800',
          )}>
          <Text
            className={cn(
              'text-center text-[10px] font-bold',
              active ? 'text-white dark:text-slate-950' : 'text-app-text-muted',
            )}>
            🕐 {ex.averageDelay}
          </Text>
        </View>
      </View>
      {active ? <Text className={twTransfer.partnerSelected}>✓ Sélectionné</Text> : null}
    </Pressable>
  );
}

function TransferEstimateCard({
  calc,
  exchanger,
  rateDate,
}: {
  calc: ReturnType<typeof calculateTransfer>;
  exchanger: Exchanger;
  rateDate: string;
}) {
  return (
    <View className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
      <LinearGradient
        colors={['#0d9488', '#14b8a6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={twTransfer.simGradient}>
        <View className="mb-3 flex-row items-center gap-2">
          <Text className="text-white/80">⚡</Text>
          <Text className={twTransfer.simEyebrow}>ESTIMATION DU TRANSFERT</Text>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className={twTransfer.simPayLabel}>Vous payez</Text>
            <Text className={twTransfer.simPayValue}>
              {formatCurrency(calc.totalToPay, calc.currencyFrom)}
            </Text>
          </View>
          <View className={twTransfer.simRatePill}>
            <Text className={twTransfer.simRateText} numberOfLines={1}>
              → 1 {calc.currencyFrom} = {calc.rawRate.toFixed(5)} {calc.currencyTo}
            </Text>
          </View>
          <View className="min-w-0 flex-1 items-end">
            <Text className={twTransfer.simPayLabel}>Le destinataire reçoit ~</Text>
            <Text className={twTransfer.simPayValue}>
              {formatCurrency(calc.amountReceived, calc.currencyTo)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className={twTransfer.simGrid}>
        {[
          { label: 'Montant envoyé', value: formatCurrency(calc.amountSent, calc.currencyFrom), highlight: false },
          { label: `Frais ${calc.feePercent}%`, value: formatCurrency(calc.fees, calc.currencyFrom), highlight: true },
          { label: 'Délai estimé', value: exchanger.averageDelay, highlight: false },
        ].map(({ label, value, highlight }) => (
          <View key={label} className={twTransfer.simGridCell}>
            <Text className={twTransfer.simGridLabel}>{label}</Text>
            <Text className={highlight ? twTransfer.simGridValueHighlight : twTransfer.simGridValue}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View className={twTransfer.simFooter}>
        <Text className={twTransfer.simFooterNote}>
          Taux indicatif · source Frankfurter · {rateDate} · marge {calc.rateMarginPercent}%. Le montant
          reçu peut varier légèrement.
        </Text>
      </View>
    </View>
  );
}
