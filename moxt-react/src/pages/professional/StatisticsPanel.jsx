import { useMemo } from 'react'
import { FiBarChart2, FiClock, FiStar, FiTrendingUp } from 'react-icons/fi'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'
import { computeBusinessTransferStats } from '../../features/transfers/businessTransferStats'
import { TRANSFER_STATUS } from '../../features/transfers/transferConfig'
import { directionLabel, formatMoney } from '../../features/transfers/transferUtils'

// ── Helpers ────────────────────────────────────────────────────────────────

function countByMonth(items, key = 'createdAt', monthsBack = 6) {
  const now = new Date()
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1)
    return {
      label: d.toLocaleString('fr-FR', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      count: 0,
    }
  })
  items.forEach((item) => {
    const raw = item[key]
    if (!raw) return
    const monthKey = String(raw).slice(0, 7)
    const bucket = months.find((m) => m.key === monthKey)
    if (bucket) bucket.count++
  })
  return months
}

const STATUS_LABEL_KEYS = {
  [TRANSFER_STATUS.PENDING]: 'transfers.status.pending',
  [TRANSFER_STATUS.DECLARED]: 'transfers.status.declared',
  [TRANSFER_STATUS.RECEIVED]: 'transfers.status.received',
  [TRANSFER_STATUS.PROCESSING]: 'transfers.status.processing',
  [TRANSFER_STATUS.PAID_OUT]: 'transfers.status.paidOut',
  [TRANSFER_STATUS.COMPLETED]: 'transfers.status.completed',
  [TRANSFER_STATUS.CANCELLED]: 'transfers.status.cancelled',
  [TRANSFER_STATUS.EXPIRED]: 'transfers.status.expired',
}

const STATUS_TONES = {
  [TRANSFER_STATUS.PENDING]: 'amber',
  [TRANSFER_STATUS.DECLARED]: 'brand',
  [TRANSFER_STATUS.RECEIVED]: 'teal',
  [TRANSFER_STATUS.PROCESSING]: 'violet',
  [TRANSFER_STATUS.PAID_OUT]: 'brand',
  [TRANSFER_STATUS.COMPLETED]: 'emerald',
  [TRANSFER_STATUS.CANCELLED]: 'rose',
  [TRANSFER_STATUS.EXPIRED]: 'amber',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, highlight = false }) {
  return (
    <div
      className={`rounded-xl p-4 ${
        highlight
          ? 'bg-amber-50 ring-1 ring-amber-200/80 dark:bg-amber-950/30 dark:ring-amber-900/50'
          : 'bg-[var(--app-surface-muted)]'
      }`}
    >
      <strong className="text-2xl tabular-nums">{value}</strong>
      {sub ? <span className="ml-1.5 text-xs text-emerald-600">{sub}</span> : null}
      <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{label}</p>
    </div>
  )
}

