import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { fetchUserFavorites } from '@moxt/shared/services/favoritesService.js';
import { supabase } from '../services/supabase';

export type FavoriteType = 'listing' | 'parcel' | 'job' | 'event' | 'business';

/** `id` = identifiant de l’élément favori (related_id), comme les boutons cœur des écrans. */
export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle?: string;
  addedAt: string;
  favoriteId?: string;
  path?: string;
  legacy?: boolean;
};

type FavoritesState = {
  items: FavoriteItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const initialState: FavoritesState = {
  items: [],
  status: 'idle',
};

type SharedFavorite = {
  id: string;
  relatedId: string;
  relatedType: FavoriteType;
  title?: string;
  path?: string;
  legacy?: boolean;
  createdAt?: string;
  entity?: { city?: string; location?: string; company?: string } | null;
};

/**
 * Favoris du compte comme le web (table `favorites` + favoris « legacy » des annonces),
 * sans les éléments supprimés ou plus en ligne (isSourceItemLive).
 */
export const loadFavorites = createAsyncThunk(
  'favorites/load',
  async (userId: string): Promise<FavoriteItem[]> => {
    if (!supabase) return [];
    const rows = (await fetchUserFavorites(supabase, userId)) as SharedFavorite[];
    return rows.map((row) => ({
      id: String(row.relatedId),
      type: row.relatedType,
      title: row.title || '',
      subtitle: row.entity?.city || row.entity?.location || row.entity?.company || undefined,
      addedAt: row.createdAt || '',
      favoriteId: row.id,
      path: row.path,
      legacy: row.legacy,
    }));
  },
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Bascule locale (optimiste). La persistance serveur des favoris depuis le mobile = phase 3.
    addFavorite(state, action: PayloadAction<Omit<FavoriteItem, 'addedAt'>>) {
      const exists = state.items.some(
        (f) => f.id === action.payload.id && f.type === action.payload.type,
      );
      if (!exists) {
        state.items.unshift({ ...action.payload, addedAt: new Date().toISOString() });
      }
    },
    removeFavorite(state, action: PayloadAction<{ id: string; type: string }>) {
      state.items = state.items.filter(
        (f) => !(f.id === action.payload.id && f.type === action.payload.type),
      );
    },
    clearFavorites(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'ready';
      })
      .addCase(loadFavorites.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export const { addFavorite, removeFavorite, clearFavorites } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
