import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  Database,
  Edit2,
  Edit3,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Lock,
  LogOut,
  Package,
  QrCode,
  Repeat,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { isPhoneVerified } from '@moxt/shared/auth/userSecurity.js';
import { fetchReviewsForTargetScope } from '@moxt/shared/services/reviewsService.js';
import { REVIEW_TARGET_TYPES, calculateAggregateRating, filterAggregateReviews } from '@moxt/shared/utils/reviewUtils.js';

import { WebBadge } from '@/components/dashboard/webUi';
import { DsAlert } from '@/components/ds/Alert';
import { AvatarBadge } from '@/components/profile/AvatarBadge';
import { ProfilePageShell } from '@/components/profile/ProfilePageShell';
import { AppText } from '@/components/ui/AppText';
import { WEB_BUTTON_TEXT } from '@/components/ui/webButtonText';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { logout } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { avatarDisplayUrl } from '@/utils/avatarDisplayUrl';
import { showNotice } from '@/utils/notice';
import { brand } from '@/theme/palette';
import { useShadows, useTheme } from '@/theme/ThemeContext';

type LinkItem = { labelKey: string; icon: LucideIcon; route: string | null };

/** accountSections (features/profile/profilePageConfig.js), routes mobiles équivalentes. */
const SECTIONS: { id: string; titleKey: string; links: LinkItem[] }[] = [
  {
    id: 'account',
    titleKey: 'profile.sections.account',
    links: [
      { labelKey: 'profile.links.personalInfo', icon: User, route: '/profile/edit' },
      { labelKey: 'profile.links.favorites', icon: Heart, route: '/favorites' },
      { labelKey: 'profile.links.subscriptions', icon: Bell, route: '/listing/mine?panel=subscriptions' },
      { labelKey: 'profile.links.activities', icon: Activity, route: null },
      { labelKey: 'profile.links.referral', icon: Gift, route: '/referral' },
    ],
  },
  {
    id: 'trust',
    titleKey: 'profile.sections.trust',
    links: [
      { labelKey: 'profile.links.verification', icon: CheckCircle, route: '/kyc' },
      { labelKey: 'profile.links.security', icon: Shield, route: '/settings' },
      { labelKey: 'profile.links.settings', icon: Settings, route: '/settings' },
    ],
  },
  {
    id: 'documents',
    titleKey: 'profile.sections.documents',
    links: [
      { labelKey: 'profile.links.documents', icon: FileText, route: null },
      { labelKey: 'profile.links.receipts', icon: FileText, route: null },
      { labelKey: 'profile.links.disputes', icon: AlertTriangle, route: '/disputes' },
      { labelKey: 'profile.links.support', icon: HelpCircle, route: '/support' },
      { labelKey: 'profile.links.legal', icon: FileText, route: null },
      { labelKey: 'profile.links.localData', icon: Database, route: '/export' },
    ],
  },
];

const ROLE_KEYS: Record<string, string> = {
  user: 'profile.roles.user',
  professional: 'profile.roles.professional',
  admin: 'profile.roles.admin',
  superadmin: 'profile.roles.superadmin',
};

function go(route: string | null, label: string) {
  if (route) router.push(route as never);
  else showNotice(label, 'Cette page est disponible sur le site MOXT pour le moment.');
}

/** profileCompletionPercent du web. */
function completionPercent(user: Record<string, unknown>) {
  const fields = [user.firstName, user.lastName, user.email, user.phone, user.country, user.city];
  return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100);
}

function IconBox({ icon: Icon, size = 36, radius = 11.2 }: { icon: LucideIcon; size?: number; radius?: number }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
      <Icon size={size > 34 ? 18 : 16} color={isDark ? colors.teal : colors.accent} strokeWidth={2} />
    </View>
  );
}

