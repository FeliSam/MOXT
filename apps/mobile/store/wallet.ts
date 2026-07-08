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

const DEFAULT_BALANCES: WalletBalance[] = [
  { currency: 'XOF', amount: 0 },
  { currency: 'RUB', amount: 0 },
  { currency: 'EUR', amount: 0 },
];

const initialState: WalletState = {
  balances: DEFAULT_BALANCES,
  transactions: [],
  loading: false,
};

function mapEntry(row: Record<string, unknown>): WalletTransaction {
  const direction = String(row.direction || 'out');
  return {
    id: String(row.id),
    type: direction === 'in' ? 'credit' : 'debit',
    amount: Number(row.amount) || 0,
    currency: String(row.currency || 'RUB'),
    label: String(row.label || 'Mouvement portefeuille'),
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
  };
}

function mapPayment(row: Record<string, unknown>): WalletTransaction {
  const status = String(row.status || 'pending');
  return {
    id: String(row.id),
    type: status === 'completed' ? 'debit' : 'credit',
    amount: Number(row.amount) || 0,
    currency: String(row.currency || 'RUB'),
    label: `Paiement ${status}`,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
  };
}

function buildBalances(entries: WalletTransaction[]): WalletBalance[] {
  const totals = new Map<string, number>();
  for (const currency of ['XOF', 'RUB', 'EUR']) totals.set(currency, 0);
  for (const entry of entries) {
    const delta = entry.type === 'credit' ? entry.amount : -entry.amount;
    totals.set(entry.currency, (totals.get(entry.currency) || 0) + delta);
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
}

export const loadWallet = createAsyncThunk(
  'wallet/load',
  async (userId: string) => {
    if (!supabase) return { balances: DEFAULT_BALANCES, transactions: [] as WalletTransaction[] };

    const [entriesRes, paymentsRes] = await Promise.all([
      supabase
        .from('wallet_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const entryTransactions = (entriesRes.data || []).map((row) => mapEntry(row as Record<string, unknown>));
    const paymentTransactions = (paymentsRes.data || []).map((row) => mapPayment(row as Record<string, unknown>));
    const transactions = [...entryTransactions, ...paymentTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      balances: buildBalances(entryTransactions),
      transactions,
    };
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadWallet.fulfilled, (state, action: PayloadAction<{ balances: WalletBalance[]; transactions: WalletTransaction[] }>) => {
        state.balances = action.payload.balances.length ? action.payload.balances : DEFAULT_BALANCES;
        state.transactions = action.payload.transactions;
        state.loading = false;
      })
      .addCase(loadWallet.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const walletReducer = walletSlice.reducer;
