/** Stockage session Supabase pour le navigateur (localStorage). */
export function createBrowserSessionStorage(storage = globalThis.localStorage) {
  return {
    getItem: async (key) => storage.getItem(key),
    setItem: async (key, value) => {
      storage.setItem(key, value)
    },
    removeItem: async (key) => {
      storage.removeItem(key)
    },
  }
}
