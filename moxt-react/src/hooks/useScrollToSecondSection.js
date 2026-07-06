import { useLayoutEffect } from 'react'

export function useScrollToSecondSection() {
  useLayoutEffect(() => {
    document.querySelector('[data-scroll-target="second-section"]')?.scrollIntoView({
      block: 'start',
      behavior: 'instant',
    })
  }, [])
}
