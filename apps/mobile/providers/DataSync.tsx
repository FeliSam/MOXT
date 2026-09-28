import { useEffect, type ReactNode } from 'react';

import { registerForPushNotifications } from '@/services/notifications';
import { subscribePresence, unsubscribePresence } from '@/services/chatRealtime';
import { subscribeRealtime, unsubscribeRealtime } from '@/services/realtime';
import { loadCoreData } from '@/store/data';
import { loadConversations } from '@/store/messages';
import { loadBusinesses, loadSubscriptions } from '@/store/account';
import { loadFavorites } from '@/store/favorites';
import { loadNotifications, setPushToken } from '@/store/notifications';
import { loadModuleFlags } from '@/store/platform';
import { loadFeed } from '@/store/feed';
import { loadDashboardData } from '@/store/dashboard';
import { useAppDispatch, useAppSelector, store } from '@/store/store';

export function DataSync({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      dispatch(loadCoreData());
      dispatch(loadConversations(userId));
      // Données alignées sur le web (services partagés @moxt/shared/services).
      dispatch(loadNotifications(userId));
      dispatch(loadFavorites(userId));
      dispatch(loadBusinesses(userId));
      dispatch(loadSubscriptions());
      dispatch(loadModuleFlags());
      dispatch(loadFeed(userId));
      dispatch(loadDashboardData(userId));

      registerForPushNotifications().then((token) => {
        if (token) dispatch(setPushToken(token));
      });

      subscribeRealtime(userId, dispatch, () => store.getState());
      subscribePresence(userId);

      return () => {
        unsubscribeRealtime();
        unsubscribePresence();
      };
    }
  }, [dispatch, status, userId]);

  return children;
}
