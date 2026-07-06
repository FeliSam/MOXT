import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Input } from './Input'

/**
 * Champ mot de passe avec bouton afficher/masquer.
 * Accepte les mêmes props qu'Input — juste `type` est géré en interne.
 */
export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`pr-11 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute bottom-0 right-3 top-0 mt-[1.65rem] flex items-center text-[var(--app-text-faint)] transition hover:text-[var(--app-text-muted)]"
      >
        {visible ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
      </button>
    </div>
  )
}
