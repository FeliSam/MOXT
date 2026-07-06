export function createLocalStorage(key) {
  return {
    read(fallback = []) {
      try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
      } catch {
        return fallback
      }
    },
    write(value) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
  }
}
