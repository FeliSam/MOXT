import { useEffect, useRef, useState } from 'react'

function isAlreadyInViewport(node) {
  const rect = node.getBoundingClientRect()
  if (rect.width <= 0 && rect.height <= 0) return false
  const vh = window.innerHeight || document.documentElement.clientHeight || 0
  const vw = window.innerWidth || document.documentElement.clientWidth || 0
  return rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw
}

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

    const show = () => setVisible(true)

    if (!window.IntersectionObserver) {
      requestAnimationFrame(show)
      return undefined
    }

    // Fallback: overflow-x-clip ancestors can make the first IO callback miss
    // elements that are already on screen (Guide grid, etc.).
    if (isAlreadyInViewport(node)) {
      show()
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show()
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

    const rafId = requestAnimationFrame(() => {
      if (isAlreadyInViewport(node)) {
        show()
        observer.disconnect()
      }
    })

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
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
