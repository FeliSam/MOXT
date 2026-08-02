import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { PageHeader } from '@/components/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { loadConversations, Conversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';
import {
  getMobileConversationPreview,
  getMobileConversationPreviewAt,
} from '@/utils/conversationPreview';

function ConversationCard({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId?: string;
}) {
  const colors = useThemeColors();
  const { t } = useLanguage();
  const preview = getMobileConversationPreview(conversation, currentUserId, {
    youPrefix: t('messages.youPrefix'),
    empty: t('messages.noMessageYet'),
  });
  const previewAt = getMobileConversationPreviewAt(conversation);
  const initials = conversation.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadows.card,
      ]}
      onPress={() => router.push(`/messages/${conversation.id}` as any)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || '💬'}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text style={[styles.lastMsg, { color: colors.textMuted }]} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      <Text style={[styles.cardDate, { color: colors.textFaint }]}>
        {new Date(previewAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        })}
      </Text>
    </Pressable>
  );
}

export default function MessagesListScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const conversations = useAppSelector((state) => state.messages.conversations);
  const loading = useAppSelector((state) => state.messages.loading);

  useEffect(() => {
    if (user?.id) {
      dispatch(loadConversations(user.id));
    }
  }, [dispatch, user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Accueil</Text>
        </Pressable>
      </View>
      <PageHeader
        eyebrow="Messagerie"
        title={t('messages.conversations')}
        description={`${conversations.length} conversation(s)`}
      />

      {loading && conversations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand[700]} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ConversationCard conversation={item} currentUserId={user?.id} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>💬</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('messages.empty.title')}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('messages.empty.description')}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { ...typography.label },
  lastMsg: { ...typography.bodySmall },
  cardDate: { ...typography.eyebrow },
  empty: { paddingVertical: 60, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
    lineHeight: 20,
    ...typography.body,
  },
});
