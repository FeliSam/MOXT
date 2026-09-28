import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, History, MessageCircle, Newspaper, Package, Plus, type LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { getMobileHeaderActions, ROUTE_TITLES } from '@/constants/routeTitles';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectUnreadMessageCount } from '@/store/messages';
import { selectUnreadNotificationCount } from '@/store/notifications';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';

import { HeaderActionButton, HeaderChip, HeaderCountBadge, UserAvatar } from './HeaderChrome';
import { HEADER, headerPaddingTop } from './headerTokens';

type ParcelLike = { status?: string; remainingKg?: number; capacityKg?: number; departureDate?: string };

/** Approximation de isAvailableBrowseParcel (moxt-react/src/features/parcels/parcelUtils.js). */
function isAvailableParcel(parcel: ParcelLike, today: string) {
  if (!parcel) return false;
  if (parcel.status && parcel.status !== 'active') return false;
  if (parcel.departureDate && parcel.departureDate.slice(0, 10) < today) return false;
  const kg = Number(parcel.remainingKg ?? parcel.capacityKg ?? 0);
  return Number.isFinite(kg) && kg > 0;
}

function HeaderIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { colors } = useTheme();
  return <Icon size={HEADER.icon} color={colors.text} strokeWidth={HEADER.iconStroke} opacity={HEADER.iconOpacity} />;
}

/** En-tête de l'app — miroir de moxt-react Header.jsx en viewport mobile (< 640px). */
export function AppHeader({ pathname }: { pathname: string }) {
  const insets = useSafeAreaInsets();
  const { t, translateLabel } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  // Badge cloche : compteur serveur (mêmes règles que le web), tenu à jour en temps réel.
  const unreadNotifications = useAppSelector(selectUnreadNotificationCount);
  const unreadMessages = useAppSelector((s) => selectUnreadMessageCount(s.messages.conversations, user?.id));
  const availableParcels = useAppSelector((s) => {
    const today = new Date().toISOString().slice(0, 10);
    return (s.parcels.items as ParcelLike[]).filter((p) => isAvailableParcel(p, today)).length;
  });
  // Modules « dev » du web (drapeaux app_module_flags, news masqué quand le fil est actif).
  const flags = useAppSelector((s) => s.platform.flags);
  const openPublish = usePublishMenu();
  const actions = getMobileHeaderActions(pathname, { canFeed: flags.feed, canNews: flags.news, canParcels: flags.parcels });
  const matchedPath =
    (ROUTE_TITLES[pathname] && pathname) ||
    Object.keys(ROUTE_TITLES)
      .sort((a, b) => b.length - a.length)
      .find((key) => pathname === key || pathname.startsWith(`${key}/`));
  const title = translateLabel((matchedPath && ROUTE_TITLES[matchedPath]) || 'MOXT');

  return (
    <View
      style={{
        paddingTop: headerPaddingTop(insets.top),
        paddingHorizontal: HEADER.padX,
        flexDirection: 'row',
        alignItems: 'center',
        gap: HEADER.gap,
      }}>
      <HeaderChip>
        <HeaderActionButton
          transparent
          size={HEADER.avatar}
          accessibilityLabel={t('settings.profileSecurity.openProfile')}
          onPress={() => router.push('/profile' as never)}>
          <UserAvatar user={user} size={HEADER.avatar} />
        </HeaderActionButton>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText numberOfLines={1} className="text-sm font-black text-app-text" style={{ lineHeight: 14 }}>
            {title}
          </AppText>
        </View>
      </HeaderChip>

      <View style={{ height: HEADER.height, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap, flexShrink: 0 }}>
        {actions.showPublishMenu ? (
          <HeaderActionButton testID="header-publish" accessibilityLabel={translateLabel('Publier')} onPress={openPublish}>
            <HeaderIcon icon={Plus} />
          </HeaderActionButton>
        ) : null}
        {actions.showNews ? (
          <HeaderActionButton accessibilityLabel={t('nav.news')} onPress={() => router.push('/(tabs)/feed?type=post' as never)}>
            <HeaderIcon icon={Newspaper} />
          </HeaderActionButton>
        ) : null}
        {actions.showParcels ? (
          <View>
            <HeaderActionButton
              accessibilityLabel={
                availableParcels ? t('nav.parcelsAvailableAria', { count: availableParcels }) : t('nav.parcels')
              }
              onPress={() => router.push('/(tabs)/parcels' as never)}>
              <HeaderIcon icon={Package} />
            </HeaderActionButton>
            <HeaderCountBadge value={availableParcels} />
          </View>
        ) : null}
        {actions.showHistory ? (
          <HeaderActionButton accessibilityLabel={t('dashboard.overview.history')} onPress={() => router.push('/(tabs)/transfers' as never)}>
            <HeaderIcon icon={History} />
          </HeaderActionButton>
        ) : null}
        <View>
          <HeaderActionButton
            accessibilityLabel={
              unreadNotifications ? t('nav.notificationsUnreadAria', { count: unreadNotifications }) : t('notifications.title')
            }
            onPress={() => router.push('/(tabs)/notifications' as never)}>
            <HeaderIcon icon={Bell} />
          </HeaderActionButton>
          <HeaderCountBadge value={unreadNotifications} />
        </View>
        {actions.showMessages ? (
          <View>
            <HeaderActionButton
              accessibilityLabel={
                unreadMessages ? t('nav.messagesUnreadAria', { count: unreadMessages }) : t('nav.messages')
              }
              onPress={() => router.push('/(tabs)/messages' as never)}>
              <HeaderIcon icon={MessageCircle} />
            </HeaderActionButton>
            <HeaderCountBadge value={unreadMessages} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
