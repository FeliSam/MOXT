import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportError, trackEvent } from './monitoring';

export type SyncAction = {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
};

export type ConflictResolution = 'client_wins' | 'server_wins' | 'merge' | 'manual';

export type SyncConflict = {
  actionId: string;
  localData: any;
  serverData: any;
  field: string;
  resolvedBy?: ConflictResolution;
};

const QUEUE_KEY = '@moxt_sync_queue_v2';
const CONFLICTS_KEY = '@moxt_sync_conflicts';

export async function getQueue(): Promise<SyncAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToQueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: `SYN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    retryCount: 0,
  });
  // Sort by priority
  queue.sort((a, b) => {
    const prio = { high: 0, normal: 1, low: 2 };
    return prio[a.priority] - prio[b.priority];
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function removeFromQueue(actionId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((a) => a.id !== actionId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function incrementRetry(actionId: string): Promise<SyncAction | null> {
  const queue = await getQueue();
  const action = queue.find((a) => a.id === actionId);
  if (!action) return null;
  action.retryCount++;
  if (action.retryCount >= action.maxRetries) {
    await removeFromQueue(actionId);
    trackEvent('sync_action_failed', { type: action.type, retries: action.retryCount } as any);
    return null;
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return action;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

// Conflict management
export async function getConflicts(): Promise<SyncConflict[]> {
  const raw = await AsyncStorage.getItem(CONFLICTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addConflict(conflict: SyncConflict): Promise<void> {
  const conflicts = await getConflicts();
  conflicts.push(conflict);
  await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(conflicts));
  trackEvent('sync_conflict', { field: conflict.field } as any);
}

export async function resolveConflict(actionId: string, resolution: ConflictResolution): Promise<any> {
  const conflicts = await getConflicts();
  const conflict = conflicts.find((c) => c.actionId === actionId);
  if (!conflict) return null;

  let resolvedData: any;
  switch (resolution) {
    case 'client_wins':
      resolvedData = conflict.localData;
      break;
    case 'server_wins':
      resolvedData = conflict.serverData;
      break;
    case 'merge':
      resolvedData = deepMerge(conflict.serverData, conflict.localData);
      break;
    case 'manual':
      resolvedData = conflict.localData;
      break;
  }

  conflict.resolvedBy = resolution;
  const updated = conflicts.filter((c) => c.actionId !== actionId);
  await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(updated));

  return resolvedData;
}

export async function clearConflicts(): Promise<void> {
  await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify([]));
}

// Process queue with exponential backoff
export async function processQueue(
  executor: (action: SyncAction) => Promise<{ success: boolean; conflict?: { serverData: any; field: string } }>,
): Promise<{ processed: number; failed: number; conflicts: number }> {
  const queue = await getQueue();
  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  for (const action of queue) {
    const backoffMs = Math.min(1000 * Math.pow(2, action.retryCount), 30_000);
    if (Date.now() - action.timestamp < backoffMs * action.retryCount) continue;

    try {
      const result = await executor(action);
      if (result.success) {
        await removeFromQueue(action.id);
        processed++;
      } else if (result.conflict) {
        await addConflict({
          actionId: action.id,
          localData: action.payload,
          serverData: result.conflict.serverData,
          field: result.conflict.field,
        });
        await removeFromQueue(action.id);
        conflicts++;
      } else {
        const updated = await incrementRetry(action.id);
        if (!updated) failed++;
      }
    } catch (e) {
      const updated = await incrementRetry(action.id);
      if (!updated) failed++;
      if (e instanceof Error) reportError(e, { actionType: action.type });
    }
  }

  return { processed, failed, conflicts };
}

function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || typeof source !== 'object') return source;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
