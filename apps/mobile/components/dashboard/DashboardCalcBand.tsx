import { useMemo, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Download, Repeat } from 'lucide-react-native';

import { currencyForCountry, DIRECTIONS } from '@moxt/shared/domain/transferConfig.js';
import {
  calculateTransfer,
  calculateTransferFromReceived,
  roundMoneyUp,
} from '@moxt/shared/domain/transferCalc.js';

import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { cssAngleToPoints } from '@/constants/dashboardServices';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useLanguage } from '@/providers/LanguageProvider';
import type { AuthUser } from '@/store/types';
import { mixColors, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

type Calc = {
  amountReceived: number;
  totalToPay: number;
  currencyFrom: string;
  currencyTo: string;
  rate: number;
};

function CurrencyField({
  label,
  currency,
  value,
  onChange,
  accent = false,
}: {
  label: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  const box = accent
    ? {
        backgroundColor: mixColors(colors.teal, colors.surface, 0.12),
        borderColor: withAlphaColor(colors.teal, 0.28),
      }
    : { backgroundColor: colors.surface, borderColor: colors.border };
  return (
    <View style={[{ borderRadius: 15.2, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, overflow: 'hidden' }, box]}>
      <AppText
        numberOfLines={1}
        className="text-[11px] font-bold uppercase"
        style={{ letterSpacing: 0.66, color: accent ? colors.teal : colors.textMuted }}>
        {label}
      </AppText>
      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          className="font-extrabold"
          style={{ flex: 1, minWidth: 0, fontSize: 20, lineHeight: 24, color: colors.text, padding: 0, letterSpacing: -0.5 }}
        />
        <View
          style={{
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: accent ? mixColors(colors.teal, colors.surface, 0.18) : colors.surfaceMuted,
          }}>
          <AppText className="text-[11px] font-bold" style={{ letterSpacing: 0.3, color: accent ? colors.teal : colors.textMuted }}>
            {currency}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function HeroButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const shadows = useShadows();
  return (
    <Pressable
      onPress={onPress}
      className="min-h-9 flex-row items-center justify-center gap-1.5 rounded-xl bg-app-surface px-3.5"
      style={shadows.card}>
      {children}
    </Pressable>
  );
}

/** DashboardCalcBand du web : bienvenue + CTA + calculette, dégradé vert → bleu. */
export function DashboardCalcBand({ user }: { user: AuthUser | null }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ') || 'BJ';
  const [direction, setDirection] = useState(user?.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU);
  const [anchor, setAnchor] = useState<'send' | 'receive'>('send');
  const [amount, setAmount] = useState(user?.country === 'RU' ? '5000' : '100000');
  const [receiveInput, setReceiveInput] = useState('');
  const live = useExchangeRate(currencyForCountry(originCountry));
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? live.originToRub : live.rubToOrigin;

  const calc = useMemo<Calc>(() => {
    if (anchor === 'receive' && receiveInput !== '') {
      return calculateTransferFromReceived(receiveInput, direction, undefined, selectedRate, originCountry);
    }
    return calculateTransfer(amount, direction, undefined, selectedRate, originCountry);
  }, [anchor, receiveInput, amount, direction, selectedRate, originCountry]);

  function invert() {
    const next = direction === DIRECTIONS.BJ_TO_RU ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU;
    const nextAmount = anchor === 'receive' && receiveInput !== '' ? receiveInput : String(roundMoneyUp(calc.amountReceived));
    setDirection(next);
    setAnchor('send');
    setReceiveInput('');
    setAmount(nextAmount);
  }

  function onReceive(value: string) {
    setAnchor('receive');
    setReceiveInput(value);
    if (value === '') {
      setAmount('');
      return;
    }
    const total = calculateTransferFromReceived(value, direction, undefined, selectedRate, originCountry).totalToPay;
    setAmount(total ? String(roundMoneyUp(total)) : '');
  }

  const displayedReceive = anchor === 'receive' ? receiveInput : amount ? String(roundMoneyUp(calc.amountReceived)) : '';
  const verified = user?.verified === true || user?.status === 'verified';
  const { start, end } = cssAngleToPoints(125);
  const gradient = isDark
    ? ['rgba(7,89,77,0.78)', 'rgba(8,112,95,0.68)', 'rgba(36,93,232,0.55)']
    : [
        mixColors('#07594d', colors.surface, 0.68),
        mixColors('#08705f', colors.surface, 0.6),
        mixColors('#245de8', colors.surfaceMuted, 0.48),
      ];

  return (
    <View style={[{ borderRadius: 21.6, overflow: 'hidden' }, shadows.card]} accessibilityLabel={t('transfers.dashboardCalc.title')}>
      <LinearGradient
        colors={gradient as [string, string, string]}
        locations={[0, 0.42, 1]}
        start={start}
        end={end}
        style={{ padding: '5%' as never, gap: 16 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText numberOfLines={1} className="font-extrabold text-app-text" style={{ fontSize: 21.6, lineHeight: 27, letterSpacing: -0.65 }}>
              {t('dashboard.hero.welcome', { name: user?.firstName || 'MOXT' })}
            </AppText>
            {verified ? <VerifiedIcon size={14} /> : null}
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Platform.OS === 'web' ? (
              <HeroButton onPress={() => router.push('/onboarding' as never)}>
                <Download size={14} color={colors.text} strokeWidth={2} />
                <AppText className="text-[13px] font-semibold text-app-text" style={{ letterSpacing: -0.2 }}>
                  {t('dashboard.hero.install')}
                </AppText>
              </HeroButton>
            ) : null}
            <HeroButton onPress={() => router.push('/onboarding' as never)}>
              <AppText className="text-[13px] font-semibold text-app-text" style={{ letterSpacing: -0.2 }}>
                {t('dashboard.hero.guide')}
              </AppText>
            </HeroButton>
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <AppText numberOfLines={1} className="font-extrabold text-app-text" style={{ fontSize: 16.8, letterSpacing: -0.34 }}>
              {t('transfers.dashboardCalc.title')}
            </AppText>
            <Pressable
              onPress={invert}
              accessibilityLabel="Inverser"
              className="h-9 w-9 items-center justify-center rounded-xl bg-app-surface"
              style={shadows.card}>
              <Repeat size={16} color={colors.teal} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={{ marginTop: 12, gap: 8 }}>
            <CurrencyField
              label={t('transfers.dashboardCalc.youSend')}
              currency={calc.currencyFrom}
              value={amount}
              onChange={(v) => {
                setAnchor('send');
                setReceiveInput('');
                setAmount(v);
              }}
            />
            <CurrencyField
              accent
              label={t('transfers.dashboardCalc.receivedEstimate')}
              currency={calc.currencyTo}
              value={displayedReceive}
              onChange={onReceive}
            />
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <AppText numberOfLines={1} className="flex-1 text-[11px] text-app-text-muted">
              1 {calc.currencyFrom} = {Number(calc.rate).toFixed(5)} {calc.currencyTo}
            </AppText>
            <AppText className="text-[11px] text-app-text-muted">
              {live.loading ? t('transfers.calculator.refreshing') : `${live.source ?? ''}${live.date ? ` · ${live.date}` : ''}`}
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
