import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type RelatedSnapshot = {
  type: string;
  id: string;
  title: string;
  path: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  badge?: string | null;
  details?: string[];
};

export type RelatedContext = {
  id: string;
  relatedType?: string;
  relatedId?: string;
  relatedPath?: string;
  relatedSnapshot?: RelatedSnapshot | null;
  introducedAt: string;
  introducedBy?: string | null;
};

export type Conversation = {
  id: string;
  title: string;
  participantIds: string[];
  relatedType?: string;
  relatedId?: string;
  relatedPath?: string;
  relatedSnapshot?: RelatedSnapshot | null;
  relatedContexts?: RelatedContext[];
  messages: Message[];
  messagesLoaded?: boolean;
  messagesLoading?: boolean;
  unreadBy?: Record<string, number>;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
};

type MessagesState = {
  conversations: Conversation[];
  loading: boolean;
};

const initialState: MessagesState = {
  conversations: [],
  loading: false,
};

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

function parseRecord(value: unknown): Record<string, number> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const result: Record<string, number> = {};
    for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
      result[key] = Number(count) || 0;
    }
    return result;
  }
  if (typeof value === 'string') {
    try {
      return parseRecord(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return {};
}

function participantKey(participantIds: string[]) {
  return [...new Set(participantIds)].filter(Boolean).sort().join(':');
}

function findByParticipants(conversations: Conversation[], participantIds: string[]) {
  const key = participantKey(participantIds);
  return conversations.find((c) => participantKey(c.participantIds) === key) ?? null;
}

function bumpConversationToTop(state: MessagesState, conversationId: string) {
  const index = state.conversations.findIndex((item) => item.id === conversationId);
  if (index <= 0) return;
  const [conversation] = state.conversations.splice(index, 1);
  state.conversations.unshift(conversation);
}

function normalizeRelatedContexts(conversation: Partial<Conversation>): RelatedContext[] {
  const parsed = Array.isArray(conversation.relatedContexts) ? conversation.relatedContexts : [];
  if (parsed.length) return parsed;
  if (!conversation.relatedSnapshot && !conversation.relatedId) return [];
  return [
    {
      id: `CTX-legacy-${conversation.relatedId || 'unknown'}`,
      relatedType: conversation.relatedType,
      relatedId: conversation.relatedId,
      relatedPath: conversation.relatedPath,
      relatedSnapshot: conversation.relatedSnapshot,
      introducedAt: conversation.createdAt || conversation.updatedAt || new Date().toISOString(),
    },
  ];
}

function mapMessageRow(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name || ''),
    text: String(row.text || ''),
    createdAt: String(row.created_at),
  };
}

