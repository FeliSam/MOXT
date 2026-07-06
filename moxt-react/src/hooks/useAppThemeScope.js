import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const FINANCE_PREFIXES = [
  '/transfers',
  '/wallet',
  '/payments',
  '/receipts',
  '/exchangers',
  '/disputes',
  '/p2p',
]

const COMMUNITY_PREFIXES = [
  '/marketplace',
  '/jobs',
  '/events',
  '/parcels',
  '/businesses',
  '/favorites',
  '/news',
  '/activities',
]

export function useAppThemeScope() {
  const { pathname } = useLocation()

  return useMemo(() => {
    if (FINANCE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return 'finance'
    }
    if (COMMUNITY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return 'community'
    }
    return 'base'
  }, [pathname])
}
