import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui';
import {
  buildConversationTimeline,
  loadConversationMessages,
  markConversationRead,
  sendMessage,
} from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const conversation = useAppSelector((state) =>
    state.messages.conversations.find((c) => c.id === id),
  );
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !conversation) return;
    if (conversation.messagesLoading) return;
    const loadedCount = conversation.messages.length;
    const expectedCount = conversation.messageCount || 0;
    const needsReload =
      !conversation.messagesLoaded ||
      (expectedCount > 0 && loadedCount < expectedCount);
    if (needsReload) {
      dispatch(loadConversationMessages(id));
    }
  }, [conversation, dispatch, id]);

  useEffect(() => {
    if (!id || !user?.id || !conversation) return;
    if ((conversation.unreadBy?.[user.id] || 0) > 0) {
      dispatch(markConversationRead({ conversationId: id, userId: user.id }));
    }
  }, [conversation, dispatch, id, user?.id]);

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Conversation introuvable
          </Text>
          <Button variant="primary" onPress={() => router.back()}>
            Retour
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = buildConversationTimeline(conversation);

  const handleSend = () => {
    if (!text.trim() || !user) return;
    dispatch(
      sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: text.trim(),
      }),
    );
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {conversation.title}
        </Text>
      </View>


      <FlatList
        ref={listRef}
        data={timeline}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          if (item.kind === 'related') {
            return (
              <Pressable
                style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(item.preview.path as any)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewEyebrow, { color: colors.primary }]}>
                    {(item.preview.type || 'annonce').toUpperCase()}
                  </Text>
                  <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.preview.title}
                  </Text>
                  {item.preview.subtitle ? (
                    <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>
                      {item.preview.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: colors.primary, fontWeight: '800' }}>→</Text>
              </Pressable>
            );
          }

          const message = item.message;
          const isMe = String(message.senderId) === String(user?.id);
          return (
            <View
              style={[
                styles.bubble,
                isMe
                  ? [styles.bubbleMe, { backgroundColor: brand[700] }]
                  : [styles.bubbleThem, { backgroundColor: colors.surface, borderColor: colors.border }],
              ]}>
              {!isMe ? (
                <Text style={[styles.senderName, { color: colors.primary }]}>
                  {message.senderName}
                </Text>
              ) : null}
              <Text style={[styles.bubbleText, { color: isMe ? '#fff' : colors.text }]}>
                {message.text}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textFaint },
                ]}>
                {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={{ color: colors.textFaint }}>Envoyez le premier message !</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.surfaceMuted,
                color: colors.text,
              },
            ]}
            placeholder="Votre message..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            disabled={!text.trim()}
            onPress={handleSend}>
            <Text style={styles.sendBtnText}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  notFoundText: { fontSize: 18, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backArrow: { fontSize: 22, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  previewCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewEyebrow: { ...typography.eyebrow, marginBottom: 4 },
  previewTitle: { fontSize: 15, fontWeight: '800' },
  previewSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  messagesList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: radii.lg, padding: spacing.md, gap: 2 },
  bubbleMe: { alignSelf: 'flex-end' },
  bubbleThem: { alignSelf: 'flex-start', borderWidth: 1 },
  senderName: { ...typography.eyebrow },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: brand[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
