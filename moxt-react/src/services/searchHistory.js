const KEY = 'moxt-search-history-v1'
const LIMIT = 5

export function readSearchHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(value)
      ? value.filter((item) => typeof item === 'string').slice(0, LIMIT)
      : []
  } catch {
    return []
  }
}

export function saveSearchTerm(term) {
  const normalized = term.trim()
  if (normalized.length < 2) return readSearchHistory()
  const history = [
    normalized,
    ...readSearchHistory().filter(
      (item) => item.toLocaleLowerCase('fr') !== normalized.toLocaleLowerCase('fr'),
    ),
  ].slice(0, LIMIT)
  localStorage.setItem(KEY, JSON.stringify(history))
  return history
}

export function clearSearchHistory() {
  localStorage.removeItem(KEY)
}
