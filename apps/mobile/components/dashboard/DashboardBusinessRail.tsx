import { useEffect, useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Building2, MapPin, Star, UserPlus } from 'lucide-react-native';

import { businessActivityLabel } from '@moxt/shared/config/businessActivityLabels.js';
import { statusMeta } from '@moxt/shared/config/statuses.js';
import { isReviewVisible } from '@moxt/shared/utils/reviewUtils.js';

import { WebBadge, type BadgeTone } from '@/components/dashboard/webUi';
import { AppText } from '@/components/ui/AppText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import type { Business } from '@/store/account';
import { loadBusinessReviews } from '@/store/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';

const VISIBLE = ['verified', 'approved', 'active'];
/** clamp(12.45rem, 62.9vw, 15.25rem) à 390 px de large. */
const CARD_W = Math.round(Math.max(199.2, Math.min(390 * 0.629, 244)));

const SERVICE_LABELS: Record<string, string> = {
  transfer: 'Transfert',
  transfers: 'Transfert',
  marketplace: 'Marketplace',
  parcels: 'Colis',
  parcel: 'Colis',
  p2p: 'P2P',
  jobs: 'Jobs',
  events: 'Événements',
  videos: 'Vidéos',
};

/** Web dashboardBrowseUtils.isDashboardBusinessPublic. */
function isPublic(b: Business) {
  if (!b || b.deletedByUserAt) return false;
  if (!VISIBLE.includes(String(b.status))) return false;
  return ((b.activityVisibility as string) || 'public') === 'public';
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function BusinessCard({ business, userId, rating }: { business: Business; userId?: string; rating?: number | null }) {
  const { colors } = useTheme();
  const shadows = useShadows();
  const role = businessActivityLabel(business.primaryActivity) || (business.sector as string) || '';
  const status = statusMeta(business.status) as { label: string; tone: BadgeTone };
  const services = ((business.services as string[]) || []).slice(0, 2);
  const initial = (business.name || '?').slice(0, 2).toUpperCase();
  return (
    <View className="gap-2.5 rounded-[22px] bg-app-surface p-3.5" style={[{ width: CARD_W }, shadows.card]}>
      <Pressable className="flex-1 gap-2.5" onPress={() => router.push(`/organization/${business.id}` as never)}>
        <View className="flex-row items-start gap-2.5">
          {business.logoUrl ? (
            <Image source={{ uri: business.logoUrl }} style={{ width: 48, height: 48, borderRadius: 16 }} />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
              <AppText className="text-sm font-black text-white">{initial}</AppText>
            </View>
          )}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1">
              <AppText numberOfLines={1} className="shrink text-sm font-black text-app-text">
                {business.name}
              </AppText>
              <VerifiedIcon size={14} />
            </View>
            {role ? (
              <AppText numberOfLines={1} className="mt-0.5 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                {role}
              </AppText>
            ) : null}
            <View className="mt-1 flex-row flex-wrap items-center gap-1">
              <WebBadge tone={status.tone} small>
                {status.label}
              </WebBadge>
              {rating ? (
                <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-950/40">
                  <Star size={11} color="#b45309" fill="#b45309" strokeWidth={2} />
                  <AppText className="text-[11px] font-black text-amber-700 dark:text-amber-300">{rating.toFixed(1)}</AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        {business.description?.trim() ? (
          <AppText numberOfLines={2} className="text-[11px] text-app-text-muted" style={{ lineHeight: 16 }}>
            {business.description.trim()}
          </AppText>
        ) : null}
        <View className="mt-auto flex-row flex-wrap items-center gap-1.5">
          {business.city ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={11} color={colors.textFaint} strokeWidth={2} />
              <AppText numberOfLines={1} className="text-[11px] text-app-text-faint">
                {business.city}
              </AppText>
            </View>
          ) : null}
          {services.map((service) => (
            <WebBadge key={service} tone="teal" small>
              {SERVICE_LABELS[service] ?? service}
            </WebBadge>
          ))}
        </View>
      </Pressable>
      {userId && userId !== business.ownerId ? (
        <View className="border-t border-app-border pt-2">
          <Pressable
            onPress={() => router.push(`/organization/${business.id}` as never)}
            className="min-h-9 flex-row items-center justify-center gap-2 rounded-xl border border-app-border-md bg-app-surface">
            <UserPlus size={14} color={colors.text} strokeWidth={2} />
            <AppText className="text-sm text-app-text">S&apos;abonner</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** DashboardBusinessRail du web : ses entreprises d'abord, puis les autres mélangées. */
export function DashboardBusinessRail() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((s) => s.auth.user);
  const all = useAppSelector((s) => s.account.businesses);
  const reviews = useAppSelector((s) => s.dashboard.businessReviews);
  const visible = useMemo(() => {
    const list = all.filter(isPublic);
    const own = user?.id ? list.filter((b) => b.ownerId === user.id) : [];
    const others = user?.id ? list.filter((b) => b.ownerId !== user.id) : list;
    return [...own, ...others].slice(0, 24);
  }, [all, user?.id]);
  const ids = visible.map((b) => b.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-mélange seulement si la liste change (comme le web)
  const shuffled = useMemo(() => shuffle(visible), [ids]);

  useEffect(() => {
    if (ids) dispatch(loadBusinessReviews(ids.split(',')));
  }, [dispatch, ids]);

  const ratings = useMemo(() => {
    const map = new Map<string, number>();
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of reviews as { targetId?: string; rating?: number }[]) {
      if (!r.targetId || !isReviewVisible(r)) continue;
      const cur = sums.get(r.targetId) || { sum: 0, n: 0 };
      cur.sum += Number(r.rating) || 0;
      cur.n += 1;
      sums.set(r.targetId, cur);
    }
    for (const [id, { sum, n }] of sums) map.set(id, sum / n);
    return map;
  }, [reviews]);

  if (!shuffled.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -4 }}
      contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4, gap: 12, alignItems: 'stretch' }}>
      {shuffled.map((b) => (
        <BusinessCard key={b.id} business={b} userId={user?.id} rating={ratings.get(b.id) ?? null} />
      ))}
      <Pressable
        onPress={() => router.push('/organization' as never)}
        className="items-center justify-center gap-2.5 rounded-[22px] bg-app-surface p-3.5"
        style={[{ width: CARD_W }, shadows.card]}>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-app-accent-soft">
          <Building2 size={20} color={colors.accent} strokeWidth={2} />
        </View>
        <AppText className="text-center text-sm font-black text-app-text">Entreprises et échangeurs</AppText>
        <AppText className="text-center text-[11px] text-app-text-muted">Annuaire</AppText>
      </Pressable>
    </ScrollView>
  );
}
