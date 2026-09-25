import { useState } from 'react'
import { FiChevronRight, FiEdit2, FiEdit3 } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { ReferralShareButton } from '../../referral/ReferralShareButton'
import { avatarDisplayUrl } from '../../account/avatarDisplayUrl'
import { AvatarBadge } from '../../account/avatarDicebear/AvatarBadge'
import { AvatarDicebearEditorLazy } from '../../account/avatarDicebear/AvatarDicebearEditorLazy'
import { useLoreleiFallbackSrc } from '../../account/avatarDicebear/useLoreleiFallbackSrc'
import { profileInitials, roleLabelKeys } from '../profilePageConfig'

export function ProfileHeroCard({ profileCompletion, user }) {
  const { t } = useLanguage()
  const variant = user.verified ? 'verified' : 'featured'
  const displayName = `${user.firstName} ${user.lastName}`.trim()
  const roleKey = roleLabelKeys[user.role]
  const roleLabel = roleKey ? t(roleKey) : user.role
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false)
  const loreleiSrc = useLoreleiFallbackSrc(user, { size: 160 })
  const loreleiUrl = useSelector(
    (state) => state.account.preferences?.[user.id]?.avatarDicebear?.avatarUrl,
  )

  return (
    <Card variant={variant} className="relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start justify-between gap-3 sm:contents">
          <div className="relative shrink-0">
            {user.avatarUrl || loreleiSrc ? (
              <img
                src={user.avatarUrl ? avatarDisplayUrl(user.avatarUrl, { width: 160 }) : loreleiSrc}
                alt={displayName}
                className="size-20 shrink-0 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] object-cover shadow-[var(--shadow-card)]"
              />
            ) : (
              <div
                aria-hidden="true"
                className="grid size-20 shrink-0 place-items-center rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-2xl font-black text-[var(--app-accent)] dark:text-[var(--app-teal)]"
              >
                {profileInitials(user.firstName, user.lastName)}
              </div>
            )}
            <AvatarBadge url={user.avatarUrl} loreleiUrl={loreleiUrl} className="-top-2" />
            <button
              type="button"
              onClick={() => setAvatarEditorOpen(true)}
              aria-label={t('profile.avatarEditor.openAria')}
              title={t('profile.avatarEditor.open')}
              className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-2 border-[var(--app-surface)] bg-brand-700 text-white shadow-md transition hover:scale-105 hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] dark:bg-[var(--app-teal)] dark:text-slate-950"
            >
              <FiEdit2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <ReferralShareButton compact className="sm:hidden" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[var(--app-text)]">
            <VerifiedDisplayName
              name={displayName}
              verified={Boolean(user.verified)}
              iconSize="md"
            />
          </h1>
          <p className="mt-1 truncate text-sm text-[var(--app-text-muted)]">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{roleLabel}</Badge>
            {!user.verified ? <Badge tone="warning">{t('profile.hero.unverifiedBadge')}</Badge> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start sm:flex-col sm:items-end lg:flex-row lg:items-center">
          <ReferralShareButton compact className="hidden sm:block" />
          <Link
            to="/profile/information"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] shadow-[var(--shadow-card)] transition-colors duration-[var(--transition-fast)] hover:border-brand-200 hover:bg-[var(--app-surface-muted)] dark:hover:border-brand-800"
          >
            <FiEdit3 aria-hidden="true" />
            {t('profile.hero.edit')}
          </Link>
        </div>
      </div>

      {!user.verified ? (
        <Link
          to="/verification"
          className="relative z-10 mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
        >
          <span>{t('profile.hero.verifyCta')}</span>
          <FiChevronRight className="shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      <div className="relative z-10 mt-5 border-t border-[var(--app-border)] pt-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--app-text-muted)]">
          <span>{t('profile.hero.completionLabel')}</span>
          <span className="tabular-nums text-[var(--app-text)]">{profileCompletion}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]"
          role="progressbar"
          aria-label={t('profile.hero.completionAria')}
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
            {t('profile.hero.completeLink')}
            <FiChevronRight className="text-sm" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <AvatarDicebearEditorLazy
        open={avatarEditorOpen}
        onClose={() => setAvatarEditorOpen(false)}
      />
    </Card>
  )
}
