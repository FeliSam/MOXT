import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBriefcase,
  FiChevronRight,
  FiGift,
  FiInfo,
  FiRefreshCw,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../contexts/useLanguage'
import { BONUS_POOL_CATEGORY, monthlyBonusPoolForPlan } from '../features/stars/starsConfig'
import { StarsPricingGuide } from '../features/stars/StarsPricingGuide'
import { historyEntryMeta, normalizeStarsHistory } from '../features/stars/starsHistoryUtils'
import { loadStarsBalance, loadStarsCatalog, loadStarsHistory } from '../features/stars/starsSlice'
import {
  formatStarsPeriod,
  STARS_CATEGORY_META,
} from '../features/stars/starsWalletUi'

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
  const category = meta.poolGrant
    ? t('stars.bonusPoolShort')
    : meta.categoryKey === 'boost'
      ? t('stars.categories.boost')
      : meta.categoryKey && meta.categoryKey !== 'purchase'
        ? t(`stars.categories.${meta.categoryKey}`)
        : null
  const CategoryIcon = meta.poolGrant ? FiGift : STARS_CATEGORY_META[meta.categoryKey]?.icon

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3 py-3 shadow-sm">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          meta.isCredit
            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
            : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
        }`}
      >
        {meta.isCredit ? (
          <FiArrowDownLeft className="text-lg" aria-hidden />
        ) : (
          <FiArrowUpRight className="text-lg" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
          <span className={meta.isCredit ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'}>
            {meta.isCredit ? '+' : '−'}
            {meta.amount}
            <span className="ml-0.5 text-[var(--app-text-muted)]">★</span>
          </span>
          <span className="text-[var(--app-text-muted)]">
            {meta.starType === 'bonus' ? t('stars.bonusPoolShort') : t('stars.paidBalance')}
          </span>
          {category && CategoryIcon ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                meta.poolGrant
                  ? 'bg-brand-500/10 text-brand-800 dark:text-brand-200'
                  : meta.isCredit
                    ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                    : 'bg-amber-500/10 text-amber-900 dark:text-amber-200'
              }`}
            >
              <CategoryIcon className="text-[11px]" aria-hidden />
              {category}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold text-[var(--app-text)]">{meta.headline}</p>
        {meta.detail ? (
          <p className="mt-0.5 truncate text-xs text-[var(--app-text-faint)]">{meta.detail}</p>
        ) : null}
      </div>
      <time className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--app-text-faint)]">
        {item.created_at
          ? new Date(item.created_at).toLocaleString(undefined, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </time>
    </li>
  )
}

function BalanceSplitBar({ bonus, paid, t }) {
  const total = bonus + paid
  const bonusPct = total > 0 ? Math.round((bonus / total) * 100) : 0
  const paidPct = total > 0 ? 100 - bonusPct : 0

  return (
    <div className="mt-5">
      {total > 0 ? (
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/20">
          {bonus > 0 ? (
            <div
              className="bg-emerald-300/90 transition-all"
              style={{ width: `${bonusPct}%` }}
              title={t('stars.walletSplitBonus', { n: bonus })}
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
            <FiGift className="text-xs" aria-hidden />
            {t('stars.bonusPoolShort')}
          </p>
          <p className="mt-0.5 font-display text-xl font-black tabular-nums">
            {bonus}
            <span className="ml-1 text-sm font-bold text-white/65">★</span>
          </p>
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
  const { balance, transactions, packages, status, error } = useSelector((state) => state.stars)
  const [ownerType, setOwnerType] = useState('user')
  const business = useSelector((state) =>
    (state.businesses?.items || []).find((item) => item.ownerId === user?.id),
  )

  useEffect(() => {
    dispatch(loadStarsCatalog())
    dispatch(
      loadStarsBalance({
        ownerType,
        ownerId: ownerType === 'business' ? business?.id : user?.id,
      }),
    )
    dispatch(
      loadStarsHistory({
        ownerType,
        ownerId: ownerType === 'business' ? business?.id : user?.id,
        limit: 50,
      }),
    )
  }, [dispatch, ownerType, business?.id, user?.id])

  const enforced = Boolean(balance?.enforced)
  const bonus = balance?.bonus || {}
  const paidBalance = Number(balance?.paid ?? 0)
  const poolQuota =
    balance?.bonusPoolGranted ??
    balance?.quotas?.[BONUS_POOL_CATEGORY] ??
    balance?.quotas?.pool ??
    monthlyBonusPoolForPlan(ownerType, balance?.config)
  const poolRemaining = Number(balance?.bonusPool ?? bonus?.pool ?? bonus?.[BONUS_POOL_CATEGORY] ?? 0)
  const totalAvailable = paidBalance + poolRemaining
  const periodLabel = formatStarsPeriod(balance?.period, language || 'fr')
  const poolUsedPct =
    poolQuota > 0 ? Math.min(100, Math.round(((poolQuota - poolRemaining) / poolQuota) * 100)) : 0
  const historyItems = useMemo(() => normalizeStarsHistory(transactions), [transactions])
  const loadingBalance = status === 'loading' && !balance

  function refresh() {
    dispatch(
      loadStarsBalance({
        ownerType,
        ownerId: ownerType === 'business' ? business?.id : user?.id,
      }),
    )
    dispatch(
      loadStarsHistory({
        ownerType,
        ownerId: ownerType === 'business' ? business?.id : user?.id,
        limit: 50,
      }),
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4 pb-4">
      {business ? (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[var(--app-surface-muted)] p-1.5 ring-1 ring-[var(--app-border)]/50">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
              ownerType === 'user'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
            onClick={() => setOwnerType('user')}
          >
            <FiUser aria-hidden />
            {t('stars.personalWallet')}
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
              ownerType === 'business'
                ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
            onClick={() => setOwnerType('business')}
          >
            <FiBriefcase aria-hidden />
            {t('stars.businessWallet')}
          </button>
        </div>
      ) : null}

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
          <p className="mt-1 text-xs text-white/80">{t('stars.totalAvailableHint')}</p>
          {periodLabel ? (
            <p className="mt-1 text-[11px] font-semibold text-white/65">
              {t('stars.periodLabel', { period: periodLabel })}
            </p>
          ) : null}
        </div>

        <BalanceSplitBar bonus={poolRemaining} paid={paidBalance} t={t} />

        {enforced && poolQuota > 0 ? (
          <div className="relative mt-4 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="text-white/75">{t('stars.bonusPoolSection')}</span>
              <span className="tabular-nums text-white">
                {poolRemaining}/{poolQuota} ★
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-emerald-300/90 transition-all"
                style={{ width: `${100 - poolUsedPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-white/70">{t('stars.bonusPoolPeriodHint')}</p>
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
                <ul className="grid gap-2">
                  {historyItems.map((item) => (
                    <HistoryRow key={item.id} item={item} t={t} packages={packages} />
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <StarsPricingGuide config={balance.config} ownerType={ownerType} />
        </>
      ) : null}
    </div>
  )
}
