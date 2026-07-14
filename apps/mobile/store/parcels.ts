import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  maxWeightPerItem?: number;
  conditions?: string;
  acceptedTypes?: string[];
  rejectedTypes?: string[];
};

type ParcelsState = { items: ParcelItem[]; requests: any[] };

const parcelsSlice = createSlice({
  name: 'parcels',
  initialState: { items: [], requests: [] } as ParcelsState,
  reducers: {
    setAll(state, action: PayloadAction<Partial<ParcelsState>>) {
      if (action.payload.items) state.items = action.payload.items;
      if (action.payload.requests) state.requests = action.payload.requests;
    },
  },
});

export const parcelsReducer = parcelsSlice.reducer;
export const setParcels = parcelsSlice.actions.setAll;
