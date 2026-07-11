import { useLayoutEffect, useRef } from 'react'

export function scrollPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.querySelector('main')?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' })
}

/** Remonte le défilement à chaque changement d'étape (wizards publication, etc.). */
export function useScrollToTopOnStep(step) {
  const isFirstRender = useRef(true)

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    scrollPageToTop()
  }, [step])
}
