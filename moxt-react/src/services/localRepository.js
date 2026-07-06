import { createLocalStorage } from './createLocalStorage'

export function createLocalRepository(key, fallback = []) {
  const storage = createLocalStorage(key)
  return {
    list() {
      return storage.read(fallback)
    },
    save(items) {
      return storage.write(items)
    },
    clear() {
      try {
        localStorage.removeItem(key)
        return true
      } catch {
        return false
      }
    },
  }
}
