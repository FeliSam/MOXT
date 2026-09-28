import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, ArrowUpRight, Shield, TrendingUp } from 'lucide-react-native';

import { transferNeedsClientAction } from '@moxt/shared/domain/transferActionUtils.js';
import { TRANSFER_STATUS } from '@moxt/shared/domain/transferConfig.js';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';

import { DashboardBusinessRail } from '@/components/dashboard/DashboardBusinessRail';
import { WebBadge, WebCard, type BadgeTone } from '@/components/dashboard/webUi';
import { AppText } from '@/components/ui/AppText';
import type { ExchangeRate } from '@/hooks/useExchangeRate';
import { useLanguage } from '@/providers/LanguageProvider';
import type { TransferItem } from '@/store/transfers';
import type { AuthUser } from '@/store/types';
import { useTheme } from '@/theme/ThemeContext';

/** TransferStatusBadge du web. */
const STATUS_BADGE: Record<string, { labelKey: string; tone: BadgeTone }> = {
  [TRANSFER_STATUS.PENDING_ACCEPTANCE]: { labelKey: 'transfers.status.pendingAcceptance', tone: 'info' },
  [TRANSFER_STATUS.PENDING]: { labelKey: 'transfers.status.pending', tone: 'warning' },
  [TRANSFER_STATUS.DECLINED]: { labelKey: 'transfers.status.businessDeclined', tone: 'danger' },
  [TRANSFER_STATUS.DECLARED]: { labelKey: 'transfers.status.declared', tone: 'info' },
  [TRANSFER_STATUS.RECEIVED]: { labelKey: 'transfers.status.received', tone: 'success' },
  [TRANSFER_STATUS.PROCESSING]: { labelKey: 'transfers.status.processing', tone: 'violet' },
  [TRANSFER_STATUS.PAID_OUT]: { labelKey: 'transfers.status.paidOut', tone: 'info' },
  [TRANSFER_STATUS.COMPLETED]: { labelKey: 'transfers.status.completed', tone: 'success' },
  [TRANSFER_STATUS.CANCELLED]: { labelKey: 'transfers.status.cancelled', tone: 'danger' },
  [TRANSFER_STATUS.EXPIRED]: { labelKey: 'transfers.status.expired', tone: 'warning' },
};

function RoundLink({ to, label }: { to: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={() => router.push(to as never)}
      className="h-10 w-10 items-center justify-center rounded-2xl border border-app-border">
      <ArrowUpRight size={16} color={colors.text} strokeWidth={2} />
    </Pressable>
  );
}

/** DashboardOverviewPanels du web : bannière identité, entreprises, taux, transferts en cours. */
export function DashboardOverviewPanels({
  activeTransfers,
  rate,
  user,
}: {
  activeTransfers: TransferItem[];
  rate: ExchangeRate;
  user: AuthUser;
}) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const sorted = [...activeTransfers].sort(
    (a, b) => Number(transferNeedsClientAction(b)) - Number(transferNeedsClientAction(a)),
  );

  return (
    <>
      {!user.verified ? (
        <WebCard className="gap-3 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Shield size={16} color={isDark ? '#fcd34d' : '#b45309'} strokeWidth={2} />
            </View>
            <AppText className="flex-1 text-sm font-bold text-app-text">{t('dashboard.identityBanner.short')}</AppText>
          </View>
          <Pressable
            onPress={() => router.push('/kyc' as never)}
            className="min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4">
            <AppText className="text-sm font-black text-white">{t('dashboard.identityBanner.verify')}</AppText>
          </Pressable>
        </WebCard>
      ) : null}

      <DashboardBusinessRail />

      <WebCard bare>
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-app-accent-soft">
            <TrendingUp size={16} color={colors.accent} strokeWidth={2} />
          </View>
          <AppText className="text-base font-black text-app-text">{t('dashboard.overview.rateTitle')}</AppText>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-app-surface-muted p-4">
            <AppText className="text-xs text-app-text-muted">1 XOF</AppText>
            <AppText className="mt-1 text-lg font-bold text-app-text">
              {Number.isFinite(rate.originToRub as number) ? (rate.originToRub as number).toFixed(4) : '—'} RUB
            </AppText>
          </View>
          <View className="flex-1 rounded-2xl bg-app-surface-muted p-4">
            <AppText className="text-xs text-app-text-muted">1 RUB</AppText>
            <AppText className="mt-1 text-lg font-bold text-app-text">
              {Number.isFinite(rate.rubToOrigin as number) ? (rate.rubToOrigin as number).toFixed(2) : '—'} XOF
            </AppText>
          </View>
        </View>
      </WebCard>

      <WebCard bare>
        <View className="flex-row items-center justify-between gap-3">
          <AppText className="text-base font-black text-app-text">{t('dashboard.overview.transfersTitle')}</AppText>
          <RoundLink to="/(tabs)/transfers" label={t('dashboard.overview.history')} />
        </View>
        <View className="mt-4 gap-2">
          {sorted.length ? (
            sorted.slice(0, 3).map((transfer) => {
              const tr = transfer as TransferItem & { amount?: number; totalToPay?: number; currency?: string };
              const amount = tr.amountSent ?? tr.amount ?? tr.totalToPay;
              const currency = tr.currencyFrom ?? tr.currency ?? 'XOF';
              const yourTurn = transferNeedsClientAction(transfer);
              const badge = STATUS_BADGE[transfer.status ?? ''];
              return (
                <Pressable
                  key={transfer.id}
                  onPress={() => router.push(`/transfer/${transfer.id}` as never)}
                  className={
                    yourTurn
                      ? 'rounded-2xl border border-amber-300/80 bg-amber-50/90 p-3 dark:border-amber-800/60 dark:bg-amber-950/30'
                      : 'rounded-2xl bg-app-surface-muted p-3'
                  }>
                  <View style={{ position: 'absolute', top: 0, right: 8 }}>
                    <WebBadge tone={badge?.tone ?? 'brand'}>{badge ? t(badge.labelKey) : transfer.status}</WebBadge>
                  </View>
                  <AppText numberOfLines={1} className="pr-20 text-sm font-bold text-app-text">
                    {formatCurrency(amount, currency)} · {transfer.exchanger?.name || t('dashboard.overview.transfer')}
                  </AppText>
                  {yourTurn ? (
                    <View className="mt-2 self-start rounded-full bg-amber-500/15 px-2 py-0.5">
                      <AppText className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-200" style={{ letterSpacing: 0.3 }}>
                        {t('transfers.detail.nextStep.yourTurn')}
                      </AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          ) : (
            <View className="items-center gap-3 rounded-2xl bg-app-surface-muted p-5">
              <AppText className="text-center text-sm text-app-text-muted">{t('dashboard.overview.noTransfersShort')}</AppText>
              <Pressable
                onPress={() => router.push('/(tabs)/transfers' as never)}
                className="min-h-11 flex-row items-center gap-2 rounded-xl bg-brand-700 px-4">
                <ArrowRight size={14} color="#fff" strokeWidth={2} />
                <AppText className="text-sm font-black text-white">{t('dashboard.overview.createTransfer')}</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </WebCard>
    </>
  );
}
