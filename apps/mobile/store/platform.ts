import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '@moxt/shared/config/moduleFlags.js';
import { fetchAppModuleFlags } from '@moxt/shared/services/moduleFlagsService.js';
import { supabase } from '../services/supabase';

export type ModuleId = 'stars' | 'feed' | 'news' | 'videos' | 'events' | 'jobs' | 'parcels' | 'avatar';
export type ModuleFlags = Record<ModuleId, boolean>;

type PlatformState = { flags: ModuleFlags; status: 'idle' | 'loading' | 'ready' | 'error' };

const initialState: PlatformState = {
  flags: { ...(DEFAULT_DEV_MODULE_FLAGS as ModuleFlags) },
  status: 'idle',
};

/** Drapeaux de modules pilotés par l'admin (table app_module_flags), comme le web. */
export const loadModuleFlags = createAsyncThunk('platform/loadModuleFlags', async () => {
  if (!supabase) return { ...(DEFAULT_DEV_MODULE_FLAGS as ModuleFlags) };
  const result = (await fetchAppModuleFlags(supabase)) as unknown as { flags: ModuleFlags };
  return result.flags;
});

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadModuleFlags.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadModuleFlags.fulfilled, (state, action) => {
        state.flags = normalizeDevModuleFlags(action.payload) as ModuleFlags;
        state.status = 'ready';
      })
      .addCase(loadModuleFlags.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export const platformReducer = platformSlice.reducer;

/** Même règle que le web canAccessDevModule : pas de module → accessible. */
export function canAccessModule(flags: ModuleFlags, moduleId?: string | null) {
  if (!moduleId) return true;
  return Boolean((flags as Record<string, boolean>)[moduleId]);
}
