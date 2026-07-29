import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiRepeat,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { computeBusinessTransferStats } from '../features/transfers/businessTransferStats'
import { TRANSFER_STATUS } from '../features/transfers/transferConfig'
import { selectTransfersVisibleToUser } from '../features/transfers/transferSelectors'
import { refreshVisibleTransfers } from '../features/transfers/transferSync'
import { moderateTransfer } from '../features/transfers/transferSlice'
import { addToast } from '../features/ui/uiSlice'
import { TransferStatusBadge } from '../features/transfers/TransferStatusBadge'
import { formatMoney, directionInfo, getTransferPricing } from '../features/transfers/transferUtils'
import { calculateBusinessRating } from '../features/businesses/businessSelectors'
import { canActorPerformBusinessTransferAction, canApplyModerateTransfer } from '../features/transfers/transferActionUtils'

const PIPELINE_STATUSES = [
  TRANSFER_STATUS.DECLARED,
  TRANSFER_STATUS.RECEIVED,
  TRANSFER_STATUS.PROCESSING,
  TRANSFER_STATUS.PAID_OUT,
]

const PIPELINE_COLUMNS = [
  { key: TRANSFER_STATUS.PENDING, label: 'À déclarer' },
  { key: TRANSFER_STATUS.DECLARED, label: 'Déclaré' },
  { key: TRANSFER_STATUS.RECEIVED, label: 'Reçu' },
  { key: TRANSFER_STATUS.PROCESSING, label: 'En traitement' },
  { key: TRANSFER_STATUS.PAID_OUT, label: 'Payé' },
  { key: TRANSFER_STATUS.COMPLETED, label: 'Complété' },
]

