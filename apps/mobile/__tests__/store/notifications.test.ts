import { configureStore } from '@reduxjs/toolkit';

import {
  clearAll,
  markAllAsRead,
  markAsRead,
  notificationUpserted,
  notificationsReducer,
  selectUnreadNotificationCount,
  selectVisibleNotifications,
  setPushToken,
  type NotificationItem,
} from '../../store/notifications';

const uid = 'user-1';

function createStore() {
  return configureStore({
    reducer: {
      notifications: notificationsReducer,
      auth: (state: { user: { id: string } | null } = { user: { id: uid } }) => state,
    },
  });
}

function notif(partial: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n',
    userId: uid,
    title: 'T',
    message: 'M',
    type: 'system',
    link: null,
    priority: 'normal',
    read: false,
    archived: false,
    createdAt: '2026-09-01T10:00:00Z',
    ...partial,
  };
}

describe('notifications slice (serveur)', () => {
  it('démarre vide', () => {
    const store = createStore();
    expect(store.getState().notifications.items).toEqual([]);
    expect(store.getState().notifications.pushToken).toBeNull();
  });

  it('temps réel : ajoute, met à jour, ignore les messages', () => {
    const store = createStore();
    store.dispatch(notificationUpserted(notif({ id: 'a' })));
    store.dispatch(notificationUpserted(notif({ id: 'b', type: 'message' })));
    store.dispatch(notificationUpserted(notif({ id: 'a', read: true })));
    expect(store.getState().notifications.items).toHaveLength(1);
    expect(store.getState().notifications.items[0].read).toBe(true);
  });

  it('module Stars désactivé par défaut : notifications « stars » ignorées (règle web)', () => {
    const store = createStore();
    expect(store.getState().notifications.starsEnabled).toBe(false);
    store.dispatch(notificationUpserted(notif({ id: 's', type: 'stars' })));
    expect(store.getState().notifications.items).toHaveLength(0);
  });

  it('badge cloche = non lues visibles (règles web)', () => {
    const store = createStore();
    store.dispatch(notificationUpserted(notif({ id: 'a' })));
    store.dispatch(notificationUpserted(notif({ id: 'b', archived: true })));
    store.dispatch(notificationUpserted(notif({ id: 'c', userId: 'other' })));
    store.dispatch(notificationUpserted(notif({ id: 'd', read: true, createdAt: '2026-09-02T10:00:00Z' })));
    const state = store.getState();
    expect(selectUnreadNotificationCount(state)).toBe(1);
    expect(selectVisibleNotifications(state).map((n) => n.id)).toEqual(['d', 'a']);
  });

  it('marque lue (optimiste, sans client en test)', async () => {
    const store = createStore();
    store.dispatch(notificationUpserted(notif({ id: 'a' })));
    store.dispatch(notificationUpserted(notif({ id: 'b' })));
    await store.dispatch(markAsRead('a'));
    expect(selectUnreadNotificationCount(store.getState())).toBe(1);
    await store.dispatch(markAllAsRead(uid));
    expect(selectUnreadNotificationCount(store.getState())).toBe(0);
  });

  it('vide et jeton push', () => {
    const store = createStore();
    store.dispatch(notificationUpserted(notif({ id: 'a' })));
    store.dispatch(clearAll());
    store.dispatch(setPushToken('ExponentPushToken[abc123]'));
    expect(store.getState().notifications.items).toEqual([]);
    expect(store.getState().notifications.pushToken).toBe('ExponentPushToken[abc123]');
  });
});
