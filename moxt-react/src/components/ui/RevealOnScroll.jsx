import { useEffect, useRef, useState } from 'react'

export function RevealOnScroll({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  once = true,
  threshold = 0.12,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
  )

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return undefined

    if (!window.IntersectionObserver) {
      requestAnimationFrame(() => setVisible(true))
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          setVisible(false)
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold,
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, threshold, visible])

  return (
    <Component
      ref={ref}
      className={`reveal-on-scroll ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Component>
  )
}
