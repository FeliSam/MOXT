import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiRefreshCw,
  FiStar,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../contexts/useLanguage'
import { monthlyBonusPoolForPlan } from '../features/stars/starsConfig'
import { StarsPricingGuide } from '../features/stars/StarsPricingGuide'
import { historyEntryMeta, normalizeStarsHistory } from '../features/stars/starsHistoryUtils'
import { loadStarsBalance, loadStarsCatalog, loadStarsHistory } from '../features/stars/starsSlice'
import { formatStarsPeriod, resolveWalletDisplay } from '../features/stars/starsWalletUi'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'

const HISTORY_PAGE_SIZE = 10

function WalletSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-44 animate-pulse rounded-[1.75rem] bg-[var(--app-surface-muted)]" />
      <div className="h-28 animate-pulse rounded-2xl bg-[var(--app-surface-muted)]" />
    </div>
  )
}

function HistoryRow({ item, t, packages }) {
  const meta = historyEntryMeta(item, t, packages)
  const timeLabel = item.created_at
    ? new Date(item.created_at).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <li className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3 py-2.5 shadow-sm">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
          meta.isCredit
            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
            : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
        }`}
      >
        {meta.isCredit ? (
          <FiArrowDownLeft className="text-base" aria-hidden />
        ) : (
          <FiArrowUpRight className="text-base" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-sm font-black tabular-nums ${
              meta.isCredit ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            {meta.isCredit ? '+' : '−'}
            {meta.amount}★
          </span>
          <span className="truncate text-sm font-semibold text-[var(--app-text)]">{meta.headline}</span>
        </p>
        {meta.detail ? (
          <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">{meta.detail}</p>
        ) : null}
      </div>
      <time className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--app-text-faint)]">
        {timeLabel}
      </time>
    </li>
  )
}

function PoolMeter({ label, remaining, quota, t }) {
  const usedPct =
    quota > 0 ? Math.min(100, Math.round(((quota - remaining) / quota) * 100)) : 0
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="text-white/75">{label}</span>
        <span className="tabular-nums text-white">
          {remaining}/{quota} ★
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-emerald-300/90 transition-all"
          style={{ width: `${100 - usedPct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-white/70">{t('stars.bonusPoolPeriodHint')}</p>
    </div>
  )
}

