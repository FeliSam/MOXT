import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, Repeat, Star } from 'lucide-react-native';

import { computeP2PReputation, p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';
import { formatCurrency, formatDateTime } from '@moxt/shared/utils/formatters.js';

import { WebBadge } from '@/components/dashboard/webUi';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import type { P2POffer } from '@/store/dashboard';
import { brand, mixColors, withAlphaColor } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

/** Carte offre P2P du web (P2POfferCard, showActions={false}). */
export function P2POfferCard({
  offer,
  orders,
  reviews,
  ownerVerified,
}: {
  offer: P2POffer;
  orders: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  ownerVerified?: boolean;
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const shadows = useShadows();
  const stats = computeP2PReputation(offer.ownerId, { orders, reviews });
  const equivalent = p2pReceivedFromOffered(offer.amount, offer.rate);
  const title = t('p2p.page.amountTo', {
    amount: formatCurrency(offer.amount, offer.fromCurrency),
    currency: offer.toCurrency ?? '',
  });
  const active = offer.status === 'active';
  const chip = { backgroundColor: colors.surface, ...shadows.card };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={() => router.push(`/p2p/${offer.id}` as never)}
      className="min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface"
      style={[shadows.card, { flex: 1 }]}>
      <LinearGradient
        colors={[colors.teal, brand[500], colors.cobalt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4, opacity: 0.8 }}
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
            <WebBadge tone={active ? 'success' : 'warning'}>
              {active ? t('p2p.page.statusActive') : t('p2p.page.statusArchived')}
            </WebBadge>
            {offer.businessId ? (
              <WebBadge tone="success">{t('p2p.page.business')}</WebBadge>
            ) : (
              <View className="rounded-full bg-app-surface-muted px-2 py-0.5">
                <AppText className="text-[10px] font-black uppercase text-app-text-faint" style={{ letterSpacing: 0.25 }}>
                  {t('p2p.page.individual')}
                </AppText>
              </View>
            )}
          </View>
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{
              backgroundColor: mixColors(colors.teal, colors.surface, 0.14),
              borderWidth: 1,
              borderColor: withAlphaColor(colors.teal, 0.22),
            }}>
            <Repeat size={14} color={colors.teal} strokeWidth={2} />
          </View>
        </View>

        <AppText className="mt-3.5 text-lg font-black text-app-text" style={{ letterSpacing: -0.45, lineHeight: 22 }}>
          {title}
        </AppText>
        <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2">
          <View className="flex-row items-center gap-1">
            <AppText numberOfLines={1} className="text-xs font-semibold text-app-text-muted">
              {offer.ownerName}
            </AppText>
            {ownerVerified ? <VerifiedIcon size={14} /> : null}
          </View>
          {offer.createdAt ? (
            <AppText className="text-[11px] text-app-text-faint">· {formatDateTime(offer.createdAt)}</AppText>
          ) : null}
        </View>
        <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          {stats.avgRating != null ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#f59e0b" strokeWidth={2} />
              <AppText className="text-xs font-bold text-app-text">{stats.avgRating}</AppText>
              <AppText className="text-xs text-app-text-faint">({stats.ratingCount})</AppText>
            </View>
          ) : (
            <AppText className="text-xs text-app-text-muted">{t('p2p.reputation.noRating')}</AppText>
          )}
          <AppText className="text-xs text-app-text-muted">{t('p2p.reputation.completed', { count: stats.completed })}</AppText>
          {stats.successRate != null ? (
            <AppText className="text-xs text-app-text-muted">{t('p2p.reputation.successRate', { rate: stats.successRate })}</AppText>
          ) : null}
        </View>

        <View
          className="mt-4 p-3.5"
          style={{
            borderRadius: 18.4,
            backgroundColor: mixColors(colors.teal, colors.surfaceMuted, 0.07),
            borderWidth: 1,
            borderColor: withAlphaColor(colors.teal, 0.12),
          }}>
          <View className="flex-row items-center gap-2.5">
            <View className="rounded-lg px-2.5 py-1.5" style={chip}>
              <AppText className="text-xs font-black uppercase text-app-text">{offer.fromCurrency}</AppText>
            </View>
            <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: colors.teal }}>
              <ArrowRight size={12} color="#ffffff" strokeWidth={2.4} />
            </View>
            <View className="rounded-lg px-2.5 py-1.5" style={chip}>
              <AppText className="text-xs font-black uppercase text-app-text">{offer.toCurrency}</AppText>
            </View>
            <View className="ml-auto min-w-0 items-end">
              <AppText numberOfLines={1} className="text-sm font-black text-app-text">
                {String(offer.rate ?? '')}
              </AppText>
              <AppText numberOfLines={1} className="text-[11px] font-semibold text-app-text-muted">
                {offer.method}
              </AppText>
            </View>
          </View>
          {equivalent ? (
            <View
              className="mt-3 flex-row items-baseline justify-between gap-3 pt-2.5"
              style={{ borderTopWidth: 1, borderTopColor: withAlphaColor(colors.teal, 0.14) }}>
              <AppText className="text-[11px] font-semibold uppercase text-app-text-muted" style={{ letterSpacing: 0.3 }}>
                {t('p2p.page.equivalent')}
              </AppText>
              <AppText numberOfLines={1} className="text-sm font-black text-app-text">
                {formatCurrency(equivalent, offer.toCurrency)}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
