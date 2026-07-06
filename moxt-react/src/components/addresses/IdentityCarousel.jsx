import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import { OWNER_TYPE_LABELS } from '../../types/identityEnums'

export function IdentityCarousel({ items, onSelect, selectedId }) {
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
        Aucun profil d&apos;identité. Créez-en un dans l&apos;onglet Identité.
      </p>
    )
  }

  const title =
    current.ownerType === 'COMPANY'
      ? current.identity.companyName || 'Société'
      : `${current.identity.firstNames || ''} ${current.identity.lastName || ''}`.trim()

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
          onClick={() => go(-1)}
          aria-label="Profil précédent"
        >
          <FiChevronLeft />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-bold">{title || 'Profil'}</p>
          <p className="text-xs text-[var(--app-text-muted)]">
            {OWNER_TYPE_LABELS[current.ownerType]} · {current.identity.passportNumber}
          </p>
          <p className="mt-1 text-[10px] text-[var(--app-text-faint)]">
            {clampedIndex + 1} / {items.length}
          </p>
        </div>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
          onClick={() => go(1)}
          aria-label="Profil suivant"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}
