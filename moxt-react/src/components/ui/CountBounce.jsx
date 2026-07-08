import { useEffect, useRef, useState } from 'react'

/**
 * Affiche un compteur avec bounce quand la valeur change.
 * Si `animateFrom` est true, anime aussi l'entrée initiale (count-up court).
 */
export function CountBounce({
  value,
  maxDisplay = 9,
  className = '',
  as: Tag = 'span',
}) {
  const prev = useRef(value)
  const [bump, setBump] = useState(false)
  const display = value > maxDisplay ? `${maxDisplay}+` : String(value)

  useEffect(() => {
    if (prev.current === value) return
    setBump(true)
    prev.current = value
    const t = setTimeout(() => setBump(false), 380)
    return () => clearTimeout(t)
  }, [value])

  if (!value) return null

  return (
    <Tag className={`count-bounce ${bump ? 'count-bounce--active' : ''} ${className}`}>
      {display}
    </Tag>
  )
}
