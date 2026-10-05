import { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Check, MessageSquare, Star, Zap } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  archiveNotification,
  loadNotifications,
  markAllAsRead,
  markAsRead,
  selectUnreadNotificationCount,
  selectVisibleNotifications,
  type NotificationItem,
} from '@/store/notifications';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { isMessageNotification, mobileNotificationRoute } from '@/utils/notificationRoutes';

const PRIORITY = {
  high: { label: 'Urgent', icon: Zap, border: '#fda4af', fg: '#be123c' },
  normal: { label: 'Standard', icon: Star, border: '#99f6e4', fg: '#0f766e' },
  low: { label: 'Faible', icon: Bell, border: '#cbd5e1', fg: '#475569' },
} as const;

function priorityOf(item: NotificationItem) {
  if (item.priority === 'high' || item.priority === 'low') return item.priority;
  return 'normal' as const;
}

/** Centre de notifications (NotificationsPage du web) : priorité, ouvrir, archiver. */
export default function NotificationsTabScreen() {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const items = useAppSelector(selectVisibleNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const loading = useAppSelector((state) => state.notifications.status === 'loading');

  useEffect(() => {
    if (userId) dispatch(loadNotifications(userId));
  }, [dispatch, userId]);

  function open(item: NotificationItem) {
    if (!item.read) dispatch(markAsRead(item.id));
    const target = mobileNotificationRoute(item.link, item.type);
    if (target) router.push(target as never);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => userId && dispatch(loadNotifications(userId))} tintColor={colors.accent} />}>
      <AppText className="text-xs font-black uppercase text-app-accent" style={{ letterSpacing: 1.2 }}>
        {t('notifications.eyebrow') === 'notifications.eyebrow' ? 'Activité' : t('notifications.eyebrow')}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AppText className="text-2xl font-black text-app-text">Notifications</AppText>
          <AppText className="mt-1 text-sm text-app-text-muted">{unreadCount} non lue(s)</AppText>
        </View>
        {unreadCount > 0 && userId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => dispatch(markAllAsRead(userId))}
            className="border border-app-border bg-app-surface"
            style={{ minHeight: 36, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Check size={14} color={colors.text} />
            <AppText className="text-xs font-bold text-app-text">Tout lire</AppText>
          </Pressable>
        ) : null}
      </View>

      {!items.length ? (
        <View className="items-center rounded-card-lg border border-app-border bg-app-surface p-6">
          <AppText className="text-base font-black text-app-text">Aucune notification</AppText>
          <AppText className="text-center text-sm text-app-text-muted">Les alertes de MOXT apparaîtront ici.</AppText>
        </View>
      ) : (
        items.map((item) => {
          const priority = priorityOf(item);
          const style = PRIORITY[priority];
          const Icon = isMessageNotification(item) ? MessageSquare : style.icon;
          const target = mobileNotificationRoute(item.link, item.type);
          return (
            <Pressable
              key={item.id}
              onPress={() => open(item)}
              className="border border-app-border bg-app-surface"
              style={{
                borderRadius: 18,
                padding: 14,
                gap: 8,
                backgroundColor: colors.surface,
                borderColor: item.read ? colors.border : style.border,
              }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#ffffff' }}>
                  <Icon size={18} color={style.fg} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <AppText className="flex-1 text-sm font-black text-app-text">{item.title}</AppText>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {!item.read ? (
                        <AppText className="text-[10px] font-black uppercase" style={{ color: '#b45309' }}>
                          Nouvelle
                        </AppText>
                      ) : (
                        <AppText className="text-[10px] font-black uppercase text-app-text-muted">Lue</AppText>
                      )}
                      <AppText className="text-[10px] font-black uppercase" style={{ color: style.fg }}>
                        {style.label}
                      </AppText>
                    </View>
                  </View>
                  <LinkifiedText
                    text={item.message}
                    style={{ fontSize: 14, lineHeight: 20, color: colors.textMuted }}
                    linkStyle={{ color: colors.accent }}
                  />
                  {item.createdAt ? (
                    <AppText className="text-[11px] text-app-text-faint">
                      {new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    {target ? (
                      <Pressable onPress={() => open(item)} style={{ minHeight: 32, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                        <AppText className="text-xs font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
                          {isMessageNotification(item) ? 'Ouvrir la conversation' : 'Ouvrir'}
                        </AppText>
                      </Pressable>
                    ) : null}
                    {!item.read ? (
                      <Pressable
                        onPress={() => dispatch(markAsRead(item.id))}
                        className="border border-app-border"
                        style={{ minHeight: 32, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText className="text-xs font-bold text-app-text">Marquer lue</AppText>
                      </Pressable>
                    ) : null}
                    {userId ? (
                      <Pressable
                        onPress={() => dispatch(archiveNotification({ id: item.id, userId }))}
                        className="border border-app-border"
                        style={{ minHeight: 32, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText className="text-xs font-bold text-app-text">Archiver</AppText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
