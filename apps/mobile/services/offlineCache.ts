import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'moxt_cache_';
const QUEUE_KEY = 'moxt_offline_queue';

export type OfflineAction = {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
};

export async function cacheData(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch {}
}

export async function getCachedData<T = any>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {}
}

export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push({
    ...action,
    id: `OA-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((a) => a.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}
