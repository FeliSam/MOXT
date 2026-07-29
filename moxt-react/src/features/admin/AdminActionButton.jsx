import { FiCheck } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'

/**
 * Bouton d’action admin : état « done » avec couleur distincte.
 * `interactive` = l’action reste cliquable (ex. indisponible ↔ restaurer).
 *
 * Important: ne pas changer la structure DOM de façon destructrice (évite
 * NotFoundError removeChild quand le navigateur / traduction mute le texte).
 */
export function ActionButton({ done, doneLabel, children, variant, interactive = false, icon, className = '', ...props }) {
  const danger = variant === 'danger'
  const doneClass = danger
    ? '!border-rose-300 !bg-rose-50 !text-rose-800 opacity-100 dark:!border-rose-800 dark:!bg-rose-950/40 dark:!text-rose-200'
    : '!border-emerald-300 !bg-emerald-50 !text-emerald-800 opacity-100 dark:!border-emerald-800 dark:!bg-emerald-950/40 dark:!text-emerald-200'

  return (
    <Button
      type="button"
      variant={done ? 'secondary' : variant}
      disabled={done && !interactive}
      icon={done ? FiCheck : icon}
      className={`${done ? doneClass : ''} ${className}`.trim()}
      {...props}
    >
      <span translate="no" className="inline-flex items-center">
        {done && !interactive ? doneLabel || children : children}
      </span>
    </Button>
  )
}