/** Page « Mon profil » du web (ProfilePage) : hero, téléphone, réputation, stats, liens, sécurité. */
export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const user = useAppSelector((s) => s.auth.user);
  const transfersCount = useAppSelector((s) => (user ? s.transfers.items.filter((item) => item.userId === user.id).length : 0));
  const listingsCount = useAppSelector((s) => (user ? s.marketplace.items.filter((item) => item.ownerId === user.id).length : 0));
  const parcelsCount = useAppSelector((s) => (user ? s.parcels.items.filter((item) => item.ownerId === user.id).length : 0));
  const favoritesCount = useAppSelector((s) => s.favorites.items.length);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let cancelled = false;
    fetchReviewsForTargetScope(supabase, { profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE, profileTargetId: user.id })
      .then((rows) => !cancelled && setReviews(rows as Record<string, unknown>[]))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const rating = useMemo(() => {
    if (!user?.id) return { count: 0 };
    return calculateAggregateRating(
      filterAggregateReviews(reviews, { profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE, profileTargetId: user.id, publicationIds: {} }),
    ) as { count: number };
  }, [reviews, user?.id]);

  if (!user) return null;
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const completion = completionPercent(user);
  const roleLabel = ROLE_KEYS[user.role] ? t(ROLE_KEYS[user.role]) : user.role || t('profile.roles.user');
  const avatarUri = avatarDisplayUrl(user.avatarUrl, 160);
  const phoneVerified = isPhoneVerified(user);
  const accentText = isDark ? brand[300] : brand[700];
  const stats: { key: string; labelKey: string; icon: LucideIcon; value: number; route: string }[] = [
    { key: 'transfers', labelKey: 'profile.stats.transfers', icon: Repeat, value: transfersCount, route: '/(tabs)/transfers' },
    { key: 'listings', labelKey: 'profile.stats.publications', icon: ShoppingBag, value: listingsCount, route: '/listing/mine' },
    { key: 'parcels', labelKey: 'profile.stats.parcels', icon: Package, value: parcelsCount, route: '/(tabs)/parcels' },
    { key: 'favorites', labelKey: 'profile.stats.favorites', icon: Heart, value: favoritesCount, route: '/favorites' },
  ];

  return (
    <ProfilePageShell pathname="/profile" gap={24}>
      {/* ProfileHeroCard (Card variant verified / featured) */}
      <View
        className="overflow-hidden rounded-card-lg border border-app-border bg-app-surface p-5"
        style={[shadows.card, user.verified ? { borderLeftWidth: 3, borderLeftColor: isDark ? brand[400] : brand[600] } : null]}>
        <View style={{ gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ position: 'relative' }}>
              {avatarUri ? (
                <View style={[{ borderRadius: 16 }, shadows.card]}>
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted }}
                    contentFit="cover"
                    accessibilityLabel={displayName}
                  />
                </View>
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText className="text-2xl font-black" style={{ color: isDark ? colors.teal : colors.accent }}>
                    {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                  </AppText>
                </View>
              )}
              <AvatarBadge url={user.avatarUrl} />
              <Pressable
                accessibilityLabel={t('profile.avatarEditor.openAria')}
                onPress={() => router.push('/profile/edit' as never)}
                style={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface,
                  backgroundColor: isDark ? colors.teal : brand[700],
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
                }}>
                <Edit2 size={14} color={isDark ? '#020617' : '#ffffff'} strokeWidth={2} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/referral' as never)}
              className="flex-row items-center border border-app-border-md bg-app-surface"
              style={{ minHeight: 44, borderRadius: 12, paddingHorizontal: 20, gap: 8 }}>
              <QrCode size={18} color={colors.text} strokeWidth={1.8} />
              <AppText className={`${WEB_BUTTON_TEXT} text-app-text`}>{t('share.share')}</AppText>
            </Pressable>
          </View>

          <View style={{ minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText display numberOfLines={1} className="text-2xl text-app-text" style={{ letterSpacing: -0.48, flexShrink: 1 }}>
                {displayName}
              </AppText>
              {user.verified ? <VerifiedIcon size={16} /> : null}
            </View>
            <AppText numberOfLines={1} className="mt-1 text-sm text-app-text-muted">
              {user.email}
            </AppText>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <WebBadge>{roleLabel}</WebBadge>
              {!user.verified ? <WebBadge tone="warning">{t('profile.hero.unverifiedBadge')}</WebBadge> : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/profile/edit' as never)}
              className="flex-row items-center rounded-xl border border-app-border bg-app-surface"
              style={[{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }, shadows.card]}>
              <Edit3 size={14} color={colors.text} strokeWidth={2} />
              <AppText className="text-sm font-semibold text-app-text">{t('profile.hero.edit')}</AppText>
            </Pressable>
          </View>
        </View>

        {!user.verified ? (
          <Pressable
            onPress={() => router.push('/kyc' as never)}
            className="mt-4 flex-row items-center justify-between rounded-card border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
            <AppText className="flex-1 text-sm font-semibold text-amber-900 dark:text-amber-100">{t('profile.hero.verifyCta')}</AppText>
            <ChevronRight size={16} color={isDark ? '#fef3c7' : '#78350f'} />
          </Pressable>
        ) : null}

        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <AppText className="text-xs font-semibold text-app-text-muted">{t('profile.hero.completionLabel')}</AppText>
            <AppText className="text-xs font-semibold text-app-text">{completion}%</AppText>
          </View>
          <View style={{ marginTop: 8, height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.surfaceMuted }}>
            <View style={{ height: '100%', width: `${completion}%`, borderRadius: 999, backgroundColor: isDark ? colors.teal : colors.accent }} />
          </View>
          {completion < 100 ? (
            <Pressable onPress={() => router.push('/profile/edit' as never)} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText className="text-xs font-semibold" style={{ color: accentText }}>
                {t('profile.hero.completeLink')}
              </AppText>
              <ChevronRight size={14} color={accentText} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* PhoneVerificationCard : état vérifié (sinon renvoi vers la vérification) */}
      {phoneVerified ? (
        <DsAlert variant="success" title={t('security.phone.verifiedTitle')}>
          {t('security.phone.verifiedBody', { phone: user.phone })}
        </DsAlert>
      ) : (
        <Pressable onPress={() => router.push('/kyc' as never)}>
          <DsAlert variant="warning" title={t('security.phone.title')}>
            {t('profile.hero.verifyCta')}
          </DsAlert>
        </Pressable>
      )}

      {/* Réputation */}
      <View className="rounded-card-lg border border-app-border bg-app-surface p-4" style={[shadows.card, { gap: 12 }]}>
        <View>
          <AppText className="text-xs font-bold uppercase" style={{ letterSpacing: 0.96, color: accentText }}>
            {t('reviews.reputation')}
          </AppText>
          <AppText className="mt-1 text-sm text-app-text-muted">
            {rating.count ? t('reviews.communityDescription', { count: rating.count }) : t('reviews.emptyDescription')}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Pressable
            onPress={() => showNotice(t('publications.user.tabs.reviews'), 'La page publique des avis est disponible sur le site MOXT pour le moment.')}
            className="flex-row items-center border border-app-border-md bg-app-surface"
            style={{ minHeight: 44, borderRadius: 12, paddingHorizontal: 20, gap: 8 }}>
            <Star size={16} color={colors.text} strokeWidth={2} />
            <AppText className="text-sm font-semibold text-app-text">
              {t('publications.user.tabs.reviews')}
              {rating.count ? ` (${rating.count})` : ''}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* ProfileQuickStats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {stats.map((stat) => (
          <Pressable
            key={stat.key}
            onPress={() => router.push(stat.route as never)}
            className="flex-row items-center rounded-card-lg border border-app-border bg-app-surface p-3"
            style={[{ width: '48.7%', gap: 12 }, shadows.finance]}>
            <IconBox icon={stat.icon} />
            <View style={{ minWidth: 0 }}>
              <AppText className="text-xl font-black text-app-text" style={{ fontVariant: ['tabular-nums'] }}>
                {stat.value}
              </AppText>
              <AppText className="text-[11px] font-semibold text-app-text-faint">{t(stat.labelKey)}</AppText>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ProfileLinkGrid */}
      <View style={{ gap: 16 }}>
        {SECTIONS.map((group) => (
          <View key={group.id}>
            <AppText className="mb-2.5 px-1 text-[10px] font-black uppercase text-app-text-faint" style={{ letterSpacing: 1.6 }}>
              {t(group.titleKey)}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {group.links.map((link) => (
                <Pressable
                  key={link.labelKey}
                  accessibilityRole="link"
                  onPress={() => go(link.route, t(link.labelKey))}
                  className="flex-row items-center rounded-card border border-app-border bg-app-surface px-3 py-2.5"
                  style={[{ width: '48.7%', gap: 10 }, shadows.card]}>
                  <IconBox icon={link.icon} size={32} />
                  <AppText className="flex-1 text-xs font-semibold text-app-text" style={{ lineHeight: 16 }}>
                    {t(link.labelKey)}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ProfileSecuritySummary */}
      <View className="rounded-card-lg border border-app-border bg-app-surface p-4" style={shadows.card}>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <IconBox icon={Shield} size={40} />
            <View style={{ flex: 1 }}>
              <AppText display className="text-base text-app-text">
                {t('profile.security.title')}
              </AppText>
              <AppText className="mt-1 text-sm text-app-text-muted" style={{ lineHeight: 24 }}>
                {t('profile.security.description')}
              </AppText>
            </View>
          </View>
          <Pressable onPress={() => router.push('/settings' as never)}>
            <AppText className="text-sm font-semibold" style={{ color: accentText }}>
              {t('profile.security.manage')}
            </AppText>
          </Pressable>
        </View>
        <View style={{ marginTop: 16, gap: 8 }}>
          {[
            { icon: CheckCircle, color: isDark ? '#34d399' : '#059669', label: t('profile.security.sessionActive') },
            { icon: Lock, color: accentText, label: t('profile.security.passwordNotInSession') },
            { icon: Shield, color: accentText, label: user.verified ? t('profile.security.verified') : t('profile.security.unverified') },
          ].map(({ icon: Icon, color, label }) => (
            <View key={label} className="flex-row items-center rounded-card border border-app-border bg-app-surface-muted px-3 py-2.5" style={{ gap: 12 }}>
              <Icon size={16} color={color} strokeWidth={2} />
              <AppText className="flex-1 text-sm text-app-text-muted">{label}</AppText>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => dispatch(logout())}
            style={{
              minHeight: 44,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDark ? 'rgba(69,10,10,0.5)' : colors.dangerBg,
            }}>
            <LogOut size={16} color={isDark ? '#fca5a5' : colors.danger} strokeWidth={2} />
            <AppText className="text-sm font-semibold" style={{ color: isDark ? '#fca5a5' : colors.danger }}>
              {t('nav.signOut')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </ProfilePageShell>
  );
}
