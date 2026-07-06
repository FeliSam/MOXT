import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { addDisputeMessage, DisputeStatus } from '@/store/disputes';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { radii, spacing, typography } from '@/theme/colors';
import { Badge } from '@/components/ui/Badge';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_CONFIG: Record<DisputeStatus, { label: string; tone: Tone }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  in_review: { label: 'En examen', tone: 'info' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Fermé', tone: 'neutral' },
  escalated: { label: 'Escaladé', tone: 'danger' },
};

export default function DisputeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userName = useAppSelector((s) => {
    const u = s.auth.user;
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'Utilisateur';
  });
  const dispute = useAppSelector((s) => s.disputes.items.find((d) => d.id === id));
  const [text, setText] = useState('');

  if (!dispute) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[typography.body, { color: colors.textMuted }]}>Litige introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[dispute.status];
  const canReply = dispute.status === 'open' || dispute.status === 'in_review';

  const handleSend = () => {
    if (!text.trim() || !userId || !id) return;
    dispatch(addDisputeMessage({
      disputeId: id,
      senderId: userId,
      senderName: userName,
      text: text.trim(),
    }));
    setText('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>LITIGE</Text>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Litige #{id?.slice(-6)}</Text>
          <Badge tone={cfg.tone}>{cfg.label}</Badge>
        </View>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {dispute.description}
        </Text>
      </View>

      <FlatList
        data={dispute.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.bubble, {
            alignSelf: item.senderId === userId ? 'flex-end' : 'flex-start',
            backgroundColor: item.isAdmin ? colors.primaryLight : (item.senderId === userId ? colors.primary : colors.surface),
            borderColor: item.isAdmin ? colors.primaryBorder : colors.border,
          }]}>
            {item.senderId !== userId && (
              <Text style={[styles.bubbleSender, { color: item.isAdmin ? colors.primary : colors.textSecondary }]}>
                {item.isAdmin ? '🛡️ Support' : item.senderName}
              </Text>
            )}
            <Text style={[styles.bubbleText, { color: item.senderId === userId ? '#fff' : colors.text }]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, { color: item.senderId === userId ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
              {new Date(item.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyMsg}>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Pas encore de messages. Envoyez des détails ci-dessous.
            </Text>
          </View>
        }
      />

      {canReply && (
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Votre message..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
          />
          <Pressable style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      )}

      {dispute.resolution && (
        <View style={[styles.resolutionBar, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
          <Text style={[styles.resolutionText, { color: colors.success }]}>
            Résolution : {dispute.resolution}
          </Text>
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
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  eyebrow: { ...typography.eyebrow },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.title, fontSize: 20 },
  desc: { ...typography.bodySmall },
  messages: { padding: spacing.xl, gap: spacing.sm },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
  },
  bubbleSender: { fontSize: 11, fontWeight: '700' },
  bubbleText: { ...typography.body, lineHeight: 20 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  emptyMsg: { paddingVertical: spacing['3xl'], alignItems: 'center' },
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
  resolutionBar: {
    margin: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  resolutionText: { ...typography.label },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
