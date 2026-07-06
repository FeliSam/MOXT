import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type?: 'transfer' | 'parcel' | 'marketplace' | 'message' | 'system';
  read: boolean;
  createdAt: string;
  relatedId?: string;
};

type NotificationsState = {
  items: NotificationItem[];
  pushToken: string | null;
};

const initialState: NotificationsState = {
  items: [],
  pushToken: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPushToken(state, action: PayloadAction<string | null>) {
      state.pushToken = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<NotificationItem, 'id' | 'read' | 'createdAt'>>) {
      state.items.unshift({
        ...action.payload,
        id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead(state) {
      state.items.forEach((n) => { n.read = true; });
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const { setPushToken, addNotification, markAsRead, markAllAsRead, clearAll } =
  notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
