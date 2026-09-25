import { useEffect, useRef, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { Button } from './Button'
import { Modal } from './Modal'

const DANGER_CONFIRM_CLASS =
  '!bg-red-600 !text-white shadow-none hover:!bg-red-700 active:!bg-red-800 dark:!bg-red-500 dark:!text-white dark:hover:!bg-red-400'

function translateOr(t, key, fallback) {
  const value = typeof t === 'function' ? t(key) : null
  return value && value !== key ? value : fallback
}

/**
 * Modale de confirmation partagée.
 *
 * - `tone="danger"` (défaut) : bouton rouge plein, pour les actions irréversibles.
 * - `tone="accent"` : bouton primaire ; `accent="personal"` le passe en prune (profil perso),
 *   `accent="business"` garde le vert MOXT (publications entreprise).
 * - `onConfirm` peut renvoyer une promesse : le bouton passe en chargement, les doubles clics
 *   sont ignorés, et une erreur levée est affichée dans la modale (qui reste ouverte).
 * - Échap, clic sur le fond et « Annuler » appellent `onCancel` (sauf pendant l'exécution).
 */
export function ConfirmDialog({
  accent,
  cancelLabel,
  confirmLabel,
  description,
  error: errorProp,
  loading: loadingProp = false,
  onCancel,
  onConfirm,
  open,
  subject,
  subjectLabel,
  title,
  tone = 'danger',
}) {
  const { t } = useLanguage()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const pendingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Réinitialise l'erreur et le chargement à chaque ouverture / fermeture (état dérivé).
  const [lastOpen, setLastOpen] = useState(open)
  if (lastOpen !== open) {
    setLastOpen(open)
    setPending(false)
    setError('')
  }

  const busy = pending || Boolean(loadingProp)
  const shownError = errorProp || error
  const isDanger = tone === 'danger'

  function handleCancel() {
    if (pendingRef.current || loadingProp) return
    onCancel?.()
  }

  async function handleConfirm() {
    if (pendingRef.current || loadingProp) return
    pendingRef.current = true
    setPending(true)
    setError('')
    try {
      await onConfirm?.()
    } catch (err) {
      if (mountedRef.current) {
        setError(
          (typeof err?.message === 'string' && err.message) ||
            translateOr(t, 'confirmDialog.error', "L'action n'a pas pu aboutir. Réessayez."),
        )
      }
    } finally {
      pendingRef.current = false
      if (mountedRef.current) setPending(false)
    }
  }

  return (
    <Modal open={open} onClose={handleCancel} title={title}>
      <div
        data-confirm-dialog=""
        data-confirm-tone={isDanger ? 'danger' : 'accent'}
        data-profile-kind={!isDanger && accent === 'personal' ? 'personal' : undefined}
        aria-busy={busy || undefined}
      >
        {subject ? (
          <div
            className="mb-3 min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-2.5"
            data-confirm-subject=""
          >
            {subjectLabel ? (
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
                {subjectLabel}
              </span>
            ) : null}
            <strong className="block truncate text-sm leading-5 text-[var(--app-text)]">{subject}</strong>
          </div>
        ) : null}
        {description ? (
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
        ) : null}
        {shownError ? (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <FiAlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{shownError}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="secondary" onClick={handleCancel} disabled={busy} className="w-full sm:w-auto">
            {cancelLabel || translateOr(t, 'confirmDialog.cancel', t('common.cancel'))}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            className={`w-full sm:w-auto ${isDanger ? DANGER_CONFIRM_CLASS : ''}`}
            onClick={handleConfirm}
            loading={busy}
            data-confirm-action=""
          >
            {confirmLabel || translateOr(t, 'confirmDialog.confirm', t('common.confirm'))}
          </Button>
        </div>
      </div>
    </Modal>
  )
}