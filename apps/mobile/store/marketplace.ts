import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type ListingItem = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  status?: string;
  price?: number;
  currency?: string;
  city?: string;
  country?: string;
  address?: string;
  images?: string[];
  ownerId?: string;
  businessId?: string;
  views?: number;
  sellerName?: string;
  contact?: string;
  whatsapp?: string;
  condition?: string;
  createdAt?: string;
  expiresAt?: string;
};

type MarketplaceState = {
  items: ListingItem[];
  loading: boolean;
  error: string | null;
};

const initialState: MarketplaceState = {
  items: [],
  loading: false,
  error: null,
};

export const loadListings = createAsyncThunk(
  'marketplace/loadListings',
  async () => {
    if (!supabase) throw new Error('Supabase non configuré.');
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data || []).map(mapRow);
  },
);

function mapRow(row: any): ListingItem {
  return {
    id: row.id,
    title: row.title || row.payload?.title || '',
    description: row.description || row.payload?.description || '',
    type: row.type || row.payload?.type || 'product',
    category: row.category || row.payload?.category || '',
    status: row.status,
    price: row.price ?? row.payload?.price,
    currency: row.currency || row.payload?.currency || 'RUB',
    city: row.city || row.payload?.city || '',
    country: row.country || 'RU',
    address: row.address || row.payload?.address || '',
    images: row.images || row.payload?.images || [],
    ownerId: row.owner_id,
    sellerName: row.seller_name || row.payload?.sellerName || '',
    contact: row.payload?.contact || '',
    whatsapp: row.payload?.whatsapp || '',
    condition: row.payload?.condition || '',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setListings(state, action: PayloadAction<ListingItem[]>) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadListings.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erreur chargement marketplace';
      });
  },
});

export const { setListings } = marketplaceSlice.actions;
export const marketplaceReducer = marketplaceSlice.reducer;
