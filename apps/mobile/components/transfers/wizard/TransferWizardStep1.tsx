import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { twTransfer } from '@/constants/transferTailwind';
import {
  DIRECTIONS,
  calculateTransfer,
  directionInfo,
  flagAccent,
} from '@/constants/transfers';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeContext';

export type WizardExchanger = {
  id: string;
  name: string;
  rating: number;
  feePercent: number;
  averageDelay: string;
  city?: string;
  country?: string;
};

export function TransferWizardStep1({
  direction,
  onDirectionChange,
  amount,
  setAmount,
  exchangerId,
  setExchangerId,
  exchangers,
  ownBusiness,
  originCountry,
}: {
  direction: string;
  onDirectionChange: (d: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  exchangerId: string;
  setExchangerId: (id: string) => void;
  exchangers: WizardExchanger[];
  ownBusiness?: { id: string; name: string } | null;
  originCountry: string;
}) {
  const { colors } = useTheme();
  const rate = useExchangeRate('XOF');
  const exchanger = exchangers.find((e) => e.id === exchangerId) || exchangers[0];
  const numAmount = Number(amount) || 0;
  const base = calculateTransfer(numAmount, direction, exchanger?.feePercent ?? 2.5);
  const liveRaw = direction === DIRECTIONS.RU_TO_BJ ? rate.rubToOrigin : rate.originToRub;
  const rawRate = liveRaw && liveRaw > 0 ? liveRaw : base.rawRate;
  const calc = { ...base, rawRate, amountReceived: base.amountSent * rawRate };
  const rateDate = rate.date || new Date().toISOString().slice(0, 10);
  const derivedReceive = numAmount > 0 ? String(Math.round(calc.amountReceived)) : '';

  function onSendChange(text: string) {
    setAmount(text.replace(/[^\d]/g, ''));
  }

  function onReceiveChange(text: string) {
    const cleaned = text.replace(/[^\d.,]/g, '');
    const received = Number(cleaned.replace(',', '.')) || 0;
    const feeRate = (exchanger?.feePercent ?? 2.5) / 100;
    if (!(rawRate > 0) || feeRate >= 1) {
      setAmount('');
      return;
    }
    const total = received / rawRate / (1 - feeRate);
    setAmount(total > 0 ? String(Math.round(total)) : '');
  }

  return (
    <View className="gap-5">
      {/* Sens du transfert */}
      <View className={twTransfer.card}>
        <TransferWizardSectionTitle emoji="⚡" label="Sens du transfert" />
        <View className="gap-3">
          {[DIRECTIONS.BJ_TO_RU, DIRECTIONS.RU_TO_BJ].map((dir) => {
            const cardInfo = directionInfo(dir, originCountry);
            const active = direction === dir;
            const accent = flagAccent(cardInfo.destinationCountry);
            return (
              <Pressable
                key={dir}
                className={cn(
                  twTransfer.directionCard,
                  active ? 'bg-brand-50 shadow-md dark:bg-brand-950/40' : twTransfer.directionCardIdle,
                )}
                style={active ? { borderColor: accent } : undefined}
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
                <Text className={cn(twTransfer.directionSub, active ? 'text-brand-700 dark:text-brand-400' : 'text-app-text-muted')}>
                  {cardInfo.sub}
                </Text>
                {active ? (
                  <View className={twTransfer.selectedPill} style={{ backgroundColor: accent }}>
                    <Text className="text-[10px] font-bold text-white">✓ Sélectionné</Text>
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
        <AmountField
          label={`Montant à envoyer · ${calc.currencyFrom}`}
          currency={calc.currencyFrom}
          value={amount}
          onChangeText={onSendChange}
          placeholder={`Min. ${formatCurrency(calc.minimumRequired, calc.currencyFrom)}`}
          placeholderColor={colors.textFaint}
          textColor={colors.text}
          borderColor={colors.border}
          backgroundColor={colors.surface}
        />
        <AmountField
          accent
          label={`Montant exact à recevoir · ${calc.currencyTo}`}
          currency={calc.currencyTo}
          value={derivedReceive}
          onChangeText={onReceiveChange}
          placeholder="0"
          placeholderColor={colors.textFaint}
          textColor={colors.text}
          borderColor={colors.border}
          backgroundColor={colors.surface}
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
        {exchangers.length || ownBusiness ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1">
            {ownBusiness ? (
              <View className="w-[9.25rem] shrink-0 items-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-app-surface-muted p-4 opacity-80">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950/50">
                  <Text className="text-base font-black text-brand-800 dark:text-brand-200">{ownBusiness.name[0]}</Text>
                </View>
                <Text className="text-center text-xs font-black leading-tight text-app-text" numberOfLines={2}>
                  {ownBusiness.name}
                </Text>
                <View className="rounded-full bg-brand-100 px-2 py-0.5 dark:bg-brand-950/50">
                  <Text className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Votre entreprise</Text>
                </View>
                <Text className="text-center text-[10px] leading-4 text-app-text-muted">
                  Réception uniquement ·{' '}
                  <Text
                    className="font-bold text-brand-700 underline dark:text-brand-400"
                    onPress={() => router.push('/organization' as any)}>
                    Espace pro
                  </Text>
                </Text>
              </View>
            ) : null}
            {exchangers.map((ex) => (
              <PartnerCard
                key={ex.id}
                ex={ex}
                active={exchangerId === ex.id}
                onSelect={() => setExchangerId(ex.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <Text className="text-sm text-app-text-muted">Aucun partenaire validé pour ce sens. Ouvrez la liste des échangeurs.</Text>
        )}
      </View>

      {/* Estimation */}
      {numAmount > 0 && exchanger ? (
        <TransferEstimateCard calc={calc} exchanger={exchanger} rateDate={rateDate} />
      ) : null}
    </View>
  );
}

function AmountField({
  accent,
  label,
  currency,
  value,
  onChangeText,
  placeholder,
  placeholderColor,
  textColor,
  borderColor,
  backgroundColor,
}: {
  accent?: boolean;
  label: string;
  currency: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderColor: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={{
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor,
        borderWidth: 1,
        borderColor: accent ? 'rgba(8,112,95,0.28)' : borderColor,
      }}>
      <Text className={cn('text-[11px] font-bold uppercase', accent ? 'text-brand-700 dark:text-brand-300' : 'text-app-text-muted')}>
        {label}
      </Text>
      <View className="mt-1 flex-row items-center gap-2">
        <TextInput
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          style={{ flex: 1, minHeight: 36, fontSize: 22, fontWeight: '800', color: textColor }}
        />
        <Text className="text-sm font-bold text-app-text-muted">{currency}</Text>
      </View>
    </View>
  );
}

function PartnerCard({ ex, active, onSelect }: { ex: WizardExchanger; active: boolean; onSelect: () => void }) {
  const place = [ex.city, ex.country].filter(Boolean).join(' · ');
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
          active ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-app-surface-muted dark:bg-zinc-800',
        )}>
        <Text
          className={cn(
            'text-base font-black',
            active ? 'text-white' : 'text-app-text-muted',
          )}>
          {ex.name[0]}
        </Text>
      </View>
      <Text className={twTransfer.partnerName} numberOfLines={2}>
        {ex.name}
      </Text>
      {place ? (
        <Text className="text-center text-[10px] font-semibold text-app-text-muted" numberOfLines={1}>
          {place}
        </Text>
      ) : null}
      <Text className={twTransfer.partnerRating}>⭐ {ex.rating.toFixed(1)}</Text>
      <View className="w-full flex-row flex-wrap items-center justify-center gap-1">
        <View
          className={cn(
            twTransfer.partnerTag,
            active ? 'bg-emerald-600' : 'bg-app-surface-muted dark:bg-zinc-800',
          )}>
          <Text
            className={cn(
              'text-center text-[9px] font-bold',
              active ? 'text-white' : 'text-app-text-muted',
            )}>
            {ex.feePercent}% frais
          </Text>
        </View>
        <View
          className={cn(
            twTransfer.partnerTag,
            active ? 'bg-emerald-500' : 'bg-app-surface-muted dark:bg-zinc-800',
          )}>
          <Text
            className={cn(
              'text-center text-[9px] font-bold',
              active ? 'text-white' : 'text-app-text-muted',
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
  exchanger: WizardExchanger;
  rateDate: string;
}) {
  return (
    <View className="overflow-hidden rounded-2xl bg-app-surface shadow-sm">
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
