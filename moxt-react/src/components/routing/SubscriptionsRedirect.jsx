import { Navigate, useLocation } from 'react-router-dom'

/** Ancienne route `/subscriptions` → onglet Abonnements de Mes publications. */
export function SubscriptionsRedirect() {
  const location = useLocation()
  const incoming = new URLSearchParams(location.search)
  const next = new URLSearchParams({ panel: 'subscriptions' })
  if (incoming.get('tab') === 'subscribers') {
    next.set('sub', 'subscribers')
  }
  return <Navigate to={`/publications/mine?${next.toString()}`} replace />
}
