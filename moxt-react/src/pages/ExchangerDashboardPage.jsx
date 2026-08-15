import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRepeat,
  FiSettings,
  FiSliders,
  FiStar,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { HeaderIslandButton, PageHeader } from '../components/ui/PageHeader'
import { SkeletonStat } from '../components/ui/Skeleton'
import { useLanguage } from '../contexts/useLanguage'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { calculateBusinessRating } from '../features/businesses/businessSelectors'
import { computeBusinessTransferStats } from '../features/transfers/businessTransferStats'
import { currencyForCountry, TRANSFER_STATUS } from '../features/transfers/transferConfig'
import { selectBusinessTransfers } from '../features/transfers/transferSelectors'
import { refreshVisibleTransfers } from '../features/transfers/transferSync'
import { expireOverdueTransfers } from '../features/transfers/transferSlice'
import { InteractiveCharts } from '../features/transfers/exchanger/InteractiveCharts'
import { ExchangerOpsQueue } from '../features/transfers/exchanger/ExchangerOpsQueue'
import { TransferQuickManageModal } from '../features/transfers/exchanger/TransferQuickManageModal'
import {
  computeMonthlyVolumeByCurrency,
  formatHoursLabel,
} from '../features/transfers/exchanger/exchangerChartUtils'
import { TransferRateSettingsPanel } from './professional/TransferRateSettingsPanel'
import { TransferAccountsPanel } from './professional/TransferAccountsPanel'
import { StatisticsPanel } from './professional/StatisticsPanel'

const TABS = [
  { id: 'ops', icon: FiRepeat },
  { id: 'rates', icon: FiSliders },
  { id: 'accounts', icon: FiCreditCard },
  { id: 'stats', icon: FiTrendingUp },
]

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:gap-4 sm:rounded-[1.4rem] sm:p-4">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl sm:size-11"
        style={{
          background: accent ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
          color: accent ? 'var(--app-accent)' : 'var(--app-text-muted)',
        }}
      >
        <Icon className="text-base sm:text-lg" />
      </span>
      <div className="min-w-0">
        <strong className="block truncate text-xl tabular-nums sm:text-2xl">{value}</strong>
        <span className="block truncate text-[11px] text-[var(--app-text-muted)] sm:text-xs">{label}</span>
        {sub ? <p className="mt-0.5 truncate text-[10px] text-[var(--app-text-faint)]">{sub}</p> : null}
      </div>
    </div>
  )
}

function formatVolumeAmount(amount) {
  if (!amount) return '—'
  return Math.round(amount).toLocaleString('fr-FR')
}

function KpiSkeletonGrid() {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  )
}

