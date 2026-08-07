import { useMemo, useState } from 'react'
import { FiAlertTriangle, FiClock, FiLogOut, FiMessageCircle, FiRefreshCw, FiShield, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Brand } from '../components/layout/Brand'
import { useLanguage } from '../contexts/useLanguage'
import { addToast } from '../features/ui/uiSlice'
import { authService } from '../features/auth/authService'
import { logout, setUser } from '../features/auth/authSlice'
import { markIntentionalSignOut } from '../services/authSessionSync'
import { formatCountdown, resolveAccountStatusContext } from '../utils/accountLifecycleUtils'
import { useLifecycleClock } from '../hooks/useLifecycleClock'

function CountdownBlock({ expiredLabel, label, targetIso }) {
  const now = useLifecycleClock()
  const countdown = useMemo(
    () => (now > 0 ? formatCountdown(targetIso, { now }) : null),
    [targetIso, now],
  )
  if (!countdown) return null

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">{label}</p>
      {countdown.expired ? (
        <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          {expiredLabel}
        </p>
      ) : (
        <p className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight">
          {countdown.days > 0 ? (
            <>
              {countdown.days}
              <span className="ml-1 text-base font-bold text-[var(--app-text-muted)]">j</span>
              <span className="mx-2 text-[var(--app-text-muted)]">·</span>
            </>
          ) : null}
          {countdown.hours}
          <span className="ml-1 text-base font-bold text-[var(--app-text-muted)]">h</span>
          <span className="mx-2 text-[var(--app-text-muted)]">·</span>
          {countdown.minutes}
          <span className="ml-1 text-base font-bold text-[var(--app-text-muted)]">min</span>
        </p>
      )}
    </div>
  )
}

