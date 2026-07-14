const SIZES = {
  sm: 'size-9 text-[11px]',
  md: 'size-11 text-xs',
  lg: 'size-12 text-sm',
}

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

/**
 * Avatar membre / entreprise pour listes d’abonnements.
 * @param {'user'|'business'} [shape]
 */
export function EntityAvatar({
  name = '',
  src,
  size = 'md',
  shape = 'user',
  ring = true,
  className = '',
  alt = '',
}) {
  const sizeClass = SIZES[size] || SIZES.md
  const radius = shape === 'business' ? 'rounded-2xl' : 'rounded-full'
  const ringClass = ring
    ? 'ring-2 ring-[var(--app-surface)] ring-offset-1 ring-offset-[color-mix(in_srgb,var(--app-accent)_35%,transparent)]'
    : ''

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || ''}
        loading="lazy"
        decoding="async"
        className={`shrink-0 object-cover ${sizeClass} ${radius} ${ringClass} ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden={alt ? undefined : true}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      className={`grid shrink-0 place-items-center bg-gradient-to-br from-brand-600 to-[var(--app-teal)] font-black text-white ${sizeClass} ${radius} ${ringClass} ${className}`}
    >
      {initialsFromName(name)}
    </span>
  )
}

export function AvatarStack({ items = [], max = 5, size = 'sm', className = '' }) {
  const visible = items.slice(0, max)
  const overflow = Math.max(0, items.length - max)
  if (!visible.length) return null

  return (
    <div className={`flex items-center ${className}`} aria-hidden="true">
      <div className="flex -space-x-2.5">
        {visible.map((item, index) => (
          <span
            key={item.id || `${item.name}-${index}`}
            className="relative transition-transform duration-200 hover:z-10 hover:-translate-y-0.5"
            style={{ zIndex: visible.length - index }}
          >
            <EntityAvatar
              name={item.name}
              src={item.src}
              size={size}
              shape={item.shape || 'user'}
              ring
            />
          </span>
        ))}
        {overflow > 0 ? (
          <span
            className={`relative z-0 grid shrink-0 place-items-center rounded-full bg-[var(--app-surface-muted)] font-black text-[var(--app-text-muted)] ring-2 ring-[var(--app-surface)] ${SIZES[size] || SIZES.sm}`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
    </div>
  )
}
