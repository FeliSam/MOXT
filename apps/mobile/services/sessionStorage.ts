import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Stockage session Supabase — SecureStore (natif) ou localStorage (web). */
export function createMobileSessionStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        try {
          return globalThis.localStorage?.getItem(key) ?? null;
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        globalThis.localStorage?.setItem(key, value);
      },
      removeItem: async (key: string) => {
        globalThis.localStorage?.removeItem(key);
      },
    };
  }

  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}
