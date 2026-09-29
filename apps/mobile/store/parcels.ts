import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fromRow } from '@moxt/shared/utils/remoteRowMapper.js';

import { supabase } from '@/services/supabase';
import { asStringList } from '@/utils/stringList';

export type ParcelItem = {
  id: string;
  ownerId?: string;
  businessId?: string;
  ownerName?: string;
  origin?: string;
  destination?: string;
  fromCountry?: string;
  toCountry?: string;
  originCountry?: string;
  destinationCountry?: string;
  status?: string;
  departureDate?: string;
  depositDeadline?: string;
  distributionDate?: string;
  capacityKg?: number;
  remainingKg?: number;
  pricePerKg?: number;
  currency?: string;
  maxWeightPerItem?: number;
  conditions?: string;
  acceptedTypes?: string[];
  rejectedTypes?: string[];
};

type ParcelsState = { items: ParcelItem[]; requests: any[] };

function withTypeLists(item: ParcelItem): ParcelItem {
  return {
    ...item,
    acceptedTypes: asStringList(item.acceptedTypes),
    rejectedTypes: asStringList(item.rejectedTypes),
  };
}

/** Fiche absente du catalogue (lien direct /parcel/:id, y compris invité). */
export const loadParcelById = createAsyncThunk('parcels/loadParcelById', async (id: string) => {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('parcels').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? withTypeLists(fromRow(data) as ParcelItem) : null;
});

const parcelsSlice = createSlice({
  name: 'parcels',
  initialState: { items: [], requests: [] } as ParcelsState,
  reducers: {
    setAll(state, action: PayloadAction<Partial<ParcelsState>>) {
      if (action.payload.items) {
        state.items = action.payload.items.map((item) => ({
          ...item,
          acceptedTypes: asStringList(item.acceptedTypes),
          rejectedTypes: asStringList(item.rejectedTypes),
        }));
      }
      if (action.payload.requests) state.requests = action.payload.requests;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadParcelById.fulfilled, (state, action) => {
      const parcel = action.payload;
      if (!parcel) return;
      const index = state.items.findIndex((item) => item.id === parcel.id);
      if (index >= 0) state.items[index] = { ...state.items[index], ...parcel };
      else state.items.unshift(parcel);
    });
  },
});

export const parcelsReducer = parcelsSlice.reducer;
export const setParcels = parcelsSlice.actions.setAll;
