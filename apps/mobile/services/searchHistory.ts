import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'moxt-search-history-v1';
const LIMIT = 5;

export function normalizeSearchHistory(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, LIMIT) : [];
}

export function mergeSearchTerm(history: string[], term: string) {
  const normalized = term.trim();
  if (normalized.length < 2) return history.slice(0, LIMIT);
  return [
    normalized,
    ...history.filter((item) => item.toLocaleLowerCase('fr') !== normalized.toLocaleLowerCase('fr')),
  ].slice(0, LIMIT);
}

export async function readSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return normalizeSearchHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export async function saveSearchTerm(term: string) {
  const history = mergeSearchTerm(await readSearchHistory(), term);
  if (term.trim().length >= 2) {
    await AsyncStorage.setItem(KEY, JSON.stringify(history)).catch(() => undefined);
  }
  return history;
}

export async function clearSearchHistory() {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
