import { useState } from 'react'
import { FiHeart } from 'react-icons/fi'

const BURST_DOTS = [
  { x: -14, y: -10, delay: 0 },
  { x: 0, y: -16, delay: 40 },
  { x: 14, y: -10, delay: 80 },
  { x: -12, y: 8, delay: 50 },
  { x: 12, y: 8, delay: 90 },
  { x: 0, y: 14, delay: 20 },
]

/**
 * Bouton favori animé : pop + burst à l'ajout, shrink au retrait.
 * `label` → mode bouton pleine largeur (pages détail).
 */
export function FavoriteButton({
  active = false,
  onToggle,
  className = '',
  ariaLabel,
  size = 'md',
  variant = 'overlay',
  label,
}) {
  const [burst, setBurst] = useState(false)
  const [pulse, setPulse] = useState(null) // 'in' | 'out'

  const sizeClass = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9'
  const iconClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
  const shapeClass =
    variant === 'overlay' ? 'rounded-full' : 'rounded-xl'

  const catalogIdleClass =
    'border-2 border-[var(--app-border)] bg-white text-[var(--app-text-muted)] hover:border-brand-300 dark:bg-[var(--app-surface)]'
  const catalogActiveClass =
    'border-2 border-red-400 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 dark:border-red-600 dark:bg-red-950/40 dark:text-red-400'

  const variantClass =
    variant === 'overlay'
      ? active
        ? 'bg-rose-600 text-white shadow-lg ring-2 ring-white/40 hover:bg-rose-500'
        : 'bg-black/35 text-white shadow-md ring-1 ring-white/25 backdrop-blur-sm hover:scale-105 hover:bg-black/45'
      : active
        ? catalogActiveClass
        : label
          ? `${catalogIdleClass} hover:bg-white dark:hover:bg-[var(--app-surface)]`
          : catalogIdleClass

  function runPulse(nextActive) {
    if (nextActive) {
      setPulse('in')
      setBurst(true)
      window.setTimeout(() => setBurst(false), 520)
    } else {
      setPulse('out')
    }
    window.setTimeout(() => setPulse(null), 420)
  }

  function handleClick(event) {
    event.preventDefault()
    event.stopPropagation()
    runPulse(!active)
    onToggle?.(event)
  }

  const burstNodes = burst
    ? BURST_DOTS.map((dot, index) => (
        <span
          key={index}
          className="favorite-burst-dot"
          style={{
            '--burst-x': `${dot.x}px`,
            '--burst-y': `${dot.y}px`,
            animationDelay: `${dot.delay}ms`,
          }}
          aria-hidden="true"
        />
      ))
    : null

  const heart = (
    <span className="relative inline-grid place-items-center">
      <FiHeart
        className={`${label ? 'text-base' : iconClass} transition-transform duration-300 ${
          active ? 'fill-current' : ''
        } ${pulse === 'in' ? 'favorite-heart--bounce' : ''}`}
        aria-hidden="true"
      />
      {burstNodes}
    </span>
  )

  if (label != null) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel || (active ? 'Retirer des favoris' : 'Ajouter aux favoris')}
        aria-pressed={active}
        className={`btn-press favorite-btn relative inline-flex min-h-11 items-center justify-center gap-2 overflow-visible rounded-[0.75rem] px-5 text-sm font-semibold transition ${variantClass} ${
          pulse === 'in' ? 'favorite-btn--pop' : ''
        } ${pulse === 'out' ? 'favorite-btn--shrink' : ''} ${className}`}
      >
        {heart}
        <span>{typeof label === 'string' ? label : active ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel || (active ? 'Retirer des favoris' : 'Ajouter aux favoris')}
      aria-pressed={active}
      className={`favorite-btn pointer-events-auto grid place-items-center overflow-visible ${shapeClass} transition-all duration-200 active:scale-90 ${sizeClass} ${variantClass} ${
        pulse === 'in' ? 'favorite-btn--pop' : ''
      } ${pulse === 'out' ? 'favorite-btn--shrink' : ''} ${className}`}
    >
      {heart}
    </button>
  )
}
