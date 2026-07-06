import { configureStore } from '@reduxjs/toolkit';

import {
  notificationsReducer,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  setPushToken,
} from '../../store/notifications';

function createStore() {
  return configureStore({ reducer: { notifications: notificationsReducer } });
}

describe('notifications slice', () => {
  it('starts empty', () => {
    const store = createStore();
    const state = store.getState().notifications;
    expect(state.items).toEqual([]);
    expect(state.pushToken).toBeNull();
  });

  it('adds a notification', () => {
    const store = createStore();
    store.dispatch(addNotification({ title: 'Test', body: 'Body', type: 'system' }));
    expect(store.getState().notifications.items).toHaveLength(1);
    expect(store.getState().notifications.items[0].read).toBe(false);
    expect(store.getState().notifications.items[0].title).toBe('Test');
  });

  it('marks single notification as read', () => {
    const store = createStore();
    store.dispatch(addNotification({ title: 'A', body: 'B' }));
    const id = store.getState().notifications.items[0].id;
    store.dispatch(markAsRead(id));
    expect(store.getState().notifications.items[0].read).toBe(true);
  });

  it('marks all as read', () => {
    const store = createStore();
    store.dispatch(addNotification({ title: 'A', body: 'B' }));
    store.dispatch(addNotification({ title: 'C', body: 'D' }));
    store.dispatch(markAllAsRead());
    const allRead = store.getState().notifications.items.every((n) => n.read);
    expect(allRead).toBe(true);
  });

  it('clears all notifications', () => {
    const store = createStore();
    store.dispatch(addNotification({ title: 'A', body: 'B' }));
    store.dispatch(clearAll());
    expect(store.getState().notifications.items).toEqual([]);
  });

  it('sets push token', () => {
    const store = createStore();
    store.dispatch(setPushToken('ExponentPushToken[abc123]'));
    expect(store.getState().notifications.pushToken).toBe('ExponentPushToken[abc123]');
  });
});
