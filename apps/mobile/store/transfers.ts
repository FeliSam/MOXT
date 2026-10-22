import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TransferItem = {
  id: string;
  userId?: string;
  status?: string;
  direction?: string;
  amountSent?: number;
  receivedAmount?: number;
  currencyFrom?: string;
  currencyTo?: string;
  createdAt?: string;
  recipient?: { firstName?: string; lastName?: string };
  exchanger?: { name?: string };
  rate?: number;
  fee?: number;
  rateSource?: string;
};

type TransfersState = { items: TransferItem[] };

const transfersSlice = createSlice({
  name: 'transfers',
  initialState: { items: [] } as TransfersState,
  reducers: {
    setAll(state, action: PayloadAction<TransfersState>) {
      state.items = action.payload.items;
    },
    upsert(state, action: PayloadAction<TransferItem>) {
      const next = action.payload;
      const index = state.items.findIndex((item) => item.id === next.id);
      if (index >= 0) state.items[index] = { ...state.items[index], ...next };
      else state.items.unshift(next);
    },
  },
});

export const transfersReducer = transfersSlice.reducer;
export const setTransfers = transfersSlice.actions.setAll;
export const upsertTransfer = transfersSlice.actions.upsert;

/** id de ligne, référence affichée (MXT-…) ou id copié dans le payload. */
export function transferMatches(item: { id?: string; reference?: string; payload?: { id?: string; reference?: string } | null }, rawId: string) {
  const wanted = rawId.trim().toLowerCase();
  if (!wanted) return false;
  const payload = item.payload;
  return [item.id, item.reference, payload?.id, payload?.reference].some(
    (value) => String(value || '').trim().toLowerCase() === wanted,
  );
}
