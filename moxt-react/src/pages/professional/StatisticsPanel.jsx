import { useMemo } from 'react'
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'

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

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-[var(--app-surface-muted)] p-4">
      <strong className="text-2xl">{value}</strong>
      {sub ? <span className="ml-1.5 text-xs text-emerald-600">+{sub}</span> : null}
      <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{label}</p>
    </div>
  )
}

function BarChart({ data, color = 'var(--app-accent)', title }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div>
      {title ? <p className="mb-3 text-sm font-black">{title}</p> : null}
      <div className="flex items-end gap-1.5" style={{ height: 72 }}>
        {data.map((bucket) => {
          const pct = Math.round((bucket.count / max) * 100)
          return (
            <div key={bucket.key} className="group relative flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${pct}%`, minHeight: 3, backgroundColor: color }}
              />
              {/* tooltip */}
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--app-text)] px-1.5 py-0.5 text-[10px] text-[var(--app-surface)] opacity-0 transition group-hover:opacity-100">
                {bucket.count}
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

function HorizBar({ label, value, max, tone = 'brand' }) {
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
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="tabular-nums text-[var(--app-text-muted)]">{value}</span>
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

// ── Main ───────────────────────────────────────────────────────────────────

export function StatisticsPanel({ business, content, rating, requests, transfers }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const modules = business.services || []

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
  const xferByMonth = useMemo(() => countByMonth(transfers), [transfers])

  const totalViews = content.listings.reduce((s, l) => s + (Number(l.views) || 0), 0)
  const totalFavs = content.listings.reduce((s, l) => s + (l.favorites?.length || 0), 0)
  const totalContacts = content.listings.reduce((s, l) => s + (Number(l.contactCount) || 0), 0)

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
    modules.includes('Transfert') && {
      labelKey: 'professional.stats.types.transfers',
      value: transfers.length,
      tone: 'emerald',
    },
  ].filter(Boolean)
  const maxType = Math.max(...typeBreakdown.map((item) => item.value), 1)

  const completedRequests = requests.filter((r) => r.status === 'completed').length

  return (
    <div className="grid gap-5">
      {/* KPIs */}
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
          <KpiCard label={pt('professional.stats.kpi.averageRating')} value={rating.count ? rating.average : '—'} />
          <KpiCard label={pt('professional.stats.kpi.activeServices')} value={modules.length} />
          <KpiCard label={pt('professional.stats.kpi.completedRequests')} value={completedRequests} />
          {modules.includes('Marketplace') ? (
            <>
              <KpiCard label={pt('professional.stats.kpi.listingViews')} value={totalViews} />
              <KpiCard label={pt('professional.stats.kpi.contacts')} value={totalContacts} />
              <KpiCard label={pt('professional.stats.kpi.favorites')} value={totalFavs} />
            </>
          ) : null}
          {modules.includes('Transfert') ? (
            <KpiCard label={pt('professional.stats.kpi.transfers')} value={transfers.length} />
          ) : null}
        </div>
      </Card>

      {/* Graphique activité des publications */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <FiTrendingUp className="text-xl text-brand-600" />
          <h2 className="font-black">{pt('professional.stats.activityTitle')}</h2>
        </div>
        <BarChart data={pubByMonth} color="var(--color-brand-500, #6366f1)" />
      </Card>

      {/* Répartition par type */}
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

      {/* Graphique transferts */}
      {modules.includes('Transfert') && transfers.length ? (
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <FiTrendingUp className="text-xl text-emerald-600" />
            <h2 className="font-black">{pt('professional.stats.transfersTitle')}</h2>
          </div>
          <BarChart data={xferByMonth} color="#10b981" />
        </Card>
      ) : null}
    </div>
  )
}
