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

function createFavoriteId() {
  const suffix =
    (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `FAV-${suffix.toUpperCase()}`;
}

type ToggleFavoriteArgs = {
  userId: string;
  id: string;
  type: FavoriteType;
  title: string;
  subtitle?: string;
  path?: string;
};

/**
 * Cœur comme le web (supabaseMiddleware `account/toggleAccountFavorite`) :
 * bascule optimiste, puis upsert / delete dans la table `favorites` pour l'utilisateur connecté.
 */
export const toggleFavorite = createAsyncThunk(
  'favorites/toggle',
  async (args: ToggleFavoriteArgs, { getState, dispatch }) => {
    const state = getState() as { favorites: FavoritesState };
    const existing = state.favorites.items.find((f) => f.id === args.id && f.type === args.type);
    if (existing) {
      dispatch(favoritesSlice.actions.removeFavorite({ id: args.id, type: args.type }));
    } else {
      dispatch(
        favoritesSlice.actions.addFavorite({
          id: args.id,
          type: args.type,
          title: args.title,
          subtitle: args.subtitle,
          path: args.path,
          favoriteId: createFavoriteId(),
        }),
      );
    }
    if (!supabase) return;
    let {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id !== args.userId) {
      ({
        data: { session },
      } = await supabase.auth.refreshSession());
    }
    if (session?.user?.id !== args.userId) return;
    const after = (getState() as { favorites: FavoritesState }).favorites.items.find(
      (f) => f.id === args.id && f.type === args.type,
    );
    if (after) {
      const { error } = await supabase.from('favorites').upsert(
        {
          id: after.favoriteId || createFavoriteId(),
          user_id: args.userId,
          related_type: args.type,
          related_id: args.id,
          title: args.title,
          path: args.path,
          created_at: after.addedAt,
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', args.userId)
        .eq('related_type', args.type)
        .eq('related_id', args.id);
      if (error) throw error;
    }
  },
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Bascule locale (optimiste) ; `toggleFavorite` écrit ensuite en base comme le web.
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
