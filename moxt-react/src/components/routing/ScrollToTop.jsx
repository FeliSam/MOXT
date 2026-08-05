import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resetMessagesScroll, scrollPageToTop } from '../../hooks/useScrollToTopOnStep'

function isMessagesPath(pathname) {
  return pathname === '/messages' || pathname === '/messages/'
}

export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    if (isMessagesPath(pathname)) {
      resetMessagesScroll()
      return
    }
    scrollPageToTop()
  }, [pathname])

  return null
}
