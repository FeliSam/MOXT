import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type Rating = {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  transferId?: string;
  score: number; // 1-5
  comment?: string;
  createdAt: string;
};

type RatingsState = {
  received: Rating[];
  given: Rating[];
  loading: boolean;
  averageScore: number | null;
};

const initialState: RatingsState = {
  received: [],
  given: [],
  loading: false,
  averageScore: null,
};

export const loadRatings = createAsyncThunk(
  'ratings/load',
  async (userId: string) => {
    if (!supabase) return { received: [], given: [] };
    const [receivedRes, givenRes] = await Promise.all([
      supabase.from('ratings').select('*').eq('to_user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('ratings').select('*').eq('from_user_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);
    const mapRow = (r: any): Rating => ({
      id: r.id,
      fromUserId: r.from_user_id,
      fromUserName: r.from_user_name || 'Utilisateur',
      toUserId: r.to_user_id,
      transferId: r.transfer_id,
      score: r.score,
      comment: r.comment,
      createdAt: r.created_at,
    });
    return {
      received: (receivedRes.data || []).map(mapRow),
      given: (givenRes.data || []).map(mapRow),
    };
  },
);

export const submitRating = createAsyncThunk(
  'ratings/submit',
  async (params: {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    transferId?: string;
    score: number;
    comment?: string;
  }) => {
    if (!supabase) throw new Error('Supabase non configuré');
    const rating: Rating = {
      id: `RAT-${Date.now().toString(36).toUpperCase()}`,
      fromUserId: params.fromUserId,
      fromUserName: params.fromUserName,
      toUserId: params.toUserId,
      transferId: params.transferId,
      score: params.score,
      comment: params.comment,
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('ratings').insert({
      id: rating.id,
      from_user_id: rating.fromUserId,
      from_user_name: rating.fromUserName,
      to_user_id: rating.toUserId,
      transfer_id: rating.transferId,
      score: rating.score,
      comment: rating.comment,
      created_at: rating.createdAt,
    });
    if (error) throw new Error(error.message);
    return rating;
  },
);

const ratingsSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRatings.pending, (state) => { state.loading = true; })
      .addCase(loadRatings.fulfilled, (state, action) => {
        state.received = action.payload.received;
        state.given = action.payload.given;
        state.loading = false;
        if (state.received.length > 0) {
          const total = state.received.reduce((sum, r) => sum + r.score, 0);
          state.averageScore = Math.round((total / state.received.length) * 10) / 10;
        } else {
          state.averageScore = null;
        }
      })
      .addCase(loadRatings.rejected, (state) => { state.loading = false; })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.given.unshift(action.payload);
      });
  },
});

export const ratingsReducer = ratingsSlice.reducer;
