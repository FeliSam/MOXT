import { useId, useState } from 'react'
import { useLanguage } from '../../contexts/useLanguage'
import { Button } from './Button'
import { Modal } from './Modal'
import { PasswordInput } from './PasswordInput'

/**
 * Modal générique demandant à l'utilisateur connecté de retaper son mot de
 * passe avant une action sensible (ex. changement de rôle admin). `onConfirm`
 * reçoit le mot de passe saisi et doit vérifier/agir ; en cas d'échec,
 * définir `error` pour l'afficher sans fermer la modale.
 */
export function PasswordConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  error,
  onCancel,
  onConfirm,
}) {
  const { t } = useLanguage()
  const inputId = useId()
  const [password, setPassword] = useState('')
  // Vide le champ à chaque (ré)ouverture — calculé pendant le rendu plutôt
  // que dans un effet, pour éviter un flash avec le mot de passe précédent.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setPassword('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!password || loading) return
    onConfirm(password)
  }

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {description ? (
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
        ) : null}
        <PasswordInput
          id={inputId}
          label={t('common.passwordConfirm.label')}
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading} disabled={!password || loading}>
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
