import { useLayoutEffect, useRef, useState } from 'react'

export function Tabs({ active, items, onChange, label = 'Onglets' }) {
  const listRef = useRef(null)
  const tabRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const activeIndex = items.findIndex((item) => item.value === active)

  useLayoutEffect(() => {
    function update() {
      const el = activeIndex >= 0 ? tabRefs.current[activeIndex] : null
      const list = listRef.current
      if (!el || !list) {
        setIndicator((current) => ({ ...current, ready: false }))
        return
      }
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active, activeIndex, items])

  function handleKeyDown(event, index) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
    onChange(items[nextIndex].value)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      ref={listRef}
      className="relative flex gap-1 overflow-x-auto rounded-2xl bg-[var(--app-surface-muted)] p-1"
      role="tablist"
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 rounded-xl bg-[var(--app-surface)] shadow-sm transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {items.map((item, index) => (
        <button
          key={item.value}
          ref={(node) => {
            tabRefs.current[index] = node
          }}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          tabIndex={active === item.value ? 0 : -1}
          onClick={() => onChange(item.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`relative z-[1] whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
            active === item.value
              ? 'text-brand-700 dark:text-brand-300'
              : 'text-[var(--app-text-muted)]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
