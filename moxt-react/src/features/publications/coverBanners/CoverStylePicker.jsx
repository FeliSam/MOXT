import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
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
 * Owner bottom sheet to pick a Moxt premium empty-cover style.
 * category: 'business' | 'personal'
 * For personal without gender, shows Homme / Femme tabs (defaults Homme).
 * Select a style then Appliquer to persist.
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
  applyLabel = 'Appliquer',
  manLabel = 'Homme',
  womanLabel = 'Femme',
  activeLabel = 'Actif',
  closeLabel = 'Fermer',
}) {
  const knownGender = normalizeProfileGender(gender)
  const [genderTab, setGenderTab] = useState(knownGender === 'female' ? 'woman' : 'man')
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!open) return
    setDraft(value)
    setGenderTab(
      knownGender === 'female'
        ? 'woman'
        : knownGender === 'male'
          ? 'man'
          : value && WOMAN_COVER_STYLES.includes(value)
            ? 'woman'
            : 'man',
    )
  }, [open, value, knownGender])

  const styleIds = useMemo(() => {
    if (category === 'business') return BUSINESS_COVER_STYLES
    if (category === 'personal') {
      if (knownGender === 'female') return WOMAN_COVER_STYLES
      if (knownGender === 'male') return MAN_COVER_STYLES
      return genderTab === 'woman' ? WOMAN_COVER_STYLES : MAN_COVER_STYLES
    }
    return stylesForCategory(category)
  }, [category, genderTab, knownGender])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, open])

  if (!open) return null

  const showGenderTabs = category === 'personal' && !knownGender

  const sheet = (
    <div className="fixed inset-0 z-[var(--z-modal)] overscroll-none">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={() => onClose?.()}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px] dark:bg-black/45"
      />

      <div className="absolute inset-x-0 bottom-0 grid max-h-[min(90dvh,44rem)] place-items-stretch p-0 sm:inset-0 sm:place-items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="scrollbar-hidden flex w-full max-h-[min(90dvh,44rem)] flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-[var(--app-border)]/80 bg-[var(--app-surface)] shadow-[var(--shadow-card-lg)] sm:max-w-lg sm:rounded-[1.5rem] sm:border-b"
          data-navbar-ignore
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--app-border-md)] sm:hidden" aria-hidden />

          <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-3 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-[var(--app-text)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">{hint}</p>
            </div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
              aria-label={closeLabel}
            >
              <FiX />
            </button>
          </header>

          <div className="scrollbar-hidden grid flex-1 gap-4 overflow-y-auto overscroll-contain px-5 pb-3 sm:px-6">
            {showGenderTabs ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={genderTab === 'man' ? 'primary' : 'secondary'}
                  className="flex-1"
                  onClick={() => setGenderTab('man')}
                >
                  {manLabel}
                </Button>
                <Button
                  type="button"
                  variant={genderTab === 'woman' ? 'primary' : 'secondary'}
                  className="flex-1"
                  onClick={() => setGenderTab('woman')}
                >
                  {womanLabel}
                </Button>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {styleIds.map((styleId) => {
                const selected = draft === styleId
                return (
                  <button
                    key={styleId}
                    type="button"
                    onClick={() => setDraft(styleId)}
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
                          {activeLabel}
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="shrink-0 border-t border-[var(--app-border)]/70 px-5 py-3 sm:px-6"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <Button
              type="button"
              className="w-full"
              disabled={!draft}
              onClick={() => {
                if (!draft) return
                if (draft !== value) onChange?.(draft)
                onClose?.()
              }}
            >
              {applyLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(sheet, document.body) : sheet
}

/** Compact trigger + sheet for forms / setup. */
export function CoverStylePickerField({
  category = 'business',
  value,
  gender,
  onChange,
  labels = COVER_STYLE_LABELS_FR,
  buttonLabel = 'Choisir un style Moxt',
  disabled = false,
  title,
  hint,
  applyLabel,
  manLabel,
  womanLabel,
  activeLabel,
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
        title={title}
        hint={hint}
        applyLabel={applyLabel}
        manLabel={manLabel}
        womanLabel={womanLabel}
        activeLabel={activeLabel}
      />
    </div>
  )
}
