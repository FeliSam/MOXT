import { useEffect, type ReactNode } from 'react';

import { registerForPushNotifications } from '@/services/notifications';
import { subscribeRealtime, unsubscribeRealtime } from '@/services/realtime';
import { loadCoreData } from '@/store/data';
import { loadConversations } from '@/store/messages';
import { setPushToken } from '@/store/notifications';
import { loadRatings } from '@/store/ratings';
import { useAppDispatch, useAppSelector, store } from '@/store/store';

export function DataSync({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      dispatch(loadCoreData());
      dispatch(loadConversations(userId));
      dispatch(loadRatings(userId));

      registerForPushNotifications().then((token) => {
        if (token) dispatch(setPushToken(token));
      });

      subscribeRealtime(userId, dispatch, () => store.getState());

      return () => {
        unsubscribeRealtime();
      };
    }
  }, [dispatch, status, userId]);

  return children;
}