function DashboardTabs({ active, onChange, awaitingCount, t }) {
  return (
    <div
      className="-mx-1 min-w-0 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:thin]"
      role="tablist"
      aria-label={t('exchanger.tabs.aria')}
    >
      <div className="flex w-max min-w-full gap-1.5 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 sm:w-full sm:flex-wrap">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          const count = tab.id === 'ops' ? awaitingCount : undefined
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition touch-manipulation sm:flex-1 sm:text-sm lg:flex-none ${
                isActive
                  ? 'bg-brand-700 text-white shadow-[0_8px_20px_rgb(8_112_95/0.22)] dark:bg-brand-600'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] active:bg-[var(--app-accent-soft)] sm:hover:bg-[var(--app-accent-soft)]'
              }`}
            >
              <Icon className="shrink-0 text-sm" />
              <span className="whitespace-nowrap">{t(`exchanger.tabs.${tab.id}`)}</span>
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-black tabular-nums ${
                    isActive ? 'bg-white/20' : 'bg-[var(--app-surface)]'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ExchangerDashboardPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [tab, setTab] = useState('ops')
  const [statusFilter, setStatusFilter] = useState(null)
  const [manageTransfer, setManageTransfer] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses.items, user?.id),
  )
  const isProfessional =
    user?.role === 'professional' || user?.role === 'admin' || user?.role === 'superadmin'
  const hasAccess = isProfessional || Boolean(business)
  const hasTransferService = business?.services?.includes('Transfert')

  const allTransfers = useSelector((state) => selectBusinessTransfers(state, business?.id))

  const reviews = useSelector((state) =>
    business?.id
      ? state.reviews.items.filter(
          (item) => item.targetType === 'business' && item.targetId === business.id,
        )
      : [],
  )
  const rating = calculateBusinessRating(reviews)

  useEffect(() => {
    if (!user?.id || !business?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pas de bootstrap si session/entreprise absente
      setBootstrapping(false)
      return undefined
    }

    let cancelled = false
    let delayTimer
    const startedAt = Date.now()
    const MIN_SKELETON_MS = 600
    setBootstrapping(true)

    dispatch(
      refreshVisibleTransfers({
        userId: user.id,
        businessId: business.id,
        scope: 'business',
        light: true,
        forceFull: true,
      }),
    )
      .unwrap()
      .catch(() => {})
      .finally(() => {
        const remaining = Math.max(0, MIN_SKELETON_MS - (Date.now() - startedAt))
        const finish = () => {
          if (!cancelled) setBootstrapping(false)
        }
        if (remaining > 0) {
          delayTimer = setTimeout(finish, remaining)
        } else {
          finish()
        }
      })

    dispatch(expireOverdueTransfers())

    return () => {
      cancelled = true
      if (delayTimer) clearTimeout(delayTimer)
    }
  }, [business?.id, dispatch, user?.id])

  const stats = useMemo(
    () => computeBusinessTransferStats(allTransfers, rating),
    [allTransfers, rating],
  )

  const localCurrency = currencyForCountry(business?.originCountry || 'BJ')
  const monthlyVolume = useMemo(
    () => computeMonthlyVolumeByCurrency(allTransfers, localCurrency),
    [allTransfers, localCurrency],
  )

  const completionRate = useMemo(() => {
    const eligible = allTransfers.filter(
      (item) =>
        item.status !== TRANSFER_STATUS.CANCELLED && item.status !== TRANSFER_STATUS.EXPIRED,
    ).length
    if (!eligible) return '—'
    return `${Math.round((stats.completed / eligible) * 100)} %`
  }, [allTransfers, stats.completed])

  const activePipeline = useMemo(
    () =>
      allTransfers.filter(
        (item) =>
          item.status !== TRANSFER_STATUS.CANCELLED &&
          item.status !== TRANSFER_STATUS.EXPIRED &&
          item.status !== TRANSFER_STATUS.COMPLETED,
      ),
    [allTransfers],
  )

  const queueTransfers = useMemo(
    () =>
      allTransfers.filter(
        (item) =>
          item.status !== TRANSFER_STATUS.CANCELLED && item.status !== TRANSFER_STATUS.EXPIRED,
      ),
    [allTransfers],
  )

  const manageFromList = useMemo(() => {
    if (!manageTransfer?.id) return null
    return allTransfers.find((item) => item.id === manageTransfer.id) || manageTransfer
  }, [allTransfers, manageTransfer])

  // Skeletons pendant le premier refresh — même si Redux a déjà des données
  // en cache (sinon les placeholders ne s'affichent jamais en prod).
  const showPlaceholders = bootstrapping

  if (!hasAccess) {
    return (
      <EmptyState
        icon={FiRepeat}
        title={t('exchanger.noAccess.title')}
        description={t('exchanger.noAccess.description')}
      />
    )
  }

  if (!business || !hasTransferService) {
    return (
      <EmptyState
        icon={FiSettings}
        title={t('exchanger.noBusiness.title')}
        description={t('exchanger.noBusiness.description')}
        action={
          <Link to="/professional">
            <Button>
              {t('exchanger.noBusiness.cta')}
              <FiArrowRight className="ml-1" />
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5 overflow-x-clip sm:gap-7">
      <PageHeader
        eyebrow={t('exchanger.page.eyebrow')}
        title={business.name || t('exchanger.page.title')}
        description={t('exchanger.page.description')}
        actions={
          <>
            <HeaderIslandButton
              icon={FiSliders}
              label={t('exchanger.actions.rates')}
              onClick={() => setTab('rates')}
            />
            <HeaderIslandButton
              icon={FiArrowRight}
              label={t('exchanger.actions.viewAll')}
              to="/transfers/history"
            />
          </>
        }
      />

      {showPlaceholders ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          <KpiCard
            icon={FiZap}
            label={t('exchanger.kpi.awaiting')}
            value={stats.awaitingBusinessAction}
            accent={stats.awaitingBusinessAction > 0}
          />
          <KpiCard
            icon={FiClock}
            label={t('exchanger.kpi.active')}
            value={activePipeline.length}
            accent
          />
          <KpiCard
            icon={FiTrendingUp}
            label={t('exchanger.kpi.volumeRub')}
            value={formatVolumeAmount(monthlyVolume.rub)}
            sub="RUB"
            accent={monthlyVolume.rub > 0}
          />
          <KpiCard
            icon={FiTrendingUp}
            label={t('exchanger.kpi.volumeLocal', { currency: monthlyVolume.localCurrency })}
            value={formatVolumeAmount(monthlyVolume.local)}
            sub={monthlyVolume.localCurrency}
            accent={monthlyVolume.local > 0}
          />
          <KpiCard
            icon={FiCheckCircle}
            label={t('exchanger.kpi.completion')}
            value={completionRate}
            accent={stats.completed > 0}
          />
          <KpiCard
            icon={FiStar}
            label={t('exchanger.kpi.rating')}
            value={
              rating?.average != null
                ? `${Number(rating.average).toFixed(1)} (${rating.count || 0})`
                : '—'
            }
          />
          <KpiCard
            icon={FiClock}
            label={t('exchanger.kpi.avgDelay')}
            value={formatHoursLabel(stats.averages?.receivedToPayoutHours, '—')}
            sub={t('exchanger.kpi.avgDelaySub')}
          />
        </div>
      )}

      <DashboardTabs
        active={tab}
        onChange={setTab}
        awaitingCount={stats.awaitingBusinessAction}
        t={t}
      />

      {tab === 'ops' ? (
        <div className="grid min-w-0 gap-5 sm:gap-7">
          <InteractiveCharts
            transfers={allTransfers}
            stats={stats}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            onOpenTransfer={setManageTransfer}
            loading={showPlaceholders}
            t={t}
          />
          <ExchangerOpsQueue
            transfers={queueTransfers}
            user={user}
            statusFilter={statusFilter}
            onClearFilter={() => setStatusFilter(null)}
            onManage={setManageTransfer}
            loading={showPlaceholders}
            t={t}
          />
        </div>
      ) : null}

      {tab === 'rates' ? (
        <div className="min-w-0 overflow-x-clip">
          <TransferRateSettingsPanel business={business} dispatch={dispatch} user={user} />
        </div>
      ) : null}

      {tab === 'accounts' ? (
        <div className="min-w-0 overflow-x-clip">
          <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
        </div>
      ) : null}

      {tab === 'stats' ? (
        <div className="min-w-0 overflow-x-clip">
          <StatisticsPanel
            business={business}
            content={{ listings: [], jobs: [], events: [], parcels: [], offers: [] }}
            rating={rating}
            requests={[]}
            transfers={allTransfers}
          />
        </div>
      ) : null}

      {manageFromList ? (
        <TransferQuickManageModal
          key={manageFromList.id}
          open
          transfer={manageFromList}
          user={user}
          dispatch={dispatch}
          onClose={() => setManageTransfer(null)}
          t={t}
        />
      ) : null}
    </div>
  )
}
