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
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { calculateBusinessRating } from '../features/businesses/businessSelectors'
import { computeBusinessTransferStats } from '../features/transfers/businessTransferStats'
import { TRANSFER_STATUS } from '../features/transfers/transferConfig'
import { selectTransfersVisibleToUser } from '../features/transfers/transferSelectors'
import { refreshVisibleTransfers } from '../features/transfers/transferSync'
import { InteractiveCharts } from '../features/transfers/exchanger/InteractiveCharts'
import { ExchangerOpsQueue } from '../features/transfers/exchanger/ExchangerOpsQueue'
import { TransferQuickManageModal } from '../features/transfers/exchanger/TransferQuickManageModal'
import { formatHoursLabel } from '../features/transfers/exchanger/exchangerChartUtils'
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
    <div className="flex items-center gap-4 rounded-[1.4rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl"
        style={{
          background: accent ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
          color: accent ? 'var(--app-accent)' : 'var(--app-text-muted)',
        }}
      >
        <Icon className="text-lg" />
      </span>
      <div className="min-w-0">
        <strong className="block truncate text-2xl tabular-nums">{value}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
        {sub ? <p className="mt-0.5 text-[10px] text-[var(--app-text-faint)]">{sub}</p> : null}
      </div>
    </div>
  )
}

function DashboardTabs({ active, onChange, awaitingCount, t }) {
  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-2"
      role="tablist"
      aria-label={t('exchanger.tabs.aria')}
    >
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
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:flex-none sm:text-sm ${
              isActive
                ? 'bg-brand-700 text-white shadow-[0_8px_20px_rgb(8_112_95/0.22)] dark:bg-brand-600'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-accent-soft)]'
            }`}
          >
            <Icon className="text-sm" />
            {t(`exchanger.tabs.${tab.id}`)}
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
  )
}

export function ExchangerDashboardPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [tab, setTab] = useState('ops')
  const [statusFilter, setStatusFilter] = useState(null)
  const [manageTransfer, setManageTransfer] = useState(null)

  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses.items, user?.id),
  )
  const isProfessional =
    user?.role === 'professional' || user?.role === 'admin' || user?.role === 'superadmin'
  const hasAccess = isProfessional || Boolean(business)
  const hasTransferService = business?.services?.includes('Transfert')

  const allTransfers = useSelector((state) => {
    const visible = selectTransfersVisibleToUser(state, user?.id)
    if (!business?.id) return visible
    return visible.filter((item) => item.businessId === business.id)
  })

  const reviews = useSelector((state) =>
    business?.id
      ? state.reviews.items.filter(
          (item) => item.targetType === 'business' && item.targetId === business.id,
        )
      : [],
  )
  const rating = calculateBusinessRating(reviews)

  useEffect(() => {
    if (!user?.id) return
    dispatch(refreshVisibleTransfers({ userId: user.id, businessId: business?.id }))
  }, [business?.id, dispatch, user?.id])

  const stats = useMemo(
    () => computeBusinessTransferStats(allTransfers, rating),
    [allTransfers, rating],
  )

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyVolume = useMemo(() => {
    let total = 0
    let currency = null
    for (const transfer of allTransfers) {
      if (transfer.status !== TRANSFER_STATUS.COMPLETED) continue
      const completedDate = transfer.updatedAt
        ? new Date(transfer.updatedAt).toISOString().slice(0, 7)
        : null
      if (completedDate === thisMonth && transfer.amountReceived) {
        total += Number(transfer.amountReceived) || 0
        currency = transfer.currencyTo || currency
      }
    }
    return { total, currency }
  }, [allTransfers, thisMonth])

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

  const manageFromList = useMemo(() => {
    if (!manageTransfer?.id) return null
    return allTransfers.find((item) => item.id === manageTransfer.id) || manageTransfer
  }, [allTransfers, manageTransfer])

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
    <div className="grid min-w-0 max-w-full gap-7">
      <PageHeader
        eyebrow={t('exchanger.page.eyebrow')}
        title={business.name || t('exchanger.page.title')}
        description={t('exchanger.page.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setTab('rates')}>
              <FiSliders className="mr-1" />
              {t('exchanger.actions.rates')}
            </Button>
            <Link to="/transfers/history">
              <Button variant="secondary">
                {t('exchanger.actions.viewAll')}
                <FiArrowRight className="ml-1" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
          label={t('exchanger.kpi.volume')}
          value={
            monthlyVolume.total > 0
              ? Math.round(monthlyVolume.total).toLocaleString('fr-FR')
              : '—'
          }
          sub={monthlyVolume.currency || undefined}
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

      <DashboardTabs
        active={tab}
        onChange={setTab}
        awaitingCount={stats.awaitingBusinessAction}
        t={t}
      />

      {tab === 'ops' ? (
        <div className="grid gap-7">
          <InteractiveCharts
            transfers={allTransfers}
            stats={stats}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            onOpenTransfer={setManageTransfer}
            t={t}
          />
          <ExchangerOpsQueue
            transfers={allTransfers.filter(
              (item) =>
                item.status !== TRANSFER_STATUS.CANCELLED &&
                item.status !== TRANSFER_STATUS.EXPIRED,
            )}
            user={user}
            statusFilter={statusFilter}
            onClearFilter={() => setStatusFilter(null)}
            onManage={setManageTransfer}
            t={t}
          />
        </div>
      ) : null}

      {tab === 'rates' ? (
        <TransferRateSettingsPanel business={business} dispatch={dispatch} user={user} />
      ) : null}

      {tab === 'accounts' ? (
        <TransferAccountsPanel business={business} dispatch={dispatch} user={user} />
      ) : null}

      {tab === 'stats' ? (
        <StatisticsPanel
          business={business}
          content={{ listings: [], jobs: [], events: [], parcels: [], offers: [] }}
          rating={rating}
          requests={[]}
          transfers={allTransfers}
        />
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
