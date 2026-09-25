import { useId } from 'react'

/** Unique SVG paint-server ids (avoid collisions when several banners mount). */
export function useCoverSvgIds(prefix = 'moxtCover') {
  const raw = useId().replace(/:/g, '')
  return (name) => `${prefix}-${name}-${raw}`
}

export function GrainOverlay({ id, opacity = 0.45 }) {
  return (
    <rect
      width="800"
      height="220"
      filter={`url(#${id})`}
      opacity={opacity}
      style={{ mixBlendMode: 'overlay' }}
    />
  )
}

export function grainFilterDef(id, alpha = 0.22) {
  return (
    <filter id={id} x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
      <feColorMatrix
        in="noise"
        type="matrix"
        values={`0 0 0 0 0.55
                 0 0 0 0 0.48
                 0 0 0 0 0.35
                 0 0 0 ${alpha} 0`}
      />
    </filter>
  )
}

export function softShadowFilterDef(id) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
    </filter>
  )
}