function BalanceSplitBar({ personalBonus, businessBonus, paid, linkedBusiness, t }) {
  const bonus = personalBonus + (linkedBusiness ? businessBonus : 0)
  const total = bonus + paid
  const bonusPct = total > 0 ? Math.round((bonus / total) * 100) : 0
  const paidPct = total > 0 ? Math.max(0, 100 - bonusPct) : 0

  return (
    <div className="mt-5">
      {total > 0 ? (
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/20">
          {bonus > 0 ? (
            <div
              className="bg-emerald-300/90 transition-all"
              style={{ width: `${bonusPct}%` }}
              title={t('stars.walletSplitPersonalBonus', { n: bonus })}
            />
          ) : null}
          {paid > 0 ? (
            <div
              className="bg-white/95 transition-all"
              style={{ width: `${paidPct}%` }}
              title={t('stars.walletSplitPaid', { n: paid })}
            />
          ) : null}
        </div>
      ) : (
        <div className="h-2.5 rounded-full bg-white/15" />
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
            <FiStar className="text-xs" aria-hidden />
            {linkedBusiness ? t('stars.totalBonus') : t('stars.bonusPoolShort')}
          </p>
          <p className="mt-0.5 font-display text-xl font-black tabular-nums">
            {bonus}
            <span className="ml-1 text-sm font-bold text-white/65">★</span>
          </p>
          {linkedBusiness ? (
            <p className="mt-0.5 text-[10px] font-semibold text-white/65">
              {t('stars.bonusPoolCombinedHint', {
                personal: personalBonus,
                business: businessBonus,
              })}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
            <FiStar className="text-xs" aria-hidden />
            {t('stars.paidBalance')}
          </p>
          <p className="mt-0.5 font-display text-xl font-black tabular-nums">
            {paid}
            <span className="ml-1 text-sm font-bold text-white/65">★</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function StarsWalletPage() {
  const { t, language } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const ownedBusiness = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses?.items || [], state.auth.user?.id),
  )
  const { balance, transactions, packages, status, error } = useSelector((state) => state.stars)

  useEffect(() => {
    dispatch(loadStarsCatalog())
    dispatch(loadStarsBalance({ ownerType: 'user', ownerId: user?.id }))
    dispatch(loadStarsHistory({ ownerType: 'user', ownerId: user?.id, limit: 50 }))
  }, [dispatch, ownedBusiness?.id, user?.id])

  const enforced = Boolean(balance?.enforced)
  const wallet = resolveWalletDisplay(balance, { monthlyQuotaForPlan: monthlyBonusPoolForPlan })
  const {
    paid: paidBalance,
    personalBonus,
    businessBonus,
    linkedBusiness,
    total: totalAvailable,
    personalQuota,
    businessQuota,
    bonusQuota,
  } = wallet
  const periodLabel = formatStarsPeriod(balance?.period, language || 'fr')
  const historyItems = useMemo(() => normalizeStarsHistory(transactions), [transactions])
  const historyPageCount = Math.max(1, Math.ceil(historyItems.length / HISTORY_PAGE_SIZE) || 1)
  const [historyPage, setHistoryPage] = useState(1)
  const safeHistoryPage = Math.min(historyPage, historyPageCount)
  const pagedHistory = useMemo(() => {
    const start = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE
    return historyItems.slice(start, start + HISTORY_PAGE_SIZE)
  }, [historyItems, safeHistoryPage])
  const historyFrom = historyItems.length ? (safeHistoryPage - 1) * HISTORY_PAGE_SIZE + 1 : 0
  const historyTo = Math.min(safeHistoryPage * HISTORY_PAGE_SIZE, historyItems.length)
  const loadingBalance = status === 'loading' && !balance

  function refresh() {
    dispatch(loadStarsBalance({ ownerType: 'user', ownerId: user?.id }))
    dispatch(loadStarsHistory({ ownerType: 'user', ownerId: user?.id, limit: 50 }))
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 pb-4">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-amber-500 via-brand-600 to-violet-700 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="pointer-events-none absolute -left-8 -top-10 size-40 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-12 -right-8 size-48 rounded-full bg-violet-300/20 blur-3xl" aria-hidden />
        <FiStar className="pointer-events-none absolute right-4 top-4 text-5xl text-white/12" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">
              {t('stars.eyebrow')}
            </p>
            <h1 className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl">
              {t('stars.walletTitle')}
            </h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading'}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-60"
            aria-label={t('stars.refresh')}
          >
            <FiRefreshCw className={`text-lg ${status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            {t('stars.totalAvailable')}
          </p>
          <p className="font-display text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
            {loadingBalance ? '…' : totalAvailable}
            <span className="ml-1 text-2xl font-bold text-white/75">★</span>
          </p>
          {periodLabel ? (
            <p className="mt-1 text-[11px] font-semibold text-white/65">
              {t('stars.periodLabel', { period: periodLabel })}
            </p>
          ) : null}
        </div>

        <BalanceSplitBar
          personalBonus={personalBonus}
          businessBonus={businessBonus}
          paid={paidBalance}
          linkedBusiness={linkedBusiness}
          t={t}
        />

        {enforced && bonusQuota > 0 ? (
          <div className="relative mt-4 grid gap-2">
            <PoolMeter
              label={linkedBusiness ? t('stars.personalBonusPool') : t('stars.bonusPoolSection')}
              remaining={personalBonus}
              quota={personalQuota}
              t={t}
            />
            {linkedBusiness ? (
              <PoolMeter
                label={t('stars.businessBonusPool')}
                remaining={businessBonus}
                quota={businessQuota}
                t={t}
              />
            ) : null}
          </div>
        ) : null}

        <div className="relative mt-4">
          <Link to="/stars/buy" className="block">
            <Button
              icon={FiStar}
              className="w-full !border-white/20 !bg-white !text-brand-800 shadow-lg hover:!bg-white/95"
            >
              {t('stars.buyCta')}
            </Button>
          </Link>
        </div>
      </section>

      {loadingBalance ? <WalletSkeleton /> : null}

      {status === 'error' ? (
        <Card className="flex items-start gap-3 border-rose-200/80 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" aria-hidden />
          <p>{error || t('stars.offline')}</p>
        </Card>
      ) : null}

      {!enforced && balance ? (
        <Card className="flex items-start gap-3 border-brand-200/70 bg-brand-50/70 p-4 dark:border-brand-900/40 dark:bg-brand-950/25">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-700 dark:text-brand-300">
            <FiInfo className="text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-brand-900 dark:text-brand-100">
              {t('stars.comingSoonTitle')}
            </p>
            <p className="mt-1 text-sm text-brand-800/85 dark:text-brand-200/85">{t('stars.comingSoon')}</p>
          </div>
        </Card>
      ) : null}

      {balance ? (
        <>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)]/70 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-black">{t('stars.historyTitle')}</h2>
              {historyItems.length ? (
                <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black tabular-nums text-[var(--app-text-muted)]">
                  {historyItems.length}
                </span>
              ) : null}
            </div>
            <div className="p-4">
              {!historyItems.length ? (
                <div className="grid place-items-center gap-2 py-6 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]">
                    <FiStar className="text-xl" aria-hidden />
                  </span>
                  <p className="text-sm text-[var(--app-text-muted)]">{t('stars.historyEmpty')}</p>
                  <Link
                    to="/stars/buy"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-700"
                  >
                    {t('stars.buyCta')}
                    <FiChevronRight aria-hidden />
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="grid grid-cols-1 gap-2">
                    {pagedHistory.map((item) => (
                      <HistoryRow key={item.id} item={item} t={t} packages={packages} />
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)]/70 pt-3">
                    <p className="text-xs font-bold tabular-nums text-[var(--app-text-muted)]">
                      {t('stars.historyPageRange', {
                        from: historyFrom,
                        to: historyTo,
                        total: historyItems.length,
                      })}
                    </p>
                    {historyPageCount > 1 ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={FiChevronLeft}
                          disabled={safeHistoryPage <= 1}
                          onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                        >
                          {t('stars.historyPrev')}
                        </Button>
                        <span className="min-w-10 text-center text-xs font-black tabular-nums text-[var(--app-text-muted)]">
                          {safeHistoryPage}/{historyPageCount}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          iconRight={FiChevronRight}
                          disabled={safeHistoryPage >= historyPageCount}
                          onClick={() => setHistoryPage((page) => Math.min(historyPageCount, page + 1))}
                        >
                          {t('stars.historyNext')}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </Card>

          <StarsPricingGuide
            config={balance.config}
            ownerType="user"
            linkedBusiness={linkedBusiness}
          />
        </>
      ) : null}
    </div>
  )
}
