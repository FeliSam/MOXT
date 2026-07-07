import type { RealtimeChannel } from '@supabase/supabase-js';

import { addNotification } from '@/store/notifications';
import {
  receiveMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
  type Message,
} from '@/store/messages';
import { supabase } from './supabase';

type Dispatch = (action: any) => void;
type GetState = () => { messages: { conversations: { id: string }[] } };

let channels: RealtimeChannel[] = [];

function mapMessageRow(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name || ''),
    text: String(row.text || ''),
    createdAt: String(row.created_at),
  };
}

function parseIdList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : value ? [value] : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function mapConversationPayload(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title || 'Conversation'),
    participantIds: parseIdList(row.participant_ids),
    relatedType: row.related_type as string | undefined,
    relatedId: row.related_id as string | undefined,
    relatedPath: row.related_path as string | undefined,
    relatedSnapshot: (row.related_snapshot as any) || null,
    relatedContexts: (row.related_contexts as any[]) || [],
    messages: [],
    messagesLoaded: false,
    messagesLoading: false,
    unreadBy: (row.unread_by as Record<string, number>) || {},
    messageCount: Number(row.message_count) || 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
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
  dispatch(
    addNotification({
      title: 'Nouveau message',
      body: `${message.senderName}: ${message.text.slice(0, 60)}`,
      type: 'message',
      relatedId: conversationId,
    }),
  );
}

export function subscribeRealtime(userId: string, dispatch: Dispatch, getState: GetState) {
  unsubscribeRealtime();
  if (!supabase) return;

  const transfersChannel = supabase
    .channel(`mobile-transfers-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transfers', filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Record<string, any> | undefined;
        dispatch(
          addNotification({
            title: 'Transfert mis à jour',
            body: `Le transfert ${row?.id || ''} a changé de statut.`,
            type: 'transfer',
            relatedId: row?.id,
          }),
        );
      },
    )
    .subscribe();

  const parcelsChannel = supabase
    .channel(`mobile-parcels-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'parcels', filter: `owner_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Record<string, any> | undefined;
        dispatch(
          addNotification({
            title: 'Colis mis à jour',
            body: `Votre colis ${row?.id || ''} a été modifié.`,
            type: 'parcel',
            relatedId: row?.id,
          }),
        );
      },
    )
    .subscribe();

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

  const listingsChannel = supabase
    .channel(`mobile-listings-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'listings' },
      () => {
        dispatch(
          addNotification({
            title: 'Nouvelle annonce',
            body: "Une nouvelle annonce vient d'être publiée.",
            type: 'marketplace',
          }),
        );
      },
    )
    .subscribe();

  channels = [transfersChannel, parcelsChannel, messagesChannel, listingsChannel];
}

export function unsubscribeRealtime() {
  channels.forEach((ch) => {
    try {
      supabase?.removeChannel(ch);
    } catch {}
  });
  channels = [];
}
