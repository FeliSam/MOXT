import { FiChevronRight, FiEdit3 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { profileInitials, roleLabels } from '../profilePageConfig'

export function ProfileHeroCard({ profileCompletion, user }) {
  const variant = user.verified ? 'verified' : 'featured'

  return (
    <Card variant={variant} className="relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="size-20 shrink-0 rounded-[var(--radius-card)] border border-[var(--app-border)] object-cover shadow-[var(--shadow-card)]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid size-20 shrink-0 place-items-center rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-2xl font-black text-[var(--app-accent)] dark:text-[var(--app-teal)]"
          >
            {profileInitials(user.firstName, user.lastName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
            Profil MOXT
          </p>
          <h1 className="font-display mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[var(--app-text)]">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 truncate text-sm text-[var(--app-text-muted)]">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{roleLabels[user.role] || user.role}</Badge>
            {user.verified ? <VerifiedBadge /> : <Badge tone="warning">À vérifier</Badge>}
          </div>
        </div>

        <Link
          to="/profile/information"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] shadow-[var(--shadow-card)] transition-colors duration-[var(--transition-fast)] hover:border-brand-200 hover:bg-[var(--app-surface-muted)] dark:hover:border-brand-800"
        >
          <FiEdit3 aria-hidden="true" />
          Modifier
        </Link>
      </div>

      {!user.verified ? (
        <Link
          to="/verification"
          className="relative z-10 mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
        >
          <span>Renforcez la confiance — complétez votre vérification</span>
          <FiChevronRight className="shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      <div className="relative z-10 mt-5 border-t border-[var(--app-border)] pt-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--app-text-muted)]">
          <span>Profil complété</span>
          <span className="tabular-nums text-[var(--app-text)]">{profileCompletion}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]"
          role="progressbar"
          aria-label="Complétion du profil"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={profileCompletion}
        >
          <div
            className="h-full rounded-full bg-[var(--app-accent)] transition-all duration-500 dark:bg-[var(--app-teal)]"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        {profileCompletion < 100 ? (
          <Link
            to="/profile/information"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Compléter mon profil
            <FiChevronRight className="text-sm" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </Card>
  )
}