function BarChart({ data, color = 'var(--app-accent)', title, valueKey = 'count' }) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1)
  return (
    <div>
      {title ? <p className="mb-3 text-sm font-black">{title}</p> : null}
      <div className="flex items-end gap-1.5" style={{ height: 72 }}>
        {data.map((bucket) => {
          const value = bucket[valueKey] || 0
          const pct = Math.round((value / max) * 100)
          return (
            <div key={bucket.key} className="group relative flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${pct}%`, minHeight: 3, backgroundColor: color }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--app-text)] px-1.5 py-0.5 text-[10px] text-[var(--app-surface)] opacity-0 transition group-hover:opacity-100">
                {value}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((bucket) => (
          <span
            key={bucket.key}
            className="flex-1 text-center text-[9px] text-[var(--app-text-muted)]"
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function HorizBar({ label, value, max, tone = 'brand', valueLabel }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  const colors = {
    brand: 'bg-brand-500',
    teal: 'bg-teal-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  }
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-bold">{label}</span>
        <span className="shrink-0 tabular-nums text-[var(--app-text-muted)]">
          {valueLabel ?? value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
        <div
          className={`h-full rounded-full transition-all ${colors[tone] ?? colors.brand}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CurrencyRows({ rows, emptyLabel }) {
  if (!rows?.length) {
    return <p className="text-sm text-[var(--app-text-muted)]">{emptyLabel}</p>
  }
  return (
    <ul className="grid gap-2">
      {rows.map((row) => (
        <li
          key={row.currency}
          className="flex items-center justify-between gap-2 rounded-lg bg-[var(--app-surface-muted)] px-3 py-2 text-sm"
        >
          <span className="font-bold">{row.currency}</span>
          <span className="tabular-nums">{formatMoney(row.amount, row.currency)}</span>
        </li>
      ))}
    </ul>
  )
}

function formatHours(value, pt) {
  if (value == null) return pt('professional.stats.transfer.na')
  return pt('professional.stats.transfer.hours', { hours: value })
}

function TransferStatistics({ transfers, rating, onOpenReviews, t, pt }) {
  const stats = useMemo(
    () => computeBusinessTransferStats(transfers, rating),
    [transfers, rating],
  )
  const maxStatus = Math.max(...stats.statusBreakdown.map((item) => item.count), 1)
  const maxDirection = Math.max(...stats.directionBreakdown.map((item) => item.count), 1)

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="text-2xl text-brand-600" />
            <div>
              <h2 className="font-black">{pt('professional.stats.transfer.title')}</h2>
              <p className="text-sm text-[var(--app-text-muted)]">
                {pt('professional.stats.transfer.subtitle')}
              </p>
            </div>
          </div>
          {onOpenReviews ? (
            <button
              type="button"
              onClick={onOpenReviews}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-bold text-[var(--app-accent)] transition hover:bg-[var(--app-surface-muted)]"
            >
              <FiStar />
              {pt('professional.stats.transfer.viewReviews')}
            </button>
          ) : null}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label={pt('professional.stats.transfer.kpi.total')} value={stats.total} />
          <KpiCard
            label={pt('professional.stats.transfer.kpi.inPipeline')}
            value={stats.inPipeline}
          />
          <KpiCard
            label={pt('professional.stats.transfer.kpi.completed')}
            value={stats.completed}
          />
          <KpiCard
            label={pt('professional.stats.transfer.kpi.awaiting')}
            value={stats.awaitingBusinessAction}
            highlight={stats.awaitingBusinessAction > 0}
          />
          <KpiCard
            label={pt('professional.stats.transfer.kpi.cancelled')}
            value={stats.cancelledOrExpired}
          />
          <KpiCard
            label={pt('professional.stats.transfer.kpi.rating')}
            value={
              stats.rating.count
                ? pt('professional.page.metrics.reviewsValue', {
                    average: stats.rating.average,
                    count: stats.rating.count,
                  })
                : '—'
            }
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-black">{pt('professional.stats.transfer.pipelineTitle')}</h2>
          <div className="grid gap-3">
            {stats.statusBreakdown.map((item) => (
              <HorizBar
                key={item.status}
                label={t(STATUS_LABEL_KEYS[item.status] || item.status)}
                value={item.count}
                max={maxStatus}
                tone={STATUS_TONES[item.status] || 'brand'}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-black">{pt('professional.stats.transfer.directionTitle')}</h2>
          {stats.directionBreakdown.length ? (
            <div className="grid gap-3">
              {stats.directionBreakdown.map((item) => (
                <HorizBar
                  key={item.direction}
                  label={directionLabel(item.direction, t)}
                  value={item.count}
                  max={maxDirection}
                  tone="teal"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              {pt('professional.stats.transfer.emptyVolumes')}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-black">{pt('professional.stats.transfer.financeTitle')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.stats.transfer.sent')}
            </p>
            <CurrencyRows
              rows={stats.volumes.sent}
              emptyLabel={pt('professional.stats.transfer.emptyVolumes')}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.stats.transfer.fees')}
            </p>
            <CurrencyRows
              rows={stats.volumes.fees}
              emptyLabel={pt('professional.stats.transfer.emptyVolumes')}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.stats.transfer.collected')}
            </p>
            <CurrencyRows
              rows={stats.volumes.totalCollected}
              emptyLabel={pt('professional.stats.transfer.emptyVolumes')}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
              {pt('professional.stats.transfer.received')}
            </p>
            <CurrencyRows
              rows={stats.volumes.received}
              emptyLabel={pt('professional.stats.transfer.emptyVolumes')}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <FiClock className="text-xl text-brand-600" />
            <h2 className="font-black">{pt('professional.stats.transfer.timingTitle')}</h2>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">
                {pt('professional.stats.transfer.timing.declaredToReceived')}
              </dt>
              <dd className="mt-1 text-lg font-black tabular-nums">
                {formatHours(stats.averages.declaredToReceivedHours, pt)}
              </dd>
            </div>
            <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">
                {pt('professional.stats.transfer.timing.receivedToPayout')}
              </dt>
              <dd className="mt-1 text-lg font-black tabular-nums">
                {formatHours(stats.averages.receivedToPayoutHours, pt)}
              </dd>
            </div>
            <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">
                {pt('professional.stats.transfer.timing.payoutToCompleted')}
              </dt>
              <dd className="mt-1 text-lg font-black tabular-nums">
                {formatHours(stats.averages.payoutToCompletedHours, pt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <FiTrendingUp className="text-xl text-emerald-600" />
            <h2 className="font-black">{pt('professional.stats.transfer.trendTitle')}</h2>
          </div>
          <div className="grid gap-5">
            <BarChart
              data={stats.monthly}
              valueKey="created"
              color="#10b981"
              title={pt('professional.stats.transfer.trendCreated')}
            />
            <BarChart
              data={stats.monthly}
              valueKey="completed"
              color="#0f766e"
              title={pt('professional.stats.transfer.trendCompleted')}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export function StatisticsPanel({
  business,
  content,
  rating,
  requests,
  transfers,
  onOpenReviews,
}) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const modules = business.services || []
  const isTransferBusiness = modules.includes('Transfert')

  const allPublications = useMemo(
    () => [
      ...content.listings.map((i) => ({ ...i, _type: 'listings' })),
      ...content.jobs.map((i) => ({ ...i, _type: 'jobs' })),
      ...content.events.map((i) => ({ ...i, _type: 'events' })),
      ...content.parcels.map((i) => ({ ...i, _type: 'parcels' })),
      ...(content.offers || []).map((i) => ({ ...i, _type: 'p2p' })),
    ],
    [content],
  )

  const pubByMonth = useMemo(() => countByMonth(allPublications), [allPublications])

  const typeBreakdown = [
    modules.includes('Marketplace') && {
      labelKey: 'professional.stats.types.listings',
      value: content.listings.length,
      tone: 'brand',
    },
    modules.includes('Jobs') && {
      labelKey: 'professional.stats.types.jobs',
      value: content.jobs.length,
      tone: 'teal',
    },
    modules.includes('Events') && {
      labelKey: 'professional.stats.types.events',
      value: content.events.length,
      tone: 'violet',
    },
    modules.includes('Colis') && {
      labelKey: 'professional.stats.types.parcels',
      value: content.parcels.length,
      tone: 'amber',
    },
    modules.includes('P2P') && {
      labelKey: 'professional.stats.types.p2pOffers',
      value: content.offers?.length || 0,
      tone: 'rose',
    },
  ].filter(Boolean)
  const maxType = Math.max(...typeBreakdown.map((item) => item.value), 1)

  const totalViews = content.listings.reduce((s, l) => s + (Number(l.views) || 0), 0)
  const totalFavs = content.listings.reduce((s, l) => s + (l.favorites?.length || 0), 0)
  const totalContacts = content.listings.reduce((s, l) => s + (Number(l.contactCount) || 0), 0)
  const completedRequests = requests.filter((r) => r.status === 'completed').length

  if (isTransferBusiness) {
    return (
      <TransferStatistics
        transfers={transfers}
        rating={rating}
        onOpenReviews={onOpenReviews}
        t={t}
        pt={pt}
      />
    )
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex items-center gap-3">
          <FiBarChart2 className="text-2xl text-brand-600" />
          <div>
            <h2 className="font-black">{pt('professional.stats.title')}</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {pt('professional.stats.subtitle')}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={pt('professional.stats.kpi.publications')} value={allPublications.length} />
          <KpiCard
            label={pt('professional.stats.kpi.averageRating')}
            value={rating.count ? rating.average : '—'}
          />
          <KpiCard label={pt('professional.stats.kpi.activeServices')} value={modules.length} />
          <KpiCard label={pt('professional.stats.kpi.completedRequests')} value={completedRequests} />
          {modules.includes('Marketplace') ? (
            <>
              <KpiCard label={pt('professional.stats.kpi.listingViews')} value={totalViews} />
              <KpiCard label={pt('professional.stats.kpi.contacts')} value={totalContacts} />
              <KpiCard label={pt('professional.stats.kpi.favorites')} value={totalFavs} />
            </>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <FiTrendingUp className="text-xl text-brand-600" />
          <h2 className="font-black">{pt('professional.stats.activityTitle')}</h2>
        </div>
        <BarChart data={pubByMonth} color="var(--color-brand-500, #6366f1)" />
      </Card>

      {typeBreakdown.length > 1 ? (
        <Card>
          <h2 className="mb-4 font-black">{pt('professional.stats.breakdownTitle')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {typeBreakdown.map((item) => (
              <HorizBar
                key={item.labelKey}
                label={pt(item.labelKey)}
                value={item.value}
                max={maxType}
                tone={item.tone}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
