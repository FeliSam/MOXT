import { FiCheckCircle, FiLock, FiShield } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'

export function ProfileSecuritySummary({ verified }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
            <FiShield aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold text-[var(--app-text)]">Sécurité du compte</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              Session, vérification et protection de vos données.
            </p>
          </div>
        </div>
        <Link
          to="/security"
          className="shrink-0 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          Gérer la sécurité
        </Link>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
          <FiCheckCircle className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="text-[var(--app-text-muted)]">Session persistante active</span>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
          <FiLock className="shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
          <span className="text-[var(--app-text-muted)]">Mot de passe non stocké en session</span>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 sm:col-span-2">
          <FiShield className="shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
          <span className="text-[var(--app-text-muted)]">
            {verified
              ? 'Identité vérifiée — badge de confiance actif sur votre profil'
              : 'Identité non vérifiée — complétez la vérification pour débloquer le badge'}
          </span>
        </div>
      </div>
    </Card>
  )
}
