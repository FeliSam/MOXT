import { FiCheck } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'

/**
 * Bouton d’action admin : état « done » avec couleur distincte.
 * `interactive` = l’action reste cliquable (ex. indisponible ↔ restaurer).
 */
export function ActionButton({ done, doneLabel, children, variant, interactive = false, ...props }) {
  if (done) {
    const danger = variant === 'danger'
    return (
      <Button
        type="button"
        variant="secondary"
        disabled={!interactive}
        icon={FiCheck}
        className={
          danger
            ? '!border-rose-300 !bg-rose-50 !text-rose-800 opacity-100 dark:!border-rose-800 dark:!bg-rose-950/40 dark:!text-rose-200'
            : '!border-emerald-300 !bg-emerald-50 !text-emerald-800 opacity-100 dark:!border-emerald-800 dark:!bg-emerald-950/40 dark:!text-emerald-200'
        }
        {...props}
      >
        {interactive ? children : doneLabel || children}
      </Button>
    )
  }
  return (
    <Button type="button" variant={variant} {...props}>
      {children}
    </Button>
  )
}