function TimelineStep({ active, done, label, description }) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-black ${
          done
            ? 'bg-emerald-600 text-white'
            : active
              ? 'bg-amber-500 text-white'
              : 'bg-[var(--app-border)] text-[var(--app-text-muted)]'
        }`}
      >
        {done ? '✓' : '•'}
      </span>
      <div className="min-w-0 pb-4">
        <p className={`text-sm font-bold ${active || done ? '' : 'text-[var(--app-text-muted)]'}`}>{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
      </div>
    </div>
  )
}

export function AccountStatusPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const deletionRequest = useSelector((state) =>
    state.account.deletionRequests.find(
      (item) => item.userId === user?.id && item.status === 'requested',
    ),
  )
  const [reopenNote, setReopenNote] = useState('')
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)

  const ctx = useMemo(
    () => resolveAccountStatusContext(user, deletionRequest),
    [user, deletionRequest],
  )

  const isDeletionSource = ctx.source === 'deletion' || Boolean(deletionRequest)

  async function handleReopen() {
    setLoadingAction('reopen')
    try {
      await authService.requestAccountReopening(reopenNote.trim())
      dispatch(
        setUser({
          ...user,
          reopenRequestedAt: new Date().toISOString(),
        }),
      )
      dispatch(
        addToast({
          tone: 'success',
          title: t('settings.accountStatus.reopen.toastTitle'),
          message: t('settings.accountStatus.reopen.toastBody'),
        }),
      )
    } catch (error) {
      dispatch(
        addToast({
          tone: 'danger',
          title: t('settings.accountStatus.errorTitle'),
          message: error?.message || t('settings.accountStatus.errorBody'),
        }),
      )
    } finally {
      setLoadingAction(null)
    }
  }

  async function handlePurge() {
    setLoadingAction('purge')
    try {
      await authService.confirmPermanentDeletion()
      markIntentionalSignOut()
      await dispatch(logout())
    } catch (error) {
      dispatch(
        addToast({
          tone: 'danger',
          title: t('settings.accountStatus.errorTitle'),
          message: error?.message || t('settings.accountStatus.errorBody'),
        }),
      )
      setLoadingAction(null)
    }
  }

  function handleLogout() {
    markIntentionalSignOut()
    dispatch(logout())
  }

  if (!user || user.status !== 'suspended') {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <Link to="/dashboard" className="text-sm font-semibold text-brand-700">
          {t('settings.accountStatus.backToApp')}
        </Link>
      </div>
    )
  }

  return (
    <main className="grid min-h-dvh bg-[var(--app-bg)] lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#7f1d1d_0%,#b45309_42%,#0f766e_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <Brand iconOnly />
        <div className="relative max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
            <FiShield aria-hidden />
            {t('settings.accountStatus.badge')}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight">{t('settings.accountStatus.heroTitle')}</h1>
          <p className="mt-4 text-base leading-7 text-white/80">{t('settings.accountStatus.heroBody')}</p>
        </div>
        <p className="relative text-sm text-white/60">{t('settings.accountStatus.heroFooter')}</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl shadow-black/5">
            <div className="border-b border-[var(--app-border)] bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 dark:from-amber-950/30 dark:to-orange-950/20">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
                  <FiAlertTriangle className="text-xl" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    {isDeletionSource
                      ? t('settings.accountStatus.titleDeletion')
                      : t('settings.accountStatus.titleModeration')}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                    {isDeletionSource
                      ? t('settings.accountStatus.bodyDeletion')
                      : t('settings.accountStatus.bodyModeration')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6">
              <CountdownBlock
                expiredLabel={t('settings.accountStatus.expiredCountdown')}
                label={t('settings.accountStatus.countdownPurge')}
                targetIso={ctx.purgeAt}
              />

              <div className="rounded-2xl border border-[var(--app-border)] p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
                  {t('settings.accountStatus.timelineTitle')}
                </p>
                <TimelineStep
                  done
                  label={t('settings.accountStatus.step.suspended')}
                  description={t('settings.accountStatus.step.suspendedDesc')}
                />
                <TimelineStep
                  active={!ctx.reopenRequested}
                  done={ctx.reopenRequested}
                  label={t('settings.accountStatus.step.grace')}
                  description={t('settings.accountStatus.step.graceDesc')}
                />
                <TimelineStep
                  active={false}
                  done={false}
                  label={t('settings.accountStatus.step.purge')}
                  description={t('settings.accountStatus.step.purgeDesc')}
                />
              </div>

              {ctx.reopenRequested ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <FiRefreshCw className="mb-2 inline text-base" aria-hidden />{' '}
                  {t('settings.accountStatus.reopenPending')}
                </div>
              ) : (
                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]">
                      {t('settings.accountStatus.reopen.label')}
                    </span>
                    <textarea
                      value={reopenNote}
                      onChange={(event) => setReopenNote(event.target.value)}
                      rows={3}
                      placeholder={t('settings.accountStatus.reopen.placeholder')}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </label>
                  <Button
                    icon={FiRefreshCw}
                    loading={loadingAction === 'reopen'}
                    onClick={handleReopen}
                  >
                    {t('settings.accountStatus.reopen.action')}
                  </Button>
                </div>
              )}

              <div className="grid gap-3 border-t border-[var(--app-border)] pt-5">
                <p className="text-xs leading-5 text-[var(--app-text-muted)]">
                  {t('settings.accountStatus.purgeHint')}
                </p>
                <Button
                  variant="danger"
                  icon={FiTrash2}
                  loading={loadingAction === 'purge'}
                  onClick={() => setConfirmPurge(true)}
                >
                  {t('settings.accountStatus.purgeAction')}
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to="/support">
                  <Button variant="secondary" icon={FiMessageCircle}>
                    {t('settings.accountStatus.contactSupport')}
                  </Button>
                </Link>
                <Button variant="ghost" icon={FiLogOut} onClick={handleLogout}>
                  {t('settings.accountStatus.logout')}
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
            <FiClock aria-hidden />
            {t('settings.accountStatus.footerNote')}
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={confirmPurge}
        title={t('settings.accountStatus.purgeConfirmTitle')}
        description={t('settings.accountStatus.purgeConfirmBody')}
        onCancel={() => setConfirmPurge(false)}
        onConfirm={() => {
          setConfirmPurge(false)
          void handlePurge()
        }}
      />
    </main>
  )
}
