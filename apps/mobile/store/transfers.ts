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
  },
});

export const transfersReducer = transfersSlice.reducer;
export const setTransfers = transfersSlice.actions.setAll;
