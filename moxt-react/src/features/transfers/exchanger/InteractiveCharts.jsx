import { useMemo, useState } from 'react'
import { FiBarChart2, FiCalendar, FiLayers } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatMoney, getTransferPricing } from '../transferUtils'
import { build30DayActivity } from './exchangerChartUtils'
import { statusLabelKey } from './statusLabels'

const STATUS_TONES = {
  [TRANSFER_STATUS.PENDING]: 'bg-amber-500',
  [TRANSFER_STATUS.DECLARED]: 'bg-brand-500',
  [TRANSFER_STATUS.RECEIVED]: 'bg-teal-500',
  [TRANSFER_STATUS.PROCESSING]: 'bg-violet-500',
  [TRANSFER_STATUS.PAID_OUT]: 'bg-cyan-500',
  [TRANSFER_STATUS.COMPLETED]: 'bg-emerald-500',
  [TRANSFER_STATUS.CANCELLED]: 'bg-rose-500',
  [TRANSFER_STATUS.EXPIRED]: 'bg-amber-400',
}

function InteractiveBarChart({
  data,
  selectedKey,
  onSelect,
  valueKey = 'count',
  getKey,
  getLabel,
  height = 96,
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1)

  return (
    <div>
      <div className="flex items-end gap-0.5 sm:gap-1" style={{ height }}>
        {data.map((item) => {
          const key = getKey(item)
          const value = Number(item[valueKey]) || 0
          const pct = Math.round((value / max) * 100)
          const selected = selectedKey === key
          return (
            <button
              key={key}
              type="button"
              title={`${getLabel(item)}: ${value}`}
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : item)}
              className={`group relative flex flex-1 flex-col items-center justify-end rounded-t-sm transition ${
                selected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--app-text)] px-1.5 py-0.5 text-[10px] text-[var(--app-surface)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {value}
              </span>
              <span
                className={`w-full rounded-t-sm transition-all ${
                  selected ? 'bg-[var(--app-accent)] ring-2 ring-[var(--app-accent)] ring-offset-1' : 'bg-[var(--app-accent)]'
                }`}
                style={{ height: `${Math.max(pct, value > 0 ? 8 : 3)}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex gap-0.5 sm:gap-1">
        {data.map((item) => (
          <span
            key={getKey(item)}
            className="flex-1 truncate text-center text-[8px] text-[var(--app-text-muted)] sm:text-[9px]"
          >
            {getLabel(item)}
          </span>
        ))}
      </div>
    </div>
  )
}

function DayDetailPanel({ day, onOpenTransfer, t }) {
  if (!day) return null
  return (
    <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
        {t('exchanger.charts.dayDetail', { date: day.date })}
      </p>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        {t('exchanger.charts.daySummary', {
          count: day.count,
          volume: Math.round(day.volume).toLocaleString('fr-FR'),
        })}
      </p>
      {day.transfers.length ? (
        <ul className="mt-3 grid gap-2">
          {day.transfers.map((transfer) => {
            const pricing = getTransferPricing(transfer)
            return (
              <li key={transfer.id}>
                <button
                  type="button"
                  onClick={() => onOpenTransfer(transfer)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-[var(--app-surface)] px-3 py-2 text-left text-sm transition hover:ring-1 hover:ring-brand-300"
                >
                  <span className="min-w-0 truncate font-bold">
                    {transfer.sender?.firstName || t('exchanger.queue.client')} · {transfer.id}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--app-text-muted)]">
                    {formatMoney(pricing.totalToPay, transfer.currencyFrom)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">{t('exchanger.charts.noTransfers')}</p>
      )}
    </div>
  )
}

export function InteractiveCharts({
  transfers,
  stats,
  statusFilter,
  onStatusFilter,
  onOpenTransfer,
  t,
}) {
  const activity = useMemo(() => build30DayActivity(transfers), [transfers])
  const [selectedDay, setSelectedDay] = useState(null)

  const statusData = useMemo(
    () =>
      (stats.statusBreakdown || []).filter((item) => item.count > 0),
    [stats.statusBreakdown],
  )
  const maxStatus = Math.max(...statusData.map((item) => item.count), 1)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <FiCalendar className="text-[var(--app-accent)]" />
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.charts.activityTitle')}
          </p>
        </div>
        <InteractiveBarChart
          data={activity}
          selectedKey={selectedDay?.date || null}
          onSelect={(item) => setSelectedDay(item)}
          getKey={(item) => item.date}
          getLabel={(item) => item.label}
          height={110}
        />
        <DayDetailPanel day={selectedDay} onOpenTransfer={onOpenTransfer} t={t} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <FiLayers className="text-[var(--app-accent)]" />
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.charts.statusTitle')}
          </p>
        </div>
        {statusData.length ? (
          <div className="grid gap-3">
            {statusData.map((item) => {
              const selected = statusFilter === item.status
              const pct = Math.round((item.count / maxStatus) * 100)
              return (
                <button
                  key={item.status}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onStatusFilter(selected ? null : item.status)}
                  className={`grid gap-1 rounded-xl p-2 text-left transition ${
                    selected
                      ? 'bg-[var(--app-accent-soft)] ring-1 ring-[var(--app-accent)]'
                      : 'hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold">{t(statusLabelKey(item.status))}</span>
                    <span className="tabular-nums text-[var(--app-text-muted)]">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_TONES[item.status] || 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.charts.noTransfers')}</p>
        )}
      </Card>

      <Card className="xl:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <FiBarChart2 className="text-[var(--app-accent)]" />
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.charts.monthlyTitle')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold text-[var(--app-text-muted)]">
              {t('exchanger.charts.created')}
            </p>
            <InteractiveBarChart
              data={stats.monthly || []}
              selectedKey={null}
              onSelect={() => {}}
              valueKey="created"
              getKey={(item) => `c-${item.key}`}
              getLabel={(item) => item.label}
              height={88}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-[var(--app-text-muted)]">
              {t('exchanger.charts.completed')}
            </p>
            <InteractiveBarChart
              data={stats.monthly || []}
              selectedKey={null}
              onSelect={() => {}}
              valueKey="completed"
              getKey={(item) => `d-${item.key}`}
              getLabel={(item) => item.label}
              height={88}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
