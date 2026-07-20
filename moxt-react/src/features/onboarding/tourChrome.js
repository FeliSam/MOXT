export const TOUR_MORE_EVENT = 'moxt-tour-more'

/** Open / close the mobile More drawer or desktop More services panel. */
export function setTourMoreOpen(open) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TOUR_MORE_EVENT, { detail: { open: Boolean(open) } }))
}

export function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
