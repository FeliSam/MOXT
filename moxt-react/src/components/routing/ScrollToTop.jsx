import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollPageToTop } from '../../hooks/useScrollToTopOnStep'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    scrollPageToTop()
  }, [pathname])

  return null
}