function useExchangerI18n(t) {
  return useCallback(
    (key, vars = {}) => {
      const FR = {
        'exchanger.page.eyebrow': 'Dashboard échangeur',
        'exchanger.page.title': 'Transferts entrants',
        'exchanger.page.description':
          'Suivez vos opérations en temps réel, avancez le pipeline et pilotez vos volumes.',
        'exchanger.kpi.received': 'Transferts reçus',
        'exchanger.kpi.active': 'En cours (pipeline actif)',
        'exchanger.kpi.volume': 'Volume ce mois',
        'exchanger.kpi.completion': 'Taux de complétion',
        'exchanger.pipeline.title': 'Pipeline par statut',
        'exchanger.pipeline.empty': 'Aucun transfert',
        'exchanger.chart.title': 'Activité · 30 jours',
        'exchanger.actions.viewAll': 'Tout voir',
        'exchanger.actions.advance': 'Avancer',
        'exchanger.actions.detail': 'Détail',
        'exchanger.advance.confirmed': 'Statut avancé',
        'exchanger.advance.confirmedBody': 'Le transfert a bien été avancé.',
        'exchanger.advance.error': 'Transition impossible',
        'exchanger.advance.errorBody': 'Ce transfert ne peut pas être avancé à cette étape.',
        'exchanger.noAccess.title': 'Accès réservé aux échangeurs',
        'exchanger.noAccess.description':
          'Vous devez avoir le rôle professional ou posséder une entreprise de transfert pour accéder à ce tableau de bord.',
      }
      const raw = t(key, vars)
      if (raw !== key) return raw
      const source = FR[key]
      if (!source) return key
      return source.replace(/\{(\w+)\}/g, (_, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`,
      )
    },
    [t],
  )
}

function KpiCard({ icon: Icon, label, value, accent }) {
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
        <strong className="block truncate text-2xl">{value}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
      </div>
    </div>
  )
}

function TransferCard({ transfer, user, dispatch, et }) {
  const canAct = canActorPerformBusinessTransferAction(transfer, user?.id, user?.role)
  const nextStatus = {
    [TRANSFER_STATUS.DECLARED]: TRANSFER_STATUS.RECEIVED,
    [TRANSFER_STATUS.RECEIVED]: TRANSFER_STATUS.PAID_OUT,
  }[transfer.status]
  const canAdvance = canAct && Boolean(nextStatus)

  const pricing = getTransferPricing(transfer)
  const info = directionInfo(transfer.direction, transfer.originCountry)
  const currencyFrom = transfer.currencyFrom || info.from
  const currencyTo = transfer.currencyTo || info.to

  function handleAdvance() {
    if (!canApplyModerateTransfer(transfer, nextStatus)) {
      dispatch(
        addToast({
          title: et('exchanger.advance.error'),
          message: et('exchanger.advance.errorBody'),
          tone: 'error',
        }),
      )
      return
    }
    dispatch(
      moderateTransfer({
        id: transfer.id,
        status: nextStatus,
        actorId: user.id,
        actorRole: user.role,
      }),
    )
    dispatch(
      addToast({
        title: et('exchanger.advance.confirmed'),
        message: et('exchanger.advance.confirmedBody'),
        tone: 'success',
      }),
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[var(--app-text)]">
          {formatMoney(pricing.amountSent, currencyFrom)}
          <span className="mx-1 text-[var(--app-text-faint)]">→</span>
          {transfer.amountReceived
            ? formatMoney(transfer.amountReceived, currencyTo)
            : '—'}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">
          {transfer.sender?.firstName || 'Client'} · {transfer.id}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <TransferStatusBadge status={transfer.status} />
        {canAdvance ? (
          <Button size="sm" onClick={handleAdvance}>
            <FiZap className="text-xs" />
            <span className="text-xs">{et('exchanger.actions.advance')}</span>
          </Button>
        ) : null}
        <Link to={`/transfers/${transfer.id}`} state={{ transferView: 'business' }}>
          <Button variant="secondary" size="sm">
            <span className="text-xs">{et('exchanger.actions.detail')}</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

function PipelineSection({ transfers, user, dispatch, et }) {
  const grouped = useMemo(() => {
    const map = {}
    for (const col of PIPELINE_COLUMNS) {
      map[col.key] = []
    }
    for (const t of transfers) {
      if (map[t.status]) map[t.status].push(t)
    }
    return map
  }, [transfers])

  const activeColumns = PIPELINE_COLUMNS.filter(
    (col) => grouped[col.key].length > 0,
  )

  if (!activeColumns.length) {
    return (
      <Card>
        <p className="text-sm text-[var(--app-text-muted)]">{et('exchanger.pipeline.empty')}</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {activeColumns.map((col) => (
        <div key={col.key}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
              {col.label}
            </span>
            <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
              {grouped[col.key].length}
            </span>
          </div>
          <div className="grid gap-2">
            {grouped[col.key].map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                user={user}
                dispatch={dispatch}
                et={et}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-20 items-end gap-0.5" aria-hidden="true">
      {data.map((day) => {
        const heightPct = Math.round((day.count / max) * 100)
        return (
          <div
            key={day.date}
            title={`${day.date} : ${day.count}`}
            className="flex-1 rounded-t-sm bg-[var(--app-accent)] opacity-70 transition-all hover:opacity-100"
            style={{ height: `${Math.max(heightPct, day.count > 0 ? 6 : 2)}%` }}
          />
        )
      })}
    </div>
  )
}

function build30DayData(transfers) {
  const now = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      count: 0,
    }
  })
  for (const transfer of transfers) {
    if (!transfer.createdAt) continue
    const dateStr = new Date(transfer.createdAt).toISOString().slice(0, 10)
    const bucket = days.find((d) => d.date === dateStr)
    if (bucket) bucket.count += 1
  }
  return days
}

export function ExchangerDashboardPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const et = useExchangerI18n(t)

  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    selectActiveBusinessForOwner(state.businesses.items, user?.id),
  )
  const isProfessional =
    user?.role === 'professional' || user?.role === 'admin' || user?.role === 'superadmin'
  const hasAccess = isProfessional || Boolean(business)

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

  const chartData = useMemo(() => build30DayData(allTransfers), [allTransfers])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyVolume = useMemo(() => {
    let total = 0
    for (const transfer of allTransfers) {
      if (transfer.status !== TRANSFER_STATUS.COMPLETED) continue
      const completedDate = transfer.updatedAt
        ? new Date(transfer.updatedAt).toISOString().slice(0, 7)
        : null
      if (completedDate === thisMonth && transfer.amountReceived) {
        total += Number(transfer.amountReceived) || 0
      }
    }
    return total
  }, [allTransfers, thisMonth])

  const totalReceived = useMemo(
    () =>
      allTransfers.filter((t) => t.status !== TRANSFER_STATUS.PENDING).length,
    [allTransfers],
  )

  const activeCount = useMemo(
    () =>
      allTransfers.filter((t) => PIPELINE_STATUSES.includes(t.status)).length,
    [allTransfers],
  )

  const completionRate = useMemo(() => {
    const eligible = allTransfers.filter(
      (t) =>
        t.status !== TRANSFER_STATUS.CANCELLED && t.status !== TRANSFER_STATUS.EXPIRED,
    ).length
    if (!eligible) return '—'
    return `${Math.round((stats.completed / eligible) * 100)} %`
  }, [allTransfers, stats.completed])

  if (!hasAccess) {
    return (
      <EmptyState
        icon={FiRepeat}
        title={et('exchanger.noAccess.title')}
        description={et('exchanger.noAccess.description')}
      />
    )
  }

  return (
    <div className="grid min-w-0 max-w-full gap-7">
      <PageHeader
        eyebrow={et('exchanger.page.eyebrow')}
        title={et('exchanger.page.title')}
        description={et('exchanger.page.description')}
        actions={
          <Link to="/transfers/history">
            <Button variant="secondary">
              {et('exchanger.actions.viewAll')}
              <FiArrowRight className="ml-1" />
            </Button>
          </Link>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FiRepeat}
          label={et('exchanger.kpi.received')}
          value={totalReceived}
          accent
        />
        <KpiCard
          icon={FiClock}
          label={et('exchanger.kpi.active')}
          value={activeCount}
          accent
        />
        <KpiCard
          icon={FiTrendingUp}
          label={et('exchanger.kpi.volume')}
          value={monthlyVolume > 0 ? Math.round(monthlyVolume).toLocaleString('fr-FR') : '—'}
        />
        <KpiCard
          icon={FiCheckCircle}
          label={et('exchanger.kpi.completion')}
          value={completionRate}
          accent={stats.completed > 0}
        />
      </div>

      {/* 30-day chart */}
      <Card>
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
          {et('exchanger.chart.title')}
        </p>
        <MiniBarChart data={chartData} />
      </Card>

      {/* Pipeline */}
      <div>
        <p className="mb-4 text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
          {et('exchanger.pipeline.title')}
        </p>
        <PipelineSection
          transfers={allTransfers.filter(
            (t) =>
              t.status !== TRANSFER_STATUS.CANCELLED &&
              t.status !== TRANSFER_STATUS.EXPIRED,
          )}
          user={user}
          dispatch={dispatch}
          et={et}
        />
      </div>
    </div>
  )
}
