import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

const HOLDER_LABEL_KEYS = {
  PERSON: 'addresses.holder.person',
  COMPANY: 'addresses.holder.company',
}

export function IdentityCarousel({ items, onSelect, selectedId }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [index, setIndex] = useState(0)

  const clampedIndex = items.length ? Math.min(index, items.length - 1) : 0
  const current = items[clampedIndex]

  useEffect(() => {
    if (!selectedId || !items.length) return
    const found = items.findIndex((item) => item.id === selectedId)
    if (found >= 0) setIndex(found)
  }, [selectedId, items])

  const go = useCallback(
    (delta) => {
      if (!items.length) return
      const next = (clampedIndex + delta + items.length) % items.length
      setIndex(next)
      onSelect?.(items[next])
    },
    [clampedIndex, items, onSelect],
  )

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--app-border)] p-4 text-center text-sm text-[var(--app-text-muted)]">
        {p3('addresses.carousel.emptyIdentity')}
      </p>
    )
  }

  const title =
    current.ownerType === 'COMPANY'
      ? current.identity.companyName || p3('addresses.identity.company')
      : `${current.identity.firstNames || ''} ${current.identity.lastName || ''}`.trim()

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
          onClick={() => go(-1)}
          aria-label={p3('addresses.carousel.prevProfile')}
        >
          <FiChevronLeft />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-bold">{title || p3('addresses.carousel.profile')}</p>
          <p className="text-xs text-[var(--app-text-muted)]">
            {p3(HOLDER_LABEL_KEYS[current.ownerType])} · {current.identity.passportNumber}
          </p>
          <p className="mt-1 text-[10px] text-[var(--app-text-faint)]">
            {clampedIndex + 1} / {items.length}
          </p>
        </div>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
          onClick={() => go(1)}
          aria-label={p3('addresses.carousel.nextProfile')}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}
