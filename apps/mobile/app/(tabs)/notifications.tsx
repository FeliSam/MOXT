import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { markAllAsRead, markAsRead } from '@/store/notifications';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing } from '@/theme/colors';
import { useLanguage } from '@/providers/LanguageProvider';

const TYPE_ICONS: Record<string, string> = {
  transfer: '💸',
  parcel: '📦',
  marketplace: '🛒',
  message: '💬',
  system: '🔔',
};

export default function NotificationsTabScreen() {
  const dispatch = useAppDispatch();
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const items = useAppSelector((state) => state.notifications.items);
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: brand[700] }]} />
          <Text style={[styles.eyebrow, { color: brand[700] }]}>NOTIFICATIONS</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {translateLabel('Notifications')}
          </Text>
          {unreadCount > 0 && (
            <Pressable
              style={[styles.markAllBtn, { backgroundColor: brand[50], borderColor: brand[200] }]}
              onPress={() => dispatch(markAllAsRead())}>
              <Text style={[styles.markAllText, { color: brand[700] }]}>Tout marquer lu</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {unreadCount} non lue(s) · {items.length} total
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.notifCard,
              shadows.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !item.read && { backgroundColor: brand[50], borderColor: brand[200] },
            ]}
            onPress={() => dispatch(markAsRead(item.id))}>
            {/* Left accent */}
            <View style={[styles.cardAccent, { backgroundColor: !item.read ? brand[500] : brand[200] }]} />

            <View style={[styles.iconWrap, { backgroundColor: !item.read ? brand[100] : colors.surfaceMuted }]}>
              <Text style={styles.notifIcon}>{TYPE_ICONS[item.type || 'system'] || '🔔'}</Text>
            </View>
            <View style={styles.notifBody}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.notifText, { color: colors.textMuted }]} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={[styles.notifDate, { color: colors.textFaint }]}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: brand[500] }]} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: brand[50] }]}>
              <Text style={{ fontSize: 32 }}>🔔</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucune notification
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Vous serez notifié des mises à jour de vos transferts et messages.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },

  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  markAllText: { fontSize: 12, fontWeight: '700' },

  list: { padding: spacing.lg, gap: spacing.md },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    padding: spacing.lg,
    paddingLeft: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifBody: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: '700' },
  notifText: { fontSize: 13, lineHeight: 18 },
  notifDate: { fontSize: 11, marginTop: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.md },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: spacing['3xl'], lineHeight: 20 },
});
