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

export type InboxParcelRequest = { id: string; parcelId?: string; ownerId?: string; status?: string };
export type InboxJobApplication = { id: string; jobId?: string; status?: string };

type DashboardState = {
  p2pOffers: P2POffer[];
  p2pOrders: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  events: DashboardEvent[];
  jobs: Record<string, unknown>[];
  businessReviews: Record<string, unknown>[];
  incomingParcelRequests: InboxParcelRequest[];
  jobApplications: InboxJobApplication[];
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const initialState: DashboardState = {
  p2pOffers: [],
  p2pOrders: [],
  reviews: [],
  events: [],
  jobs: [],
  businessReviews: [],
  incomingParcelRequests: [],
  jobApplications: [],
  status: 'idle',
};

/** Même fenêtre que le web (loadAllData : 50 dernières lignes publiques). */
const PUBLIC_LIMIT = 50;

/**
 * Données de l'accueil que le mobile ne chargeait pas encore : offres P2P
 * (+ commandes / avis pour la réputation), événements et jobs. Lecture seule.
 */
export const loadDashboardData = createAsyncThunk('dashboard/load', async (userId: string) => {
  if (!supabase) {
    return {
      p2pOffers: [],
      p2pOrders: [],
      reviews: [],
      events: [],
      jobs: [],
      incomingParcelRequests: [],
      jobApplications: [],
    };
  }
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
  const jobs = fromRows(safe(jobsRes)) as Record<string, unknown>[];
  const ownedJobIds = jobs
    .filter((job) => job.ownerId === userId)
    .map((job) => String(job.id || ''))
    .filter(Boolean);
  const ownerIds = [...new Set(p2pOffers.map((offer) => offer.ownerId).filter(Boolean))] as string[];
  const [reviewsRes, parcelReqRes, appsRes] = await Promise.all([
    ownerIds.length ? client.from('reviews').select('*').in('target_id', ownerIds).limit(200) : Promise.resolve(null),
    client.from('parcel_requests').select('*').eq('owner_id', userId).eq('status', 'submitted').limit(50),
    ownedJobIds.length
      ? client.from('job_applications').select('*').in('job_id', ownedJobIds).eq('status', 'submitted').limit(100)
      : Promise.resolve(null),
  ]);

  return {
    p2pOffers,
    p2pOrders: safe(ordersRes).map(p2pOrderFromRemoteRow).filter(Boolean),
    reviews: fromRows(safe(reviewsRes)),
    events: fromRows(safe(eventsRes)) as DashboardEvent[],
    jobs,
    incomingParcelRequests: fromRows(safe(parcelReqRes)) as InboxParcelRequest[],
    jobApplications: fromRows(safe(appsRes)) as InboxJobApplication[],
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
  reducers: {
    receivePublicCatalog(
      state,
      action: { payload: { p2pOffers: P2POffer[]; events: DashboardEvent[]; jobs: Record<string, unknown>[] } },
    ) {
      state.p2pOffers = action.payload.p2pOffers;
      state.events = action.payload.events;
      state.jobs = action.payload.jobs;
      state.status = 'ready';
    },
    upsertP2POffer(state, action: { payload: P2POffer }) {
      const index = state.p2pOffers.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) state.p2pOffers[index] = { ...state.p2pOffers[index], ...action.payload };
      else state.p2pOffers.unshift(action.payload);
    },
  },
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
export const { receivePublicCatalog, upsertP2POffer } = dashboardSlice.actions;
