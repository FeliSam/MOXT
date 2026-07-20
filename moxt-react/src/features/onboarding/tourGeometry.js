const VIEW_MARGIN = 16
const CARD_GAP = 14

/**
 * @param {DOMRect | null} rect
 * @param {number} [pad]
 */
export function inflateRect(rect, pad = 8) {
  if (!rect) return null
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    bottom: rect.bottom + pad,
    right: rect.right + pad,
  }
}

/**
 * Measure a selector; returns null if missing or zero-size / offscreen.
 * Prefer the first visible match when several nodes share the selector.
 * @param {string | null | undefined} selector
 */
export function measureTourTarget(selector) {
  if (!selector || typeof document === 'undefined') return null
  const nodes = document.querySelectorAll(selector)
  if (!nodes.length) return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  for (const el of nodes) {
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      continue
    }
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    } catch {
      // ignore
    }
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) continue
    if (rect.bottom < 0 || rect.right < 0 || rect.top > vh || rect.left > vw) continue
    return { el, rect }
  }
  return null
}

/**
 * @param {{ top: number, left: number, width: number, height: number } | null} hole
 * @param {'center' | 'auto' | 'top' | 'bottom' | 'left' | 'right'} placement
 * @param {{ width: number, height: number }} cardSize
 */
export function placeTourCard(hole, placement, cardSize) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844
  const cw = Math.min(cardSize.width, vw - VIEW_MARGIN * 2)
  const ch = cardSize.height

  if (!hole || placement === 'center') {
    return {
      top: Math.max(VIEW_MARGIN, (vh - ch) / 2),
      left: Math.max(VIEW_MARGIN, (vw - cw) / 2),
      width: cw,
      arrow: null,
    }
  }

  const prefer = placement === 'auto' ? inferPlacement(hole, vw, vh) : placement
  const candidates = orderPlacements(prefer)

  for (const side of candidates) {
    const pos = trySide(hole, side, cw, ch, vw, vh)
    if (pos) return { ...pos, width: cw, arrow: side }
  }

  return {
    top: Math.max(VIEW_MARGIN, Math.min(hole.bottom + CARD_GAP, vh - ch - VIEW_MARGIN)),
    left: clamp(hole.left + hole.width / 2 - cw / 2, VIEW_MARGIN, vw - cw - VIEW_MARGIN),
    width: cw,
    arrow: 'bottom',
  }
}

function inferPlacement(hole, vw, vh) {
  const space = {
    top: hole.top,
    bottom: vh - hole.bottom,
    left: hole.left,
    right: vw - hole.right,
  }
  return /** @type {'top'|'bottom'|'left'|'right'} */ (
    Object.entries(space).sort((a, b) => b[1] - a[1])[0][0]
  )
}

function orderPlacements(prefer) {
  const rest = ['top', 'bottom', 'left', 'right'].filter((s) => s !== prefer)
  return [prefer, ...rest]
}

function trySide(hole, side, cw, ch, vw, vh) {
  let top
  let left

  if (side === 'top') {
    top = hole.top - ch - CARD_GAP
    left = hole.left + hole.width / 2 - cw / 2
  } else if (side === 'bottom') {
    top = hole.bottom + CARD_GAP
    left = hole.left + hole.width / 2 - cw / 2
  } else if (side === 'left') {
    top = hole.top + hole.height / 2 - ch / 2
    left = hole.left - cw - CARD_GAP
  } else {
    top = hole.top + hole.height / 2 - ch / 2
    left = hole.right + CARD_GAP
  }

  if (side === 'top' && hole.top < ch + CARD_GAP + VIEW_MARGIN) return null
  if (side === 'bottom' && vh - hole.bottom < ch + CARD_GAP + VIEW_MARGIN) return null
  if (side === 'left' && hole.left < cw + CARD_GAP + VIEW_MARGIN) return null
  if (side === 'right' && vw - hole.right < cw + CARD_GAP + VIEW_MARGIN) return null

  return {
    top: clamp(top, VIEW_MARGIN, vh - ch - VIEW_MARGIN),
    left: clamp(left, VIEW_MARGIN, vw - cw - VIEW_MARGIN),
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}
