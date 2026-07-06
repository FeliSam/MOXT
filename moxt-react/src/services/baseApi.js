import { createApi } from '@reduxjs/toolkit/query/react'
import { createSimulatedBaseQuery } from './simulatedBaseQuery'

// En production : remplacer createSimulatedBaseQuery() par :
// fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || '/api',
//   prepareHeaders: (headers, { getState }) => { ... } })
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: createSimulatedBaseQuery(),
  tagTypes: [
    'User',
    'Transfer',
    'Business',
    'Exchanger',
    'Parcel',
    'Listing',
    'Job',
    'Event',
    'Conversation',
    'Notification',
  ],
  endpoints: (builder) => ({
    // --- Marketplace ---
    getListings: builder.query({
      query: (params = {}) => `/listings?${new URLSearchParams(params)}`,
      providesTags: ['Listing'],
    }),
    getListing: builder.query({
      query: (id) => `/listings/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Listing', id }],
    }),

    // --- Colis ---
    getParcels: builder.query({
      query: (params = {}) => `/parcels?${new URLSearchParams(params)}`,
      providesTags: ['Parcel'],
    }),
    getParcel: builder.query({
      query: (id) => `/parcels/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Parcel', id }],
    }),

    // --- Jobs ---
    getJobs: builder.query({
      query: (params = {}) => `/jobs?${new URLSearchParams(params)}`,
      providesTags: ['Job'],
    }),
    getJob: builder.query({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),

    // --- Événements ---
    getEvents: builder.query({
      query: (params = {}) => `/events?${new URLSearchParams(params)}`,
      providesTags: ['Event'],
    }),
    getEvent: builder.query({
      query: (id) => `/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Event', id }],
    }),

    // --- Échangeurs ---
    getExchangers: builder.query({
      query: (params = {}) => `/exchangers?${new URLSearchParams(params)}`,
      providesTags: ['Exchanger'],
    }),

    // --- Entreprises ---
    getBusinesses: builder.query({
      query: (params = {}) => `/businesses?${new URLSearchParams(params)}`,
      providesTags: ['Business'],
    }),
    getBusiness: builder.query({
      query: (id) => `/businesses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Business', id }],
    }),

    // --- Transferts ---
    getTransfers: builder.query({
      query: (params = {}) => `/transfers?${new URLSearchParams(params)}`,
      providesTags: ['Transfer'],
    }),
  }),
})

export const {
  useGetListingsQuery,
  useGetListingQuery,
  useGetParcelsQuery,
  useGetParcelQuery,
  useGetJobsQuery,
  useGetJobQuery,
  useGetEventsQuery,
  useGetEventQuery,
  useGetExchangersQuery,
  useGetBusinessesQuery,
  useGetBusinessQuery,
  useGetTransfersQuery,
} = baseApi
