import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { authReducer } from './auth';
import { badgesReducer } from './badges';
import { disputesReducer } from './disputes';
import { favoritesReducer } from './favorites';
import { marketplaceReducer } from './marketplace';
import { messagesReducer } from './messages';
import { notificationsReducer } from './notifications';
import { organizationsReducer } from './organizations';
import { parcelsReducer } from './parcels';
import { ratingsReducer } from './ratings';
import { referralReducer } from './referral';
import { supportReducer } from './support';
import { transfersReducer } from './transfers';
import { trustScoreReducer } from './trustScore';
import { walletReducer } from './wallet';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transfers: transfersReducer,
    parcels: parcelsReducer,
    marketplace: marketplaceReducer,
    messages: messagesReducer,
    notifications: notificationsReducer,
    badges: badgesReducer,
    ratings: ratingsReducer,
    favorites: favoritesReducer,
    referral: referralReducer,
    wallet: walletReducer,
    trustScore: trustScoreReducer,
    organizations: organizationsReducer,
    disputes: disputesReducer,
    support: supportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
