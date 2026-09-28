import type { RealtimeChannel } from '@supabase/supabase-js';

import { subscribeToNotifications } from '@moxt/shared/services/notificationsService.js';

import { notificationUpserted, type NotificationItem } from '@/store/notifications';
import {
  mapConversationRow,
  receiveMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
  type Message,
} from '@/store/messages';
import { supabase } from './supabase';

type Dispatch = (action: any) => void;
type GetState = () => { messages: { conversations: { id: string }[] } };

let channels: RealtimeChannel[] = [];
let notificationsUnsubscribe: (() => void) | null = null;

function mapMessageRow(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name || ''),
    text: String(row.text || ''),
    createdAt: String(row.created_at),
  };
}

function mapConversationPayload(row: Record<string, unknown>) {
  return mapConversationRow(row);
}

async function ensureConversation(
  conversationId: string,
  dispatch: Dispatch,
  getState: GetState,
) {
  const exists = getState().messages.conversations.some((item) => item.id === conversationId);
  if (exists || !supabase) return;

  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  if (data) {
    dispatch(receiveRemoteConversation(mapConversationPayload(data)));
  }
}

async function ingestRemoteMessage(
  conversationId: string,
  row: Record<string, unknown>,
  userId: string,
  dispatch: Dispatch,
  getState: GetState,
) {
  await ensureConversation(conversationId, dispatch, getState);
  const message = mapMessageRow(row);
  if (message.senderId === userId) {
    dispatch(receiveMessage({ conversationId, message }));
    return;
  }

  // Comme le web : pas de notification locale pour un message (la messagerie a son propre badge).
  dispatch(receiveMessage({ conversationId, message }));
}

export function subscribeRealtime(userId: string, dispatch: Dispatch, getState: GetState) {
  unsubscribeRealtime();
  if (!supabase) return;

  // Notifications serveur (INSERT / UPDATE filtrés sur user_id), comme realtimeService web.
  // Les notifications locales inventées (transferts, colis, annonces) sont supprimées :
  // le serveur crée déjà les vraies lignes `notifications`.
  notificationsUnsubscribe = subscribeToNotifications(
    supabase,
    userId,
    (item: NotificationItem) => dispatch(notificationUpserted(item)),
    { channelName: `mobile-notifications-${userId}` },
  );

  const messagesChannel = supabase
    .channel(`mobile-messages-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const conversationId = String(row.conversation_id || '');
        if (!conversationId) return;
        ingestRemoteMessage(conversationId, row, userId, dispatch, getState);
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      (payload) => {
        const conversation = mapConversationPayload(payload.new as Record<string, unknown>);
        if (!conversation.participantIds.includes(userId)) return;
        dispatch(receiveRemoteConversation(conversation));
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations' },
      (payload) => {
        const conversation = mapConversationPayload(payload.new as Record<string, unknown>);
        if (!conversation.participantIds.includes(userId)) return;
        dispatch(syncRemoteConversation(conversation));
      },
    )
    .subscribe();

  channels = [messagesChannel];
}

export function unsubscribeRealtime() {
  channels.forEach((ch) => {
    try {
      supabase?.removeChannel(ch);
    } catch {}
  });
  channels = [];
  notificationsUnsubscribe?.();
  notificationsUnsubscribe = null;
}
