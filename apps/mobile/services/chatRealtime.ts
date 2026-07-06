import type { RealtimeChannel } from '@supabase/supabase-js';

import { receiveMessage } from '@/store/messages';
import { supabase } from './supabase';

type Dispatch = (action: any) => void;

let presenceChannel: RealtimeChannel | null = null;
let typingChannel: RealtimeChannel | null = null;

export type PresenceState = {
  [userId: string]: {
    online: boolean;
    lastSeen: string;
  };
};

export type TypingState = {
  [conversationId: string]: string[]; // userIds currently typing
};

let onPresenceChange: ((state: PresenceState) => void) | null = null;
let onTypingChange: ((state: TypingState) => void) | null = null;

export function setPresenceListener(cb: (state: PresenceState) => void) {
  onPresenceChange = cb;
}

export function setTypingListener(cb: (state: TypingState) => void) {
  onTypingChange = cb;
}

export function subscribePresence(userId: string) {
  if (!supabase) return;
  unsubscribePresence();

  presenceChannel = supabase.channel('online-users', {
    config: { presence: { key: userId } },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel!.presenceState();
      const presenceMap: PresenceState = {};
      Object.entries(state).forEach(([key, entries]) => {
        const latest = (entries as any[])[0];
        presenceMap[key] = {
          online: true,
          lastSeen: latest?.lastSeen || new Date().toISOString(),
        };
      });
      onPresenceChange?.(presenceMap);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel!.track({
          userId,
          lastSeen: new Date().toISOString(),
        });
      }
    });
}

export function unsubscribePresence() {
  if (presenceChannel && supabase) {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
}

export function subscribeTyping(conversationId: string, myUserId: string) {
  if (!supabase) return;
  unsubscribeTyping();

  typingChannel = supabase.channel(`typing-${conversationId}`, {
    config: { presence: { key: myUserId } },
  });

  typingChannel
    .on('presence', { event: 'sync' }, () => {
      const state = typingChannel!.presenceState();
      const typingUserIds = Object.keys(state).filter((k) => k !== myUserId);
      onTypingChange?.({ [conversationId]: typingUserIds });
    })
    .subscribe();
}

export function unsubscribeTyping() {
  if (typingChannel && supabase) {
    supabase.removeChannel(typingChannel);
    typingChannel = null;
  }
}

export async function sendTypingIndicator(conversationId: string, userId: string) {
  if (!typingChannel) return;
  await typingChannel.track({ userId, typing: true, at: new Date().toISOString() });
}

export async function clearTypingIndicator() {
  if (!typingChannel) return;
  await typingChannel.untrack();
}

export async function markMessagesRead(conversationId: string, userId: string) {
  if (!supabase) return;
  await supabase.from('read_receipts').upsert(
    { conversation_id: conversationId, user_id: userId, read_at: new Date().toISOString() },
    { onConflict: 'conversation_id,user_id' },
  );
}

export async function getReadReceipts(conversationId: string): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase
    .from('read_receipts')
    .select('user_id, read_at')
    .eq('conversation_id', conversationId);
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => { map[row.user_id] = row.read_at; });
  return map;
}
