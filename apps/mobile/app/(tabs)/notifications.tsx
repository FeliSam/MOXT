import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell, Check, MessageSquare, Star, X, Zap } from 'lucide-react-native';

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

const BADGE_THEMES: Record<string, { bg: string; fg: string; border: string }> = {
  brand: { bg: 'rgba(15, 118, 110, 0.12)', fg: '#0f766e', border: 'rgba(15, 118, 110, 0.3)' },
  emerald: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  amber: { bg: 'rgba(245, 158, 11, 0.15)', fg: '#b45309', border: 'rgba(245, 158, 11, 0.35)' },
  rose: { bg: 'rgba(244, 63, 94, 0.12)', fg: '#e11d48', border: 'rgba(244, 63, 94, 0.3)' },
  violet: { bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed', border: 'rgba(139, 92, 246, 0.3)' },
  sky: { bg: 'rgba(14, 165, 233, 0.12)', fg: '#0284c7', border: 'rgba(14, 165, 233, 0.3)' },
  slate: { bg: 'rgba(100, 116, 139, 0.12)', fg: '#475569', border: 'rgba(100, 116, 139, 0.3)' },
};

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

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        dispatch(loadNotifications(userId));
      }

      // Synchronisation automatique en continu pendant la consultation de l'écran (toutes les 10s)
      const interval = setInterval(() => {
        if (userId) {
          dispatch(loadNotifications(userId));
        }
      }, 10_000);

      return () => clearInterval(interval);
    }, [dispatch, userId])
  );

  const [sheetItem, setSheetItem] = useState<NotificationItem | null>(null);

  function open(item: NotificationItem) {
    if (!item.read) dispatch(markAsRead(item.id));
    if (item.displayMode === 'sheet') {
      setSheetItem(item);
      return;
    }
    const target = mobileNotificationRoute(item.link, item.type);
    if (target) router.push(target as never);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { if (userId) dispatch(loadNotifications(userId)); }} tintColor={colors.accent} />}>
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
            const isSheet = item.displayMode === 'sheet';
            const canOpen = isSheet || Boolean(target);
            const badgeTheme = BADGE_THEMES[item.badgeColor || 'brand'] || BADGE_THEMES.brand;

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
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        {item.badgeText ? (
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              borderRadius: 6,
                              backgroundColor: badgeTheme.bg,
                              borderWidth: 1,
                              borderColor: badgeTheme.border,
                            }}>
                            <AppText style={{ fontSize: 9, fontWeight: '900', color: badgeTheme.fg, textTransform: 'uppercase' }}>
                              {item.badgeText}
                            </AppText>
                          </View>
                        ) : null}
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
                      {canOpen ? (
                        <Pressable onPress={() => open(item)} style={{ minHeight: 32, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                          <AppText className="text-xs font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
                            {isMessageNotification(item)
                              ? 'Ouvrir la conversation'
                              : item.actionLabel || (isSheet ? 'Voir l’alerte' : 'Ouvrir')}
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

      {/* Bottom Sheet Modal */}
      <Modal
        visible={Boolean(sheetItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetItem(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheetItem(null)} />
          {sheetItem ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                paddingBottom: 40,
                gap: 14,
                maxHeight: '80%',
              }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center' }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {sheetItem.badgeText ? (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: (BADGE_THEMES[sheetItem.badgeColor || 'brand'] || BADGE_THEMES.brand).bg,
                        borderWidth: 1,
                        borderColor: (BADGE_THEMES[sheetItem.badgeColor || 'brand'] || BADGE_THEMES.brand).border,
                      }}>
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight: '900',
                          color: (BADGE_THEMES[sheetItem.badgeColor || 'brand'] || BADGE_THEMES.brand).fg,
                          textTransform: 'uppercase',
                        }}>
                        {sheetItem.badgeText}
                      </AppText>
                    </View>
                  ) : null}
                  <AppText className="text-xs font-bold uppercase text-app-text-muted">
                    {PRIORITY[priorityOf(sheetItem)].label}
                  </AppText>
                </View>
                <Pressable onPress={() => setSheetItem(null)} hitSlop={12}>
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <AppText className="text-lg font-black text-app-text">{sheetItem.title}</AppText>
              {sheetItem.createdAt ? (
                <AppText className="text-xs text-app-text-faint">
                  {new Date(sheetItem.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </AppText>
              ) : null}

              <ScrollView style={{ maxHeight: 220 }}>
                <LinkifiedText
                  text={sheetItem.message}
                  style={{ fontSize: 15, lineHeight: 22, color: colors.text }}
                  linkStyle={{ color: colors.accent }}
                />
              </ScrollView>

              <View style={{ gap: 8, marginTop: 6 }}>
                {sheetItem.link ? (
                  <Pressable
                    onPress={() => {
                      const target = mobileNotificationRoute(sheetItem.link, sheetItem.type);
                      setSheetItem(null);
                      if (target) router.push(target as never);
                    }}
                    style={{
                      minHeight: 44,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.accent,
                    }}>
                    <AppText className="text-sm font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>
                      {sheetItem.actionLabel || 'Ouvrir'}
                    </AppText>
                  </Pressable>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {!sheetItem.read ? (
                    <Pressable
                      onPress={() => {
                        dispatch(markAsRead(sheetItem.id));
                        setSheetItem((curr) => (curr ? { ...curr, read: true } : null));
                      }}
                      className="border border-app-border"
                      style={{
                        flex: 1,
                        minHeight: 38,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <AppText className="text-xs font-bold text-app-text">Marquer lue</AppText>
                    </Pressable>
                  ) : null}

                  {userId ? (
                    <Pressable
                      onPress={() => {
                        dispatch(archiveNotification({ id: sheetItem.id, userId }));
                        setSheetItem(null);
                      }}
                      className="border border-app-border"
                      style={{
                        flex: 1,
                        minHeight: 38,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <AppText className="text-xs font-bold text-app-text">Archiver</AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
