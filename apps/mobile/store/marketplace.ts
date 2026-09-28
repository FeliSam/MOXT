import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';
import { fetchActiveListings } from '@moxt/shared/services/publicationsService.js';
import { toggleLikeList } from '@moxt/shared/services/engagementService.js';
import { commentAdded, commentRemoved, likeToggled, type EngagementComment } from './engagementActions';

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
  likes?: string[];
  comments?: EngagementComment[];
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
    // Même fenêtre que le web (500 plus récentes), puis règle partagée isActiveListing.
    const rows = await fetchActiveListings(supabase);
    return rows.map(mapRow);
  },
);

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
    businessId: row.business_id || row.payload?.businessId || undefined,
    sellerName: row.seller_name || row.payload?.sellerName || '',
    contact: row.payload?.contact || '',
    whatsapp: row.payload?.whatsapp || '',
    condition: row.payload?.condition || '',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    // Colonnes likes / comments (miroir dans payload), écrites par les RPC moxt_listing_*.
    likes: asArray(row.likes ?? row.payload?.likes),
    comments: asArray(row.comments ?? row.payload?.comments).filter((c: unknown) => c && typeof c === 'object'),
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
      })
      .addCase(likeToggled, (state, action) => {
        if (action.payload.kind !== 'listing') return;
        const item = state.items.find((l) => l.id === action.payload.entityId);
        if (item) item.likes = toggleLikeList(item.likes, action.payload.userId);
      })
      .addCase(commentAdded, (state, action) => {
        if (action.payload.kind !== 'listing') return;
        const item = state.items.find((l) => l.id === action.payload.entityId);
        if (item) item.comments = [...(item.comments || []), action.payload.comment];
      })
      .addCase(commentRemoved, (state, action) => {
        if (action.payload.kind !== 'listing') return;
        const item = state.items.find((l) => l.id === action.payload.entityId);
        if (item) item.comments = (item.comments || []).filter((c) => c.id !== action.payload.commentId);
      });
  },
});

export const { setListings } = marketplaceSlice.actions;
export const marketplaceReducer = marketplaceSlice.reducer;
