import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { replyToTicket } from '@/store/support';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userName = useAppSelector((s) => {
    const u = s.auth.user;
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });
  const ticket = useAppSelector((s) => s.support.tickets.find((t) => t.id === id));
  const [text, setText] = useState('');

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Ticket introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canReply = ticket.status !== 'closed' && ticket.status !== 'resolved';

  const handleSend = () => {
    if (!text.trim() || !userId || !id) return;
    dispatch(replyToTicket({ ticketId: id, senderId: userId, senderName: userName, text: text.trim() }));
    setText('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>TICKET</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{ticket.subject}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{ticket.category} • {ticket.priority}</Text>
      </View>

      <FlatList
        data={ticket.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.bubble, {
            alignSelf: item.isAgent ? 'flex-start' : 'flex-end',
            backgroundColor: item.isAgent ? colors.primaryLight : colors.primary,
            borderColor: item.isAgent ? colors.primaryBorder : 'transparent',
          }]}>
            {item.isAgent && (
              <Text style={[styles.agentLabel, { color: colors.primary }]}>🎧 Support</Text>
            )}
            <Text style={[styles.bubbleText, { color: item.isAgent ? colors.text : '#fff' }]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, { color: item.isAgent ? colors.textMuted : 'rgba(255,255,255,0.7)' }]}>
              {new Date(item.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
      />

      {canReply && (
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Votre réponse..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
          />
          <Pressable style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  eyebrow: { ...typography.eyebrow },
  title: { ...typography.title, fontSize: 18 },
  meta: { ...typography.caption },
  messages: { padding: spacing.xl, gap: spacing.sm },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
  },
  agentLabel: { fontSize: 11, fontWeight: '700' },
  bubbleText: { ...typography.body, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: spacing.sm },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