function normalizeConversation(conversation: Conversation): Conversation {
  const base = {
    ...conversation,
    participantIds: parseIdList(conversation.participantIds),
    unreadBy: parseRecord(conversation.unreadBy),
    messageCount: Number(conversation.messageCount) || 0,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    messagesLoaded: conversation.messagesLoaded ?? false,
    messagesLoading: conversation.messagesLoading ?? false,
  };
  return {
    ...base,
    relatedContexts: normalizeRelatedContexts(base),
  };
}
function mapConversationRow(row: Record<string, unknown>): Conversation {
  const relatedSnapshot = (row.related_snapshot as Conversation['relatedSnapshot']) || null;
  const relatedContexts = (row.related_contexts as RelatedContext[]) || [];
  const base = {
    id: String(row.id),
    title: String(row.title || 'Conversation'),
    participantIds: parseIdList(row.participant_ids),
    relatedType: row.related_type as string | undefined,
    relatedId: row.related_id as string | undefined,
    relatedPath: row.related_path as string | undefined,
    relatedSnapshot,
    relatedContexts,
    messages: [],
    messagesLoaded: false,
    messagesLoading: false,
    unreadBy: parseRecord(row.unread_by),
    messageCount: Number(row.message_count) || 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
  return normalizeConversation(base);
}

function mergeLoadedConversations(
  existing: Conversation[],
  incoming: Conversation[],
): Conversation[] {
  const byId = new Map(incoming.map((conv) => [conv.id, conv]));
  for (const local of existing) {
    const remote = byId.get(local.id);
    if (!remote) continue;
    byId.set(local.id, {
      ...remote,
      messages: local.messagesLoaded ? local.messages : [],
      messagesLoaded: local.messagesLoaded ?? false,
      messagesLoading: local.messagesLoading ?? false,
      unreadBy: { ...remote.unreadBy, ...local.unreadBy },
      messageCount: Math.max(remote.messageCount || 0, local.messageCount || 0),
    });
  }
  return [...byId.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export type TimelineItem =
  | { kind: 'related'; id: string; at: string; preview: RelatedSnapshot }
  | { kind: 'message'; id: string; at: string; message: Message };

export function buildConversationTimeline(conversation: Conversation): TimelineItem[] {
  const relatedItems = (conversation.relatedContexts || []).flatMap((entry) => {
    if (!entry.relatedSnapshot?.path) return [];
    return [
      {
        kind: 'related' as const,
        id: entry.id,
        at: entry.introducedAt,
        preview: entry.relatedSnapshot,
      },
    ];
  });
  const messageItems = conversation.messages.map((message) => ({
    kind: 'message' as const,
    id: message.id,
    at: message.createdAt,
    message,
  }));
  return [...relatedItems, ...messageItems].sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function selectUnreadMessageCount(
  conversations: Conversation[],
  userId?: string | null,
): number {
  if (!userId) return 0;
  return conversations
    .filter((conversation) => conversation.participantIds.includes(userId))
    .reduce((total, conversation) => total + (conversation.unreadBy?.[userId] || 0), 0);
}

export const loadConversations = createAsyncThunk(
  'messages/loadConversations',
  async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);

    const byKey = new Map<string, Conversation>();
    for (const row of data || []) {
      const conversation = mapConversationRow(row);
      const key = participantKey(conversation.participantIds);
      const existing = byKey.get(key);
      if (!existing || new Date(conversation.updatedAt) > new Date(existing.updatedAt)) {
        byKey.set(key, conversation);
      }
    }
    return [...byKey.values()];
  },
);

export const loadConversationMessages = createAsyncThunk(
  'messages/loadConversationMessages',
  async (conversationId: string) => {
    if (!supabase) return { conversationId, messages: [] as Message[] };
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);

    const messages = (data || []).map((row: Record<string, unknown>) => mapMessageRow(row));
    return { conversationId, messages };
  },
);

export const markConversationRead = createAsyncThunk(
  'messages/markConversationRead',
  async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
    if (!supabase) return { conversationId, userId };
    const { data, error } = await supabase
      .from('conversations')
      .select('unread_by')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const unreadBy = parseRecord(data?.unread_by);
    unreadBy[userId] = 0;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ unread_by: unreadBy })
      .eq('id', conversationId);
    if (updateError) throw new Error(updateError.message);

    return { conversationId, userId, unreadBy };
  },
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (
    {
      conversationId,
      senderId,
      senderName,
      text,
    }: {
      conversationId: string;
      senderId: string;
      senderName: string;
      text: string;
    },
    { getState },
  ) => {
    const state = getState() as { messages: MessagesState };
    const conversation = state.messages.conversations.find((item) => item.id === conversationId);
    const message: Message = {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`,
      senderId,
      senderName,
      text,
      createdAt: new Date().toISOString(),
    };

    const unreadBy = { ...(conversation?.unreadBy || {}) };
    (conversation?.participantIds || [])
      .filter((participantId) => participantId !== senderId)
      .forEach((participantId) => {
        unreadBy[participantId] = (unreadBy[participantId] || 0) + 1;
      });
    const messageCount = (conversation?.messageCount || conversation?.messages.length || 0) + 1;

    if (supabase) {
      await supabase.from('messages').upsert(
        {
          id: message.id,
          conversation_id: conversationId,
          sender_id: senderId,
          sender_name: senderName,
          text: message.text,
          read_by: [senderId],
          created_at: message.createdAt,
        },
        { onConflict: 'id' },
      );
      await supabase
        .from('conversations')
        .update({
          updated_at: message.createdAt,
          unread_by: unreadBy,
          message_count: messageCount,
        })
        .eq('id', conversationId);
    }

    return { conversationId, message, unreadBy, messageCount };
  },
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    createLocalConversation(state, action: PayloadAction<Conversation>) {
      const existing = findByParticipants(state.conversations, action.payload.participantIds);
      if (existing) return;
      state.conversations.unshift(action.payload);
    },
    receiveMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
      if (!conv) return;
      if (conv.messages.some((m) => m.id === action.payload.message.id)) return;
      conv.messages.push(action.payload.message);
      conv.updatedAt = action.payload.message.createdAt;
      conv.messagesLoaded = true;
      conv.messageCount = Math.max(conv.messageCount || 0, conv.messages.length);
      conv.unreadBy ||= {};
      conv.participantIds
        .filter((participantId) => participantId !== action.payload.message.senderId)
        .forEach((participantId) => {
          conv.unreadBy![participantId] = (conv.unreadBy![participantId] || 0) + 1;
        });
      bumpConversationToTop(state, conv.id);
    },
    receiveRemoteConversation(state, action: PayloadAction<Conversation>) {
      const conversation = normalizeConversation(action.payload);
      const duplicate = findByParticipants(state.conversations, conversation.participantIds);
      if (duplicate && duplicate.id !== conversation.id) {
        const index = state.conversations.findIndex((item) => item.id === duplicate.id);
        state.conversations[index] = {
          ...state.conversations[index],
          ...conversation,
          id: duplicate.id,
          messages: state.conversations[index].messages,
          messagesLoaded: state.conversations[index].messagesLoaded,
          messagesLoading: state.conversations[index].messagesLoading,
        };
        bumpConversationToTop(state, duplicate.id);
        return;
      }
      if (!state.conversations.some((item) => item.id === conversation.id)) {
        state.conversations.unshift(conversation);
      }
    },
    syncRemoteConversation(state, action: PayloadAction<Conversation>) {
      const incoming = normalizeConversation(action.payload);
      const index = state.conversations.findIndex((item) => item.id === incoming.id);
      if (index < 0) {
        const duplicate = findByParticipants(state.conversations, incoming.participantIds);
        if (duplicate) {
          const dupIndex = state.conversations.findIndex((item) => item.id === duplicate.id);
          const existing = state.conversations[dupIndex];
          state.conversations[dupIndex] = {
            ...existing,
            ...incoming,
            id: existing.id,
            messages: existing.messages,
            messagesLoaded: existing.messagesLoaded,
            messagesLoading: existing.messagesLoading,
            unreadBy: { ...incoming.unreadBy, ...existing.unreadBy },
          };
          bumpConversationToTop(state, existing.id);
          return;
        }
        state.conversations.unshift(incoming);
        return;
      }
      const existing = state.conversations[index];
      state.conversations[index] = {
        ...existing,
        ...incoming,
        messages: existing.messages,
        messagesLoaded: existing.messagesLoaded,
        messagesLoading: existing.messagesLoading,
        unreadBy: { ...incoming.unreadBy, ...existing.unreadBy },
        messageCount: Math.max(existing.messageCount || 0, incoming.messageCount || 0),
      };
      bumpConversationToTop(state, incoming.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = mergeLoadedConversations(state.conversations, action.payload);
        state.loading = false;
      })
      .addCase(loadConversations.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadConversationMessages.pending, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.meta.arg);
        if (conv) conv.messagesLoading = true;
      })
      .addCase(loadConversationMessages.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (!conv) return;
        conv.messages = action.payload.messages;
        conv.messagesLoaded = true;
        conv.messagesLoading = false;
        conv.messageCount = Math.max(conv.messageCount || 0, action.payload.messages.length);
      })
      .addCase(loadConversationMessages.rejected, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.meta.arg);
        if (conv) {
          conv.messagesLoading = false;
          conv.messagesLoaded = true;
        }
      })
      .addCase(markConversationRead.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (!conv) return;
        conv.unreadBy = { ...(conv.unreadBy || {}), ...(action.payload.unreadBy || {}) };
        conv.unreadBy[action.payload.userId] = 0;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (!conv) return;
        if (!conv.messages.some((m) => m.id === action.payload.message.id)) {
          conv.messages.push(action.payload.message);
        }
        conv.updatedAt = action.payload.message.createdAt;
        conv.messagesLoaded = true;
        conv.unreadBy = action.payload.unreadBy;
        conv.messageCount = action.payload.messageCount;
        bumpConversationToTop(state, conv.id);
      });
  },
});

export const {
  createLocalConversation,
  receiveMessage,
  receiveRemoteConversation,
  syncRemoteConversation,
} = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
