import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { accountReducer } from './account';
import { authReducer } from './auth';
import { badgesReducer } from './badges';
import { disputesReducer } from './disputes';
import { favoritesReducer } from './favorites';
import { feedReducer } from './feed';
import { marketplaceReducer } from './marketplace';
import { messagesReducer } from './messages';
import { notificationsReducer } from './notifications';
import { parcelsReducer } from './parcels';
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
    favorites: favoritesReducer,
    feed: feedReducer,
    referral: referralReducer,
    wallet: walletReducer,
    trustScore: trustScoreReducer,
    account: accountReducer,
    disputes: disputesReducer,
    support: supportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
