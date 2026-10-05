import { useEffect, type ReactNode } from 'react';

import {
  registerForPushNotifications,
  syncDevicePushSubscription,
  updateAppBadgeCount,
} from '@/services/notifications';
import { subscribePresence, unsubscribePresence } from '@/services/chatRealtime';
import { subscribeRealtime, unsubscribeRealtime } from '@/services/realtime';
import { loadCoreData } from '@/store/data';
import { loadConversations, selectUnreadMessageCount } from '@/store/messages';
import { loadBusinesses, loadSubscriptions } from '@/store/account';
import { loadFavorites } from '@/store/favorites';
import {
  loadNotifications,
  selectUnreadNotificationCount,
  setPushToken,
} from '@/store/notifications';
import { loadModuleFlags } from '@/store/platform';
import { loadFeed } from '@/store/feed';
import { loadDashboardData } from '@/store/dashboard';
import { useAppDispatch, useAppSelector, store } from '@/store/store';
import { isE2eHarnessActive } from '@/utils/e2eHarness';

export function DataSync({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const conversations = useAppSelector((state) => state.messages.conversations);
  const unreadNotifications = useAppSelector(selectUnreadNotificationCount);
  const unreadMessages = selectUnreadMessageCount(conversations, userId);
  const totalUnread = (unreadNotifications || 0) + (unreadMessages || 0);

  useEffect(() => {
    if (isE2eHarnessActive()) return undefined;
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
        if (token) {
          dispatch(setPushToken(token));
          void syncDevicePushSubscription(userId, token);
        }
      });

      subscribeRealtime(userId, dispatch, () => store.getState());
      subscribePresence(userId);

      return () => {
        unsubscribeRealtime();
        unsubscribePresence();
      };
    }
  }, [dispatch, status, userId]);

  useEffect(() => {
    if (status === 'authenticated') {
      void updateAppBadgeCount(totalUnread);
    } else {
      void updateAppBadgeCount(0);
    }
  }, [status, totalUnread]);

  return children;
}
