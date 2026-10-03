import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  countUnreadNotifications,
  selectVisibleNotificationList,
  upsertNotification,
} from '@moxt/shared/domain/notificationRules.js';
import {
  archiveNotification as archiveNotificationRemote,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@moxt/shared/services/notificationsService.js';
import {
  fetchAppModuleFlags,
  isStarsModuleEnabled,
} from '@moxt/shared/services/moduleFlagsService.js';
import { supabase } from '../services/supabase';

/** Même forme que les notifications web (table `notifications`). */
export type NotificationItem = {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  priority: string;
  read: boolean;
  archived: boolean;
  createdAt: string | null;
};

type NotificationsState = {
  items: NotificationItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  pushToken: string | null;
  /** Module Stars (app_module_flags) : off → notifications « stars » masquées comme le web. */
  starsEnabled: boolean;
};

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  error: null,
  pushToken: null,
  starsEnabled: false,
};

/** Chargement serveur (mêmes requête et filtres que le web). */
export const loadNotifications = createAsyncThunk(
  'notifications/load',
  async (userId: string): Promise<{ items: NotificationItem[]; starsEnabled: boolean }> => {
    if (!supabase) return { items: [], starsEnabled: false };
    // Même règle que le web (loadAllData) : type « stars » visible seulement si le module est actif.
    const starsEnabled = await fetchAppModuleFlags(supabase)
      .then((result: { flags: Record<string, boolean> }) => isStarsModuleEnabled(result.flags))
      .catch(() => false);
    const items = (await fetchNotifications(supabase, userId, { starsEnabled })) as NotificationItem[];
    return { items, starsEnabled };
  },
);

/** Marque lue localement puis côté serveur (même écriture que le web). */
export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id: string) => {
  if (supabase) await markNotificationRead(supabase, id);
  return id;
});

/** Archive comme le web (communications/archiveNotification). */
export const archiveNotification = createAsyncThunk(
  'notifications/archive',
  async (args: { id: string; userId: string }) => {
    if (supabase) await archiveNotificationRemote(supabase, args);
    return args.id;
  },
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId: string) => {
    if (supabase) await markAllNotificationsRead(supabase, userId);
    return userId;
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPushToken(state, action: PayloadAction<string | null>) {
      state.pushToken = action.payload;
    },
    /** Temps réel (INSERT / UPDATE sur `notifications`). */
    notificationUpserted(state, action: PayloadAction<NotificationItem>) {
      if (action.payload.type === 'message') return;
      if (action.payload.type === 'stars' && !state.starsEnabled) return;
      state.items = upsertNotification(state.items, action.payload) as NotificationItem[];
    },
    clearAll(state) {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.starsEnabled = action.payload.starsEnabled;
        state.status = 'ready';
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Chargement des notifications impossible';
      })
      .addCase(markAsRead.pending, (state, action) => {
        const item = state.items.find((n) => n.id === action.meta.arg);
        if (item) item.read = true;
      })
      .addCase(markAllAsRead.pending, (state) => {
        state.items.forEach((n) => {
          n.read = true;
        });
      })
      .addCase(archiveNotification.pending, (state, action) => {
        const item = state.items.find((n) => n.id === action.meta.arg.id);
        if (item) item.archived = true;
      });
  },
});

export const { setPushToken, notificationUpserted, clearAll } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;

type WithNotifications = {
  notifications: NotificationsState;
  auth: { user: { id: string } | null };
};

const selectItems = (state: WithNotifications) => state.notifications.items;
const selectUserId = (state: WithNotifications) => state.auth.user?.id ?? null;

/** Liste visible (web selectVisibleNotifications). */
export const selectVisibleNotifications = createSelector(
  [selectItems, selectUserId],
  (items, userId) => selectVisibleNotificationList(items, userId) as NotificationItem[],
);

/** Badge cloche (web selectUnreadNotificationCount). */
export const selectUnreadNotificationCount = createSelector(
  [selectItems, selectUserId],
  (items, userId) => countUnreadNotifications(items, userId) as number,
);
