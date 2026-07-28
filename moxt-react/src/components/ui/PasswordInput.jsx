import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Input } from './Input'

/**
 * Champ mot de passe avec œil ancré dans le champ (via iconRight),
 * sans chevaucher l’icône d’erreur ni dériver quand le message d’erreur apparaît.
 */
export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  const eye = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      className="grid size-8 place-items-center rounded-lg text-[var(--app-text-faint)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text-muted)]"
    >
      {visible ? <FiEyeOff className="text-base" aria-hidden="true" /> : <FiEye className="text-base" aria-hidden="true" />}
    </button>
  )

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      iconRight={eye}
      className={className}
    />
  )
}
