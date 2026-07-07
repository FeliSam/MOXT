import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  participantIds: string[];
  relatedType?: string;
  relatedId?: string;
  relatedPath?: string;
  relatedSnapshot?: {
    type: string;
    id: string;
    title: string;
    path: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    badge?: string | null;
    details?: string[];
  } | null;
  messages: Message[];
  messagesLoaded?: boolean;
  messagesLoading?: boolean;
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

function participantKey(participantIds: string[]) {
  return [...new Set(participantIds)].filter(Boolean).sort().join(':');
}

function findByParticipants(conversations: Conversation[], participantIds: string[]) {
  const key = participantKey(participantIds);
  return conversations.find((c) => participantKey(c.participantIds) === key) ?? null;
}

function mapConversationRow(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    title: String(row.title || 'Conversation'),
    participantIds: (row.participant_ids as string[]) || [],
    relatedType: row.related_type as string | undefined,
    relatedId: row.related_id as string | undefined,
    relatedPath: row.related_path as string | undefined,
    relatedSnapshot: (row.related_snapshot as Conversation['relatedSnapshot']) || null,
    messages: [],
    messagesLoaded: false,
    messagesLoading: false,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
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

    const messages = (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      senderId: String(row.sender_id),
      senderName: String(row.sender_name || ''),
      text: String(row.text || ''),
      createdAt: String(row.created_at),
    }));
    return { conversationId, messages };
  },
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({
    conversationId,
    senderId,
    senderName,
    text,
  }: {
    conversationId: string;
    senderId: string;
    senderName: string;
    text: string;
  }) => {
    const message: Message = {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`,
      senderId,
      senderName,
      text,
      createdAt: new Date().toISOString(),
    };

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
        .update({ updated_at: message.createdAt })
        .eq('id', conversationId);
    }

    return { conversationId, message };
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
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
      })
      .addCase(loadConversationMessages.rejected, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.meta.arg);
        if (conv) {
          conv.messagesLoading = false;
          conv.messagesLoaded = true;
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (!conv) return;
        if (!conv.messages.some((m) => m.id === action.payload.message.id)) {
          conv.messages.push(action.payload.message);
        }
        conv.updatedAt = action.payload.message.createdAt;
        conv.messagesLoaded = true;
      });
  },
});

export const { createLocalConversation, receiveMessage } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
