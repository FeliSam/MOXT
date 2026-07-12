import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getRouteMetadata } from '../config/routeMeta'

/** @typedef {{ type: 'path', to: string } | { type: 'delta', delta: number }} BackTarget */

export function canNavigateBack(location) {
  if (location?.state?.from) return true
  return location?.key !== 'default'
}

/**
 * @param {import('react-router-dom').Location} location
 * @param {string} [explicitFallback]
 */
export function resolveBackTarget(location, explicitFallback) {
  const fallback = explicitFallback ?? getRouteMetadata(location.pathname).back ?? '/dashboard'

  if (location.state?.from) {
    return { type: 'path', to: location.state.from }
  }
  if (canNavigateBack(location)) {
    return { type: 'delta', delta: -1 }
  }
  return { type: 'path', to: fallback }
}

/**
 * Retour intelligent : historique in-app si disponible, sinon route de repli.
 * @param {string} [explicitFallback] Route si pas d'historique (ex. `/jobs`)
 */
export function useBackNavigation(explicitFallback) {
  const navigate = useNavigate()
  const location = useLocation()
  const fallback =
    explicitFallback ?? getRouteMetadata(location.pathname).back ?? '/dashboard'
  const target = resolveBackTarget(location, fallback)

  const goBack = useCallback(() => {
    if (target.type === 'delta') {
      navigate(target.delta)
      return
    }
    navigate(target.to)
  }, [navigate, target])

  return {
    goBack,
    fallback,
    canGoBack: target.type === 'delta' || Boolean(location.state?.from),
  }
}
