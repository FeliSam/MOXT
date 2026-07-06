import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type Referral = {
  id: string;
  referredUserId: string;
  referredUserName: string;
  status: 'pending' | 'confirmed' | 'rewarded';
  rewardAmount?: number;
  createdAt: string;
};

type ReferralState = {
  code: string | null;
  referrals: Referral[];
  totalRewards: number;
  loading: boolean;
};

const initialState: ReferralState = {
  code: null,
  referrals: [],
  totalRewards: 0,
  loading: false,
};

export const loadReferralData = createAsyncThunk(
  'referral/load',
  async (userId: string) => {
    if (!supabase) return { code: null, referrals: [] };
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    return {
      code: profile?.referral_code || `MOXT-${userId.slice(0, 6).toUpperCase()}`,
      referrals: (refs || []).map((r: any): Referral => ({
        id: r.id,
        referredUserId: r.referred_user_id,
        referredUserName: r.referred_user_name || 'Utilisateur',
        status: r.status,
        rewardAmount: r.reward_amount,
        createdAt: r.created_at,
      })),
    };
  },
);

export const applyReferralCode = createAsyncThunk(
  'referral/apply',
  async ({ userId, code }: { userId: string; code: string }) => {
    if (!supabase) throw new Error('Supabase non configuré');
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code.toUpperCase().trim())
      .single();
    if (!referrer) throw new Error('Code de parrainage invalide');
    if (referrer.id === userId) throw new Error('Vous ne pouvez pas utiliser votre propre code');
    const { error } = await supabase.from('referrals').insert({
      id: `REF-${Date.now().toString(36).toUpperCase()}`,
      referrer_id: referrer.id,
      referred_user_id: userId,
      status: 'confirmed',
      reward_amount: 500,
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  },
);

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadReferralData.pending, (state) => { state.loading = true; })
      .addCase(loadReferralData.fulfilled, (state, action) => {
        state.code = action.payload.code;
        state.referrals = action.payload.referrals;
        state.totalRewards = action.payload.referrals
          .filter((r) => r.status === 'rewarded')
          .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
        state.loading = false;
      })
      .addCase(loadReferralData.rejected, (state) => { state.loading = false; });
  },
});

export const referralReducer = referralSlice.reducer;
