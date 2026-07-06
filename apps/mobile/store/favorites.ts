import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FavoriteItem = {
  id: string;
  type: 'listing' | 'parcel' | 'job';
  title: string;
  subtitle?: string;
  addedAt: string;
};

type FavoritesState = {
  items: FavoriteItem[];
};

const initialState: FavoritesState = {
  items: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
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
});

export const { addFavorite, removeFavorite, clearFavorites } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
