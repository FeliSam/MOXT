import { createAsyncThunk } from '@reduxjs/toolkit';

import { fetchPublicFeedCatalog } from '@moxt/shared/services/feedService.js';

import { publicBusinessesReceived } from '@/store/account';
import { receivePublicCatalog } from '@/store/dashboard';
import { publicFeedReceived } from '@/store/feed';
import { setListings } from '@/store/marketplace';
import { setParcels } from '@/store/parcels';
import { supabase } from '@/services/supabase';

/** Catalogue public du Fil (lectures seules), y compris sous le harnais e2e. */
export const hydratePublicFeed = createAsyncThunk('feed/hydratePublic', async (_, { dispatch }) => {
  if (!supabase) return null;
  const catalog = await fetchPublicFeedCatalog(supabase);
  dispatch(setListings(catalog.listings as never));
  dispatch(setParcels({ items: catalog.parcels as never }));
  dispatch(
    receivePublicCatalog({
      p2pOffers: catalog.p2pOffers as never,
      events: catalog.events as never,
      jobs: catalog.jobs as never,
    }),
  );
  dispatch(publicBusinessesReceived(catalog.businesses as never));
  dispatch(publicFeedReceived({ posts: catalog.posts as never, videos: catalog.videos as never }));
  return catalog;
});
