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
  messages: Message[];
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
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || 'Conversation',
      participantIds: row.participant_ids || [],
      relatedType: row.related_type,
      relatedId: row.related_id,
      messages: row.messages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
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
      await supabase.rpc('append_message', {
        conv_id: conversationId,
        msg: message,
      });
    }

    return { conversationId, message };
  },
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    createLocalConversation(state, action: PayloadAction<Conversation>) {
      const exists = state.conversations.some((c) => c.id === action.payload.id);
      if (!exists) state.conversations.unshift(action.payload);
    },
    receiveMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
      if (conv) {
        conv.messages.push(action.payload.message);
        conv.updatedAt = action.payload.message.createdAt;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadConversations.pending, (state) => { state.loading = true; })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.loading = false;
      })
      .addCase(loadConversations.rejected, (state) => { state.loading = false; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (conv) {
          conv.messages.push(action.payload.message);
          conv.updatedAt = action.payload.message.createdAt;
        }
      });
  },
});

export const { createLocalConversation, receiveMessage } = messagesSlice.actions;
export const messagesReducer = messagesSlice.reducer;
