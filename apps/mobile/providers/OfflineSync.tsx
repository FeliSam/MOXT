import { useEffect, useRef, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { supabase } from '@/services/supabase';
import { cacheData, getCachedData, getOfflineQueue, removeFromQueue } from '@/services/offlineCache';
import { loadCoreData } from '@/store/data';
import { useAppDispatch, useAppSelector } from '@/store/store';

export function OfflineSync({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const wasOffline = useRef(false);

  // Cache data whenever it changes
  useEffect(() => {
    if (transfers.length > 0) cacheData('transfers', transfers);
  }, [transfers]);

  useEffect(() => {
    if (parcels.length > 0) cacheData('parcels', parcels);
  }, [parcels]);

  // Process offline queue when connectivity returns
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      if (isConnected && wasOffline.current && status === 'authenticated') {
        wasOffline.current = false;
        await processQueue();
        dispatch(loadCoreData());
      }

      if (!isConnected) {
        wasOffline.current = true;
      }
    });

    return () => unsubscribe();
  }, [dispatch, status]);

  return children;
}

async function processQueue() {
  if (!supabase) return;
  const queue = await getOfflineQueue();

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'insert': {
          const { table, row } = action.payload;
          await supabase.from(table).insert(row);
          break;
        }
        case 'update': {
          const { table: t, id, data } = action.payload;
          await supabase.from(t).update(data).eq('id', id);
          break;
        }
        default:
          break;
      }
      await removeFromQueue(action.id);
    } catch {
      // Keep in queue for next retry
    }
  }
}
