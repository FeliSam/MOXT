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

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${label} : ${value} sur 5` : label}
    >
      {stars.map((star) => {
        const active = star <= value
        if (readOnly) {
          return (
            <FiStar
              key={star}
              className={`${iconClass} ${active ? 'fill-amber-400 text-amber-400' : 'text-[var(--app-border)]'}`}
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
            className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-teal)]"
            onClick={() => onChange?.(star)}
            onMouseEnter={(event) => {
              const buttons = event.currentTarget.parentElement?.querySelectorAll('button')
              buttons?.forEach((button, index) => {
                button.querySelector('svg')?.classList.toggle('fill-amber-300', index < star)
                button.querySelector('svg')?.classList.toggle('text-amber-400', index < star)
              })
            }}
            onMouseLeave={(event) => {
              const buttons = event.currentTarget.parentElement?.querySelectorAll('button')
              buttons?.forEach((button, index) => {
                const activeStar = index < value
                button.querySelector('svg')?.classList.toggle('fill-amber-400', activeStar)
                button.querySelector('svg')?.classList.toggle('text-amber-400', activeStar)
                button.querySelector('svg')?.classList.toggle('text-[var(--app-border)]', !activeStar)
              })
            }}
          >
            <FiStar
              className={`${iconClass} ${
                active ? 'fill-amber-400 text-amber-400' : 'text-[var(--app-border)]'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
