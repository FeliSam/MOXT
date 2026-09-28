import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';
import { p2pOfferFromRemoteRow, p2pOrderFromRemoteRow } from '@moxt/shared/domain/p2pRules.js';
import { supabase } from '../services/supabase';

export type P2POffer = {
  id: string;
  ownerId?: string;
  ownerName?: string;
  businessId?: string | null;
  status?: string;
  amount?: number;
  fromCurrency?: string;
  toCurrency?: string;
  rate?: number | string;
  method?: string;
  comment?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type DashboardEvent = {
  id: string;
  title?: string;
  city?: string;
  format?: string;
  category?: string;
  organizerName?: string;
  startAt?: string;
  status?: string;
  [key: string]: unknown;
};

type DashboardState = {
  p2pOffers: P2POffer[];
  p2pOrders: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  events: DashboardEvent[];
  jobs: Record<string, unknown>[];
  businessReviews: Record<string, unknown>[];
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const initialState: DashboardState = {
  p2pOffers: [],
  p2pOrders: [],
  reviews: [],
  events: [],
  jobs: [],
  businessReviews: [],
  status: 'idle',
};

/** Même fenêtre que le web (loadAllData : 50 dernières lignes publiques). */
const PUBLIC_LIMIT = 50;

/**
 * Données de l'accueil que le mobile ne chargeait pas encore : offres P2P
 * (+ commandes / avis pour la réputation), événements et jobs. Lecture seule.
 */
export const loadDashboardData = createAsyncThunk('dashboard/load', async (userId: string) => {
  if (!supabase) return { p2pOffers: [], p2pOrders: [], reviews: [], events: [], jobs: [] };
  const client = supabase;
  const safe = (res: { data: unknown; error: unknown } | null) =>
    res && !res.error && Array.isArray(res.data) ? (res.data as any[]) : [];

  const [offersRes, ordersRes, eventsRes, jobsRes] = await Promise.all([
    client.from('p2p_offers').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
    client
      .from('p2p_orders')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200),
    client.from('events').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
    client.from('jobs').select('*').order('created_at', { ascending: false }).limit(PUBLIC_LIMIT),
  ]);

  const p2pOffers = safe(offersRes).map(p2pOfferFromRemoteRow).filter(Boolean) as P2POffer[];
  const ownerIds = [...new Set(p2pOffers.map((offer) => offer.ownerId).filter(Boolean))] as string[];
  const reviewsRes = ownerIds.length
    ? await client.from('reviews').select('*').in('target_id', ownerIds).limit(200)
    : null;

  return {
    p2pOffers,
    p2pOrders: safe(ordersRes).map(p2pOrderFromRemoteRow).filter(Boolean),
    reviews: fromRows(safe(reviewsRes)),
    events: fromRows(safe(eventsRes)) as DashboardEvent[],
    jobs: fromRows(safe(jobsRes)),
  };
});

/** Avis publiés sur les fiches entreprises du carrousel (note ★ des cartes). Lecture seule. */
export const loadBusinessReviews = createAsyncThunk('dashboard/businessReviews', async (businessIds: string[]) => {
  if (!supabase || !businessIds.length) return [];
  const res = await supabase.from('reviews').select('*').in('target_id', businessIds).limit(500);
  return res.error ? [] : fromRows(res.data || []);
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboardData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadDashboardData.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = 'ready';
      })
      .addCase(loadDashboardData.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(loadBusinessReviews.fulfilled, (state, action) => {
        state.businessReviews = action.payload as Record<string, unknown>[];
      });
  },
});

export const dashboardReducer = dashboardSlice.reducer;
