import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, History, MessageCircle, Newspaper, Package, Plus, type LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { getMobileHeaderActions, ROUTE_TITLES } from '@/constants/routeTitles';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { resetNavbarVisibility, useSmartNavbarVisibility } from '@/hooks/useSmartNavbar';
import { useLanguage } from '@/providers/LanguageProvider';
import { selectUnreadMessageCount } from '@/store/messages';
import { selectUnreadNotificationCount } from '@/store/notifications';
import { useAppSelector } from '@/store/store';
import { withAlphaColor } from '@/theme/palette';
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
  return <Icon size={HEADER.icon} color={withAlphaColor(colors.text, 0.72)} strokeWidth={HEADER.iconStroke} />;
}

/** En-tête de l'app — miroir de moxt-react Header.jsx en viewport mobile (< 640px) avec Smart Navbar. */
export function AppHeader({ pathname }: { pathname: string }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
  const title = translateLabel(
    pathname.startsWith('/news/') ? 'Publication' : (matchedPath && ROUTE_TITLES[matchedPath]) || 'MOXT',
  );

  const isNavbarVisible = useSmartNavbarVisibility();
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    resetNavbarVisibility();
  }, [pathname]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isNavbarVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim, isNavbarVisible]);

  const topPad = headerPaddingTop(insets.top);
  const totalHeight = topPad + HEADER.height + 12;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-totalHeight, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        paddingTop: topPad,
        paddingBottom: 8,
        paddingHorizontal: HEADER.padX,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: HEADER.gap,
        backgroundColor: colors.background,
        zIndex: 40,
      }}>
      <HeaderChip>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.profileSecurity.openProfile')}
          onPress={() => router.push('/profile' as never)}
          style={({ pressed }) => ({
            width: HEADER.avatar,
            height: HEADER.avatar,
            borderRadius: HEADER.avatar / 2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}>
          <UserAvatar user={user} size={HEADER.avatar} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <AppText
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: '900',
              color: colors.text,
              lineHeight: 18,
            }}>
            {title}
          </AppText>
        </View>
      </HeaderChip>

      <View style={{ height: HEADER.height, flexDirection: 'row', alignItems: 'center', gap: HEADER.gap, flexShrink: 0, marginLeft: 'auto' }}>
        {actions.showPublishMenu ? (
          <HeaderActionButton testID="header-publish" accessibilityLabel={translateLabel('Publier')} onPress={openPublish}>
            <HeaderIcon icon={Plus} />
          </HeaderActionButton>
        ) : null}
        {actions.showNews ? (
          <HeaderActionButton accessibilityLabel={t('nav.news')} onPress={() => router.push('/news' as never)}>
            <HeaderIcon icon={Newspaper} />
          </HeaderActionButton>
        ) : null}
        {actions.showParcels ? (
          <HeaderActionButton
            accessibilityLabel={
              availableParcels ? t('nav.parcelsAvailableAria', { count: availableParcels }) : t('nav.parcels')
            }
            badge={availableParcels}
            onPress={() => router.push('/(tabs)/parcels' as never)}>
            <HeaderIcon icon={Package} />
          </HeaderActionButton>
        ) : null}
        {actions.showHistory ? (
          <HeaderActionButton accessibilityLabel={t('dashboard.overview.history')} onPress={() => router.push('/(tabs)/transfers' as never)}>
            <HeaderIcon icon={History} />
          </HeaderActionButton>
        ) : null}
        <HeaderActionButton
          accessibilityLabel={
            unreadNotifications ? t('nav.notificationsUnreadAria', { count: unreadNotifications }) : t('notifications.title')
          }
          badge={unreadNotifications}
          onPress={() => router.push('/(tabs)/notifications' as never)}>
          <HeaderIcon icon={Bell} />
        </HeaderActionButton>
        {actions.showMessages ? (
          <HeaderActionButton
            accessibilityLabel={
              unreadMessages ? t('nav.messagesUnreadAria', { count: unreadMessages }) : t('nav.messages')
            }
            badge={unreadMessages}
            onPress={() => router.push('/(tabs)/messages' as never)}>
            <HeaderIcon icon={MessageCircle} />
          </HeaderActionButton>
        ) : null}
      </View>
    </Animated.View>
  );
}

