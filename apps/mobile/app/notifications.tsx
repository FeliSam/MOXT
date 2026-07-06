import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { markAllAsRead, markAsRead } from '@/store/notifications';
import { useAppDispatch, useAppSelector } from '@/store/store';

const TYPE_ICONS: Record<string, string> = {
  transfer: '💸',
  parcel: '📦',
  marketplace: '🛒',
  message: '💬',
  system: '🔔',
};

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.notifications.items);
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 ? (
            <Pressable onPress={() => dispatch(markAllAsRead())}>
              <Text style={styles.markAllText}>Tout marquer lu</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subtitle}>{unreadCount} non lue(s)</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notifCard, !item.read && styles.notifCardUnread]}
            onPress={() => dispatch(markAsRead(item.id))}>
            <Text style={styles.notifIcon}>{TYPE_ICONS[item.type || 'system'] || '🔔'}</Text>
            <View style={styles.notifBody}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifText} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.notifDate}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
            </View>
            {!item.read ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous serez notifié des mises à jour de vos transferts et messages.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backArrow: { fontSize: 20, color: '#1d4ed8' },
  backLabel: { fontSize: 16, color: '#1d4ed8', fontWeight: '600' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  markAllText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  subtitle: { fontSize: 14, color: '#64748b' },
  list: { padding: 20, gap: 10 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notifCardUnread: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  notifIcon: { fontSize: 24 },
  notifBody: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  notifText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  notifDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1d4ed8', marginTop: 6 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  emptyText: { textAlign: 'center', color: '#64748b', paddingHorizontal: 32, lineHeight: 20 },
});
