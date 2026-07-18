/** Détecte les erreurs liées au réseau / au chargement de chunks. */
export function isNetworkError(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (!error) return false

  const name = String(error.name || '')
  const message = String(error.message || error || '')
  const combined = `${name} ${message}`.toLowerCase()

  if (name === 'ChunkLoadError' || name === 'TypeError') {
    if (
      /failed to fetch|load failed|networkerror|loading chunk|dynamically imported module|importing a module script failed/i.test(
        message,
      )
    ) {
      return true
    }
  }

  return (
    /failed to fetch|networkerror|network request failed|load failed|loading css chunk|loading chunk|err_internet_disconnected|err_network_changed|err_connection|dynamically imported module|importing a module script failed|offline/i.test(
      combined,
    )
  )
}
