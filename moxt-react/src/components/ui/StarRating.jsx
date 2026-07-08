import { useState } from 'react'
import { FiStar } from 'react-icons/fi'

export function StarRating({
  value = 0,
  onChange,
  size = 'md',
  readOnly = false,
  className = '',
  label = 'Note',
}) {
  const stars = [1, 2, 3, 4, 5]
  const iconClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const [hoverValue, setHoverValue] = useState(0)
  const [popIndex, setPopIndex] = useState(null)

  function paint(star) {
    setHoverValue(star)
  }

  function clearPaint() {
    setHoverValue(0)
  }

  function select(star) {
    setPopIndex(star)
    onChange?.(star)
    window.setTimeout(() => setPopIndex(null), 320)
  }

  const displayValue = hoverValue || value

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${label} : ${value} sur 5` : label}
      onMouseLeave={readOnly ? undefined : clearPaint}
    >
      {stars.map((star) => {
        const active = star <= displayValue
        if (readOnly) {
          return (
            <FiStar
              key={star}
              className={`${iconClass} transition-colors duration-200 ${
                active ? 'fill-amber-400 text-amber-400' : 'text-[var(--app-border)]'
              }`}
              aria-hidden="true"
            />
          )
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            className="btn-press rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-teal)]"
            onClick={() => select(star)}
            onMouseEnter={() => paint(star)}
            onFocus={() => paint(star)}
          >
            <FiStar
              className={`${iconClass} transition-all duration-200 ${
                active ? 'fill-amber-400 text-amber-400' : 'text-[var(--app-border)]'
              } ${popIndex != null && star <= popIndex ? 'star-rating-icon--pop' : ''}`}
              style={popIndex != null && star <= popIndex ? { animationDelay: `${(star - 1) * 40}ms` } : undefined}
            />
          </button>
        )
      })}
    </div>
  )
}
