import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { IconButton } from '@/components/ui';
import { ListCard } from '@/components/ui/ListCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { Conversation, loadConversations } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { brand, radii, spacing } from '@/theme/colors';
import { useShadows, useThemeColors } from '@/theme/ThemeContext';

type MessageFilter = 'all' | 'unread' | 'archived';

const FILTER_LABELS: Record<MessageFilter, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  archived: 'Archivées',
};

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function ConversationCard({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId?: string;
}) {
  const colors = useThemeColors();
  const lastMessage = conversation.messages.at(-1);
  const unread = Boolean(lastMessage && lastMessage.senderId !== currentUserId);

  return (
    <ListCard
      selected={unread}
      className="min-h-[76px] flex-row items-center gap-3 p-4"
      onPress={() => router.push(`/messages/${conversation.id}` as never)}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>{getInitials(conversation.title) || 'M'}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text selectable numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
            {conversation.title}
          </Text>
          {unread ? <View style={[styles.unreadDot, { backgroundColor: colors.teal }]} /> : null}
        </View>
        <Text
          selectable
          numberOfLines={1}
          style={[styles.lastMessage, { color: colors.textMuted }]}>
          {lastMessage ? `${lastMessage.senderName}: ${lastMessage.text}` : 'Pas de message'}
        </Text>
      </View>
      <Text style={[styles.date, { color: colors.textFaint }]}>
        {new Date(conversation.updatedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        })}
      </Text>
    </ListCard>
  );
}

export default function MessagesTabScreen() {
  const dispatch = useAppDispatch();
  const { translateLabel } = useLanguage();
  const colors = useThemeColors();
  const shadows = useShadows();
  const user = useAppSelector((state) => state.auth.user);
  const conversations = useAppSelector((state) => state.messages.conversations);
  const loading = useAppSelector((state) => state.messages.loading);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<MessageFilter>('all');

  useEffect(() => {
    if (user?.id) dispatch(loadConversations(user.id));
  }, [dispatch, user?.id]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');

    return conversations.filter((conversation) => {
      const lastMessage = conversation.messages.at(-1);
      const unread = Boolean(lastMessage && lastMessage.senderId !== user?.id);
      if (filter === 'unread' && !unread) return false;
      if (filter === 'archived') return false;
      if (!normalizedQuery) return true;
      return `${conversation.title} ${lastMessage?.text ?? ''}`
        .toLocaleLowerCase('fr')
        .includes(normalizedQuery);
    });
  }, [conversations, filter, query, user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.heading}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.eyebrow, { color: colors.primary }]}>MESSAGERIE</Text>
            </View>
            <Text selectable style={[styles.title, { color: colors.text }]}>
              {translateLabel('Messages')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {filteredConversations.length} conversation(s)
            </Text>
          </View>
          <View style={styles.actions}>
            <IconButton
              accessibilityLabel="Rechercher dans les messages"
              iosName="magnifyingglass"
              fallback="⌕"
              active={showSearch}
              onPress={() => setShowSearch((value) => !value)}
            />
            <IconButton
              accessibilityLabel="Afficher les archives"
              iosName="archivebox"
              fallback="□"
              active={filter === 'archived'}
              onPress={() => setFilter((value) => value === 'archived' ? 'all' : 'archived')}
            />
            <IconButton
              accessibilityLabel="Filtrer les messages"
              iosName="line.3.horizontal.decrease"
              fallback="≡"
              active={filter !== 'all' || showFilters}
              onPress={() => setShowFilters(true)}
            />
          </View>
        </View>

        {showSearch ? (
          <View style={[styles.search, { backgroundColor: colors.inputBg }]}>
            <Text style={{ color: colors.textFaint, fontSize: 18 }}>⌕</Text>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une conversation"
              placeholderTextColor={colors.textFaint}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        ) : null}
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ConversationCard conversation={item} currentUserId={user?.id} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ color: colors.primary, fontSize: 28 }}>M</Text>
              </View>
              <Text selectable style={[styles.emptyTitle, { color: colors.text }]}>
                Aucune conversation
              </Text>
              <Text selectable style={[styles.emptyText, { color: colors.textMuted }]}>
                Aucun message ne correspond à ce filtre.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="fade"
        transparent
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilters(false)}>
          <View
            style={[
              styles.filterMenu,
              shadows.float,
              { backgroundColor: colors.surface },
            ]}>
            <Text style={[styles.filterTitle, { color: colors.textMuted }]}>AFFICHER</Text>
            {(Object.keys(FILTER_LABELS) as MessageFilter[]).map((value) => (
              <Pressable
                key={value}
                onPress={() => {
                  setFilter(value);
                  setShowFilters(false);
                }}
                style={[
                  styles.filterOption,
                  filter === value && { backgroundColor: colors.primaryLight },
                ]}>
                <Text style={[styles.filterLabel, { color: filter === value ? colors.primary : colors.text }]}>
                  {FILTER_LABELS[value]}
                </Text>
                {filter === value ? <Text style={{ color: colors.primary }}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heading: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, paddingTop: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  search: { height: 46, borderRadius: radii.md, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing['2xl'], gap: spacing.sm },
  card: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, borderCurve: 'continuous', padding: spacing.md, gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  lastMessage: { fontSize: 13 },
  date: { alignSelf: 'flex-start', fontSize: 11, fontVariant: ['tabular-nums'] },
  empty: { paddingTop: 72, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.18)', alignItems: 'flex-end', paddingTop: 126, paddingRight: spacing.lg },
  filterMenu: { width: 210, borderRadius: radii.lg, borderCurve: 'continuous', padding: spacing.sm },
  filterTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.3, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterOption: { minHeight: 44, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  filterLabel: { fontSize: 14, fontWeight: '700' },
});
