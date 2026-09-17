import { Navigate, useOutletContext, useParams } from 'react-router-dom'

/**
 * Fiches catalogue accessibles sans compte : l'invité est renvoyé vers le Fil
 * (lecture seule déjà ouverte). Les interactions restent sur le détail connecté.
 */
export function GuestCatalogDetailGate({ kind, paramName, children }) {
  const { guestMode = false } = useOutletContext() || {}
  const params = useParams()
  const entityId = String(params?.[paramName] || '').trim()

  if (guestMode && kind && entityId) {
    const query = new URLSearchParams()
    if (kind === 'video') query.set('type', 'video')
    query.set('item', `${kind}:${entityId}`)
    return <Navigate to={`/feed?${query.toString()}`} replace />
  }

  return children
}
