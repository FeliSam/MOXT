export function Tabs({ active, items, onChange, label = 'Onglets' }) {
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
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[nextIndex]?.focus()
  }
  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-2xl bg-[var(--app-surface-muted)] p-1"
      role="tablist"
      aria-label={label}
    >
      {items.map((item, index) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          tabIndex={active === item.value ? 0 : -1}
          onClick={() => onChange(item.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            active === item.value
              ? 'bg-[var(--app-surface)] text-brand-700 shadow-sm dark:text-brand-300'
              : 'text-[var(--app-text-muted)]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
