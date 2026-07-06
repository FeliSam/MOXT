import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  label: string;
  createdAt: string;
};

export type WalletBalance = {
  currency: string;
  amount: number;
};

type WalletState = {
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  loading: boolean;
};

const initialState: WalletState = {
  balances: [
    { currency: 'XOF', amount: 0 },
    { currency: 'RUB', amount: 0 },
    { currency: 'EUR', amount: 0 },
  ],
  transactions: [],
  loading: false,
};

export const loadWallet = createAsyncThunk(
  'wallet/load',
  async (userId: string) => {
    if (!supabase) return { balances: initialState.balances, transactions: [] };
    const [balRes, txRes] = await Promise.all([
      supabase.from('wallet_balances').select('*').eq('user_id', userId),
      supabase.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);
    const balances: WalletBalance[] = (balRes.data || []).map((b: any) => ({
      currency: b.currency,
      amount: b.amount || 0,
    }));
    if (balances.length === 0) {
      balances.push(
        { currency: 'XOF', amount: 0 },
        { currency: 'RUB', amount: 0 },
        { currency: 'EUR', amount: 0 },
      );
    }
    const transactions: WalletTransaction[] = (txRes.data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      label: t.label || t.description || 'Transaction',
      createdAt: t.created_at,
    }));
    return { balances, transactions };
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWallet.pending, (state) => { state.loading = true; })
      .addCase(loadWallet.fulfilled, (state, action) => {
        state.balances = action.payload.balances;
        state.transactions = action.payload.transactions;
        state.loading = false;
      })
      .addCase(loadWallet.rejected, (state) => { state.loading = false; });
  },
});

export const walletReducer = walletSlice.reducer;
