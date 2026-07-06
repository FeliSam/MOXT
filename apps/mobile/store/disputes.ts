import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'closed' | 'escalated';
export type DisputeReason = 'non_received' | 'wrong_amount' | 'fraud' | 'damaged' | 'delay' | 'other';

export type DisputeMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
};

export type Dispute = {
  id: string;
  userId: string;
  relatedType: 'transfer' | 'parcel' | 'listing' | 'payment';
  relatedId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  messages: DisputeMessage[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
};

type DisputesState = {
  items: Dispute[];
  loading: boolean;
};

const initialState: DisputesState = {
  items: [],
  loading: false,
};

export const loadDisputes = createAsyncThunk(
  'disputes/load',
  async (userId: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('disputes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data || []).map((row: any): Dispute => ({
      id: row.id,
      userId: row.user_id,
      relatedType: row.related_type,
      relatedId: row.related_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      messages: row.messages || [],
      resolution: row.resolution,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },
);

export const createDispute = createAsyncThunk(
  'disputes/create',
  async (params: {
    userId: string;
    relatedType: Dispute['relatedType'];
    relatedId: string;
    reason: DisputeReason;
    description: string;
  }) => {
    const id = `DSP-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const dispute: Dispute = {
      id,
      userId: params.userId,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      reason: params.reason,
      description: params.description,
      status: 'open',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    if (supabase) {
      const { error } = await supabase.from('disputes').insert({
        id,
        user_id: params.userId,
        related_type: params.relatedType,
        related_id: params.relatedId,
        reason: params.reason,
        description: params.description,
        status: 'open',
        messages: [],
        created_at: now,
        updated_at: now,
      });
      if (error) throw new Error(error.message);
    }
    return dispute;
  },
);

export const addDisputeMessage = createAsyncThunk(
  'disputes/addMessage',
  async (params: {
    disputeId: string;
    senderId: string;
    senderName: string;
    text: string;
  }) => {
    const msg: DisputeMessage = {
      id: `DM-${Date.now().toString(36).toUpperCase()}`,
      senderId: params.senderId,
      senderName: params.senderName,
      text: params.text,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    if (supabase) {
      await supabase.rpc('append_dispute_message', {
        dispute_id: params.disputeId,
        msg,
      });
    }
    return { disputeId: params.disputeId, message: msg };
  },
);

const disputesSlice = createSlice({
  name: 'disputes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDisputes.pending, (state) => { state.loading = true; })
      .addCase(loadDisputes.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadDisputes.rejected, (state) => { state.loading = false; })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(addDisputeMessage.fulfilled, (state, action) => {
        const dispute = state.items.find((d) => d.id === action.payload.disputeId);
        if (dispute) {
          dispute.messages.push(action.payload.message);
          dispute.updatedAt = action.payload.message.createdAt;
        }
      });
  },
});

export const disputesReducer = disputesSlice.reducer;
