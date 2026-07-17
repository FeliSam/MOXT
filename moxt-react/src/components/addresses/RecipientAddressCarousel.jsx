import { FiChevronLeft, FiChevronRight, FiEdit2, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

const HOLDER_LABEL_KEYS = {
  PERSON: 'addresses.holder.person',
  COMPANY: 'addresses.holder.company',
}

export function RecipientAddressCarousel({
  items,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) {
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
      <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-6 text-center">
        <p className="text-sm text-[var(--app-text-muted)]">{p3('addresses.recipient.empty')}</p>
        <Button type="button" className="mt-4" icon={FiPlus} onClick={onAdd}>
          {p3('addresses.recipient.add')}
        </Button>
      </div>
    )
  }

  const identityLine =
    current.ownerType === 'COMPANY'
      ? current.identity?.companyName
      : `${current.identity?.firstNames || ''} ${current.identity?.lastName || ''}`.trim()

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
            onClick={() => go(-1)}
            aria-label={p3('addresses.recipient.prev')}
          >
            <FiChevronLeft />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="flex items-center justify-center gap-1 font-black">
              <FiMapPin className="text-brand-600" />
              {current.label}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {current.city}, {current.country}
            </p>
            <p className="mt-2 text-xs">{current.addressLine}</p>
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              {p3(HOLDER_LABEL_KEYS[current.ownerType])}
              {identityLine ? ` · ${identityLine}` : ''}
            </p>
            <p className="mt-1 text-[10px] text-[var(--app-text-faint)]">
              {clampedIndex + 1} / {items.length}
            </p>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface)] shadow-sm"
            onClick={() => go(1)}
            aria-label={p3('addresses.recipient.next')}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" icon={FiPlus} onClick={onAdd}>
          {p3('common.add')}
        </Button>
        <Button type="button" variant="secondary" icon={FiEdit2} onClick={() => onEdit?.(current)}>
          {p3('common.edit')}
        </Button>
        <Button
          type="button"
          variant="danger"
          icon={FiTrash2}
          onClick={() => {
            if (window.confirm(p3('addresses.recipient.deleteConfirm'))) onDelete?.(current.id)
          }}
        >
          {p3('common.delete')}
        </Button>
      </div>
    </div>
  )
}
