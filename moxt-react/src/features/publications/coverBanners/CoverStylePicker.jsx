import { useMemo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import {
  BUSINESS_COVER_STYLES,
  COVER_STYLE_LABELS_FR,
  MAN_COVER_STYLES,
  WOMAN_COVER_STYLES,
  normalizeProfileGender,
  stylesForCategory,
} from './coverBannerCatalog'
import { MoxtCoverBanner } from './MoxtCoverBanner'

/**
 * Owner UI to pick a Moxt premium empty-cover style.
 * category: 'business' | 'personal'
 * For personal without gender, shows Homme / Femme tabs (defaults Homme).
 */
export function CoverStylePicker({
  open,
  onClose,
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  title = 'Style de bannière Moxt',
  hint = 'Visible uniquement sans photo de couverture personnalisée.',
}) {
  const initialGenderTab =
    normalizeProfileGender(gender) === 'female' ? 'woman' : 'man'
  const [genderTab, setGenderTab] = useState(initialGenderTab)

  const styleIds = useMemo(() => {
    if (category === 'business') return BUSINESS_COVER_STYLES
    if (category === 'personal') {
      return genderTab === 'woman' ? WOMAN_COVER_STYLES : MAN_COVER_STYLES
    }
    return stylesForCategory(category)
  }, [category, genderTab])

  return (
    <Modal open={open} onClose={onClose} title={title} size="large">
      <div className="grid gap-4">
        <p className="text-sm text-[var(--app-text-muted)]">{hint}</p>

        {category === 'personal' && !normalizeProfileGender(gender) ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={genderTab === 'man' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => setGenderTab('man')}
            >
              Homme
            </Button>
            <Button
              type="button"
              variant={genderTab === 'woman' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => setGenderTab('woman')}
            >
              Femme
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {styleIds.map((styleId) => {
            const selected = value === styleId
            return (
              <button
                key={styleId}
                type="button"
                onClick={() => {
                  onChange?.(styleId)
                  onClose?.()
                }}
                className={`overflow-hidden rounded-2xl border-2 text-left transition ${
                  selected
                    ? 'border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/30'
                    : 'border-[var(--app-border)] hover:border-[var(--app-accent)]/50'
                }`}
                aria-pressed={selected}
              >
                <div className="relative h-24 w-full">
                  <MoxtCoverBanner styleId={styleId} className="absolute inset-0 h-full w-full" />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm font-semibold text-[var(--app-text)]">
                    {labels[styleId] || styleId}
                  </span>
                  {selected ? (
                    <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[var(--app-accent)]">
                      Actif
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

/** Compact trigger + modal for forms / hero edit. */
export function CoverStylePickerField({
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  buttonLabel = 'Choisir un style Moxt',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-2">
      <div className="relative h-28 overflow-hidden rounded-2xl border border-[var(--app-border)]">
        <MoxtCoverBanner
          styleId={value}
          category={category}
          gender={gender}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <p className="text-xs text-[var(--app-text-muted)]">
        Style actuel : <strong>{labels[value] || value}</strong>
      </p>
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <CoverStylePicker
        open={open}
        onClose={() => setOpen(false)}
        category={category}
        value={value}
        gender={gender}
        onChange={onChange}
        labels={labels}
      />
    </div>
  )
}
