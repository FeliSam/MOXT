import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  fetchBusinessById,
  fetchBusinesses,
  fetchBusinessesByIds,
} from '@moxt/shared/services/businessesService.js';
import { fetchProfileReviews, fetchVerificationStatus } from '@moxt/shared/services/accountService.js';
import {
  fetchPublisherSubscriptions,
  selectUserSubscriptionList,
} from '@moxt/shared/services/subscriptionsService.js';
import { supabase } from '../services/supabase';

/** Entreprise (table `businesses`, même mapping que le web, payload fusionné). */
export type Business = {
  id: string;
  ownerId: string;
  name: string;
  status?: string;
  description?: string;
  city?: string;
  country?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryActivity?: string;
  secondaryActivity?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  verified?: boolean;
  createdAt?: string;
  deletedByUserAt?: string | null;
  [key: string]: unknown;
};

/** Abonnement (table `publisher_subscriptions`). */
export type PublisherSubscription = {
  id: string;
  userId: string;
  subscriberId: string;
  publisherType: 'user' | 'business';
  publisherId: string;
  publisherName?: string;
  publisherPath?: string;
  notifyPref?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Review = {
  id: string;
  authorId: string;
  authorName?: string;
  rating: number;
  comment?: string;
  status?: string;
  targetType?: string;
  targetId?: string;
  createdAt?: string;
  replyText?: string | null;
};

type AccountState = {
  businesses: Business[];
  businessById: Record<string, Business>;
  subscriptions: PublisherSubscription[];
  reviewsReceived: Review[];
  reviewsAuthored: Review[];
  reviewsAverage: number | null;
  verification: {
    status: string | null;
    verified: boolean;
    level: string | null;
    requestedAt: string | null;
    reviewNote?: string | null;
    documentCount?: number;
  };
  loading: Record<string, boolean>;
};

const initialState: AccountState = {
  businesses: [],
  businessById: {},
  subscriptions: [],
  reviewsReceived: [],
  reviewsAuthored: [],
  reviewsAverage: null,
  verification: { status: null, verified: false, level: null, requestedAt: null },
  loading: {},
};

export const loadBusinesses = createAsyncThunk('account/loadBusinesses', async (userId: string) => {
  const { isE2eHarnessActive, readE2eFixtures } = await import('@/utils/e2eHarness');
  if (isE2eHarnessActive()) {
    const fixtures = readE2eFixtures();
    if (Array.isArray(fixtures?.businesses) && fixtures.businesses.length) {
      return fixtures.businesses as Business[];
    }
  }
  if (!supabase) return [] as Business[];
  return (await fetchBusinesses(supabase, userId)) as Business[];
});

export const loadBusiness = createAsyncThunk('account/loadBusiness', async (businessId: string) => {
  if (!supabase) return null;
  return (await fetchBusinessById(supabase, businessId)) as Business | null;
});

export const loadBusinessesByIds = createAsyncThunk(
  'account/loadBusinessesByIds',
  async (ids: string[]) => {
    if (!supabase || !ids.length) return [] as Business[];
    return (await fetchBusinessesByIds(supabase, ids)) as Business[];
  },
);

export const loadSubscriptions = createAsyncThunk('account/loadSubscriptions', async () => {
  if (!supabase) return [] as PublisherSubscription[];
  return (await fetchPublisherSubscriptions(supabase)) as PublisherSubscription[];
});

export const loadReviews = createAsyncThunk('account/loadReviews', async (userId: string) => {
  if (!supabase) return { received: [], authored: [], average: null };
  return (await fetchProfileReviews(supabase, userId)) as {
    received: Review[];
    authored: Review[];
    average: number | null;
  };
});

export const loadVerification = createAsyncThunk(
  'account/loadVerification',
  async (userId: string) => {
    if (!supabase) return null;
    const result = (await fetchVerificationStatus(supabase, userId)) as {
      latest: { status?: string; level?: string; createdAt?: string; reviewNote?: string; documentIds?: unknown[] } | null;
      verified: boolean;
    };
    return {
      status: result.latest?.status ?? null,
      level: result.latest?.level ?? null,
      requestedAt: result.latest?.createdAt ?? null,
      reviewNote: result.latest?.reviewNote ?? null,
      documentCount: Array.isArray(result.latest?.documentIds) ? result.latest.documentIds.length : 0,
      verified: result.verified,
    };
  },
);

function indexBusinesses(state: AccountState, items: Business[]) {
  for (const item of items) {
    if (item?.id) state.businessById[item.id] = { ...state.businessById[item.id], ...item };
  }
}

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    /** Ajout / mise à jour optimiste d'un abonnement (web accountSlice.upsertPublisherSubscription). */
    subscriptionUpserted(state, action: PayloadAction<PublisherSubscription>) {
      const sub = action.payload;
      const index = state.subscriptions.findIndex(
        (item) => item.userId === sub.userId && item.publisherType === sub.publisherType && item.publisherId === sub.publisherId,
      );
      if (index >= 0) state.subscriptions[index] = sub;
      else state.subscriptions.unshift(sub);
    },
    publicBusinessesReceived(state, action: PayloadAction<Business[]>) {
      state.businesses = action.payload;
      indexBusinesses(state, action.payload);
    },
    subscriptionRemoved(state, action: PayloadAction<{ userId: string; publisherType: string; publisherId: string }>) {
      const { userId, publisherType, publisherId } = action.payload;
      state.subscriptions = state.subscriptions.filter(
        (item) => !(item.userId === userId && item.publisherType === publisherType && item.publisherId === publisherId),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBusinesses.pending, (state) => {
        state.loading.businesses = true;
      })
      .addCase(loadBusinesses.fulfilled, (state, action) => {
        state.businesses = action.payload;
        indexBusinesses(state, action.payload);
        state.loading.businesses = false;
      })
      .addCase(loadBusinesses.rejected, (state) => {
        state.loading.businesses = false;
      })
      .addCase(loadBusiness.pending, (state) => {
        state.loading.business = true;
      })
      .addCase(loadBusiness.fulfilled, (state, action) => {
        if (action.payload) indexBusinesses(state, [action.payload]);
        state.loading.business = false;
      })
      .addCase(loadBusiness.rejected, (state) => {
        state.loading.business = false;
      })
      .addCase(loadBusinessesByIds.fulfilled, (state, action) => {
        indexBusinesses(state, action.payload);
      })
      .addCase(loadSubscriptions.pending, (state) => {
        state.loading.subscriptions = true;
      })
      .addCase(loadSubscriptions.fulfilled, (state, action) => {
        state.subscriptions = action.payload;
        state.loading.subscriptions = false;
      })
      .addCase(loadSubscriptions.rejected, (state) => {
        state.loading.subscriptions = false;
      })
      .addCase(loadReviews.pending, (state) => {
        state.loading.reviews = true;
      })
      .addCase(loadReviews.fulfilled, (state, action) => {
        state.reviewsReceived = action.payload.received;
        state.reviewsAuthored = action.payload.authored;
        state.reviewsAverage = action.payload.average;
        state.loading.reviews = false;
      })
      .addCase(loadReviews.rejected, (state) => {
        state.loading.reviews = false;
      })
      .addCase(loadVerification.fulfilled, (state, action) => {
        if (action.payload) state.verification = action.payload;
      });
  },
});

export const { publicBusinessesReceived, subscriptionUpserted, subscriptionRemoved } = accountSlice.actions;
export const accountReducer = accountSlice.reducer;

/** Mes abonnements (web selectUserSubscriptions). */
export function selectMySubscriptions(
  subscriptions: PublisherSubscription[],
  userId?: string | null,
): PublisherSubscription[] {
  if (!userId) return [];
  return selectUserSubscriptionList(subscriptions, userId) as PublisherSubscription[];
}

export function selectOwnedBusinesses(businesses: Business[], userId?: string | null): Business[] {
  if (!userId) return [];
  return businesses.filter((item) => item.ownerId === userId && !item.deletedByUserAt);
}

/** Abonnement de l'utilisateur à un éditeur (web selectPublisherSubscription). */
export function findPublisherSubscription(
  subscriptions: PublisherSubscription[],
  userId: string | null | undefined,
  publisherType: string,
  publisherId: string | null | undefined,
): PublisherSubscription | null {
  if (!userId || !publisherId) return null;
  return (
    subscriptions.find(
      (item) => item.userId === userId && item.publisherType === publisherType && item.publisherId === publisherId,
    ) || null
  );
}
