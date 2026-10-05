import type { RealtimeChannel } from '@supabase/supabase-js';

import { subscribeToNotifications } from '@moxt/shared/services/notificationsService.js';

import { notificationUpserted, type NotificationItem } from '@/store/notifications';
import { scheduleLocalNotification } from './notifications';
import {

  mapConversationRow,
  mapMessageRow,
  patchMessage,
  receiveMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
} from '@/store/messages';
import { supabase } from './supabase';

type Dispatch = (action: any) => void;
type GetState = () => { messages: { conversations: { id: string }[] } };

let channels: RealtimeChannel[] = [];
let notificationsUnsubscribe: (() => void) | null = null;

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

  dispatch(receiveMessage({ conversationId, message }));
  void scheduleLocalNotification(
    message.senderName || 'Nouveau message',
    message.text || (message.attachment ? 'Pièce jointe reçue' : 'Nouveau message'),
    { type: 'message', relatedId: conversationId },
  );
}

export function subscribeRealtime(userId: string, dispatch: Dispatch, getState: GetState) {
  unsubscribeRealtime();
  if (!supabase) return;

  // Notifications serveur (INSERT / UPDATE filtrés sur user_id), comme realtimeService web.
  notificationsUnsubscribe = subscribeToNotifications(
    supabase,
    userId,
    (item: NotificationItem) => {
      dispatch(notificationUpserted(item));
      void scheduleLocalNotification(item.title, item.message, {
        type: item.type,
        relatedId: item.link,
      });
    },
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
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const conversationId = String(row.conversation_id || '');
        if (!conversationId) return;
        const known = getState().messages.conversations.some((item) => item.id === conversationId);
        if (!known) return;
        dispatch(patchMessage({ conversationId, message: mapMessageRow(row) }));
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
