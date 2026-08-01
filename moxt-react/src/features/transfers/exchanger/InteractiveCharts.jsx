import { useMemo, useState } from 'react'
import { FiBarChart2, FiCalendar, FiLayers, FiTrendingUp } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { Skeleton, SkeletonStat } from '../../../components/ui/Skeleton'
import { TRANSFER_STATUS } from '../transferConfig'
import { formatMoney, getTransferPricing } from '../transferUtils'
import {
  build30DayActivity,
  computeMonthlyTrend,
  formatTrendDelta,
} from './exchangerChartUtils'
import { statusLabelKey } from './statusLabels'

const STATUS_TONES = {
  [TRANSFER_STATUS.PENDING_ACCEPTANCE]: 'bg-orange-500',
  [TRANSFER_STATUS.PENDING]: 'bg-amber-500',
  [TRANSFER_STATUS.DECLINED]: 'bg-rose-600',
  [TRANSFER_STATUS.DECLARED]: 'bg-brand-500',
  [TRANSFER_STATUS.RECEIVED]: 'bg-teal-500',
  [TRANSFER_STATUS.PROCESSING]: 'bg-violet-500',
  [TRANSFER_STATUS.PAID_OUT]: 'bg-cyan-500',
  [TRANSFER_STATUS.COMPLETED]: 'bg-emerald-500',
  [TRANSFER_STATUS.CANCELLED]: 'bg-rose-500',
  [TRANSFER_STATUS.EXPIRED]: 'bg-amber-400',
}

/**
 * Bar chart tactile : scroll horizontal si beaucoup de barres (ex. 30 jours).
 */
function InteractiveBarChart({
  data,
  selectedKey,
  onSelect,
  valueKey = 'count',
  getKey,
  getLabel,
  height = 96,
  scrollable = false,
  labelEvery = 1,
  scrollHint,
  barClassName = 'bg-[var(--app-accent)]',
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1)
  const barMinPx = scrollable ? 12 : undefined

  const chart = (
    <div
      className={
        scrollable
          ? 'min-w-[min(100%,22rem)] w-max max-w-none sm:w-full sm:min-w-0'
          : 'w-full min-w-0'
      }
      style={scrollable ? { minWidth: Math.max(data.length * (barMinPx + 2), 280) } : undefined}
    >
      <div className="flex items-end gap-px sm:gap-0.5" style={{ height }}>
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
              onClick={() => onSelect?.(selected ? null : item)}
              className={`group relative flex flex-col items-center justify-end rounded-t-sm transition touch-manipulation ${
                scrollable ? 'shrink-0' : 'min-w-0 flex-1'
              } ${selected ? 'opacity-100' : 'opacity-70 active:opacity-100 sm:hover:opacity-100'}`}
              style={scrollable ? { width: barMinPx, minWidth: barMinPx } : undefined}
            >
              <span className="pointer-events-none absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--app-text)] px-1.5 py-0.5 text-[10px] text-[var(--app-surface)] sm:block sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                {value}
              </span>
              <span
                className={`w-full max-w-full rounded-t-sm transition-all ${barClassName} ${
                  selected ? 'ring-1 ring-[var(--app-accent)] sm:ring-2' : ''
                }`}
                style={{ height: `${Math.max(pct, value > 0 ? 10 : 3)}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex gap-px sm:gap-0.5">
        {data.map((item, index) => {
          const show =
            labelEvery <= 1 || index % labelEvery === 0 || index === data.length - 1
          return (
            <span
              key={getKey(item)}
              className={`truncate text-center text-[8px] leading-tight text-[var(--app-text-muted)] sm:text-[9px] ${
                scrollable ? 'shrink-0' : 'min-w-0 flex-1'
              } ${show ? '' : 'invisible sm:visible'}`}
              style={scrollable ? { width: barMinPx, minWidth: barMinPx } : undefined}
              aria-hidden={!show}
            >
              {show ? getLabel(item) : '·'}
            </span>
          )
        })}
      </div>
    </div>
  )

  if (!scrollable) {
    return <div className="min-w-0 overflow-hidden">{chart}</div>
  }

  return (
    <div className="min-w-0">
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
        {chart}
      </div>
      {scrollHint ? (
        <p className="mt-1 text-[10px] text-[var(--app-text-faint)] sm:hidden">{scrollHint}</p>
      ) : null}
    </div>
  )
}

/** Deux séries côte à côte (créés / terminés) pour tendance 6 mois. */
function DualSeriesBarChart({
  data,
  seriesA,
  seriesB,
  selectedKey,
  onSelect,
  getKey,
  getLabel,
  height = 110,
  formatValue,
}) {
  const max = Math.max(
    ...data.flatMap((d) => [Number(d[seriesA.key]) || 0, Number(d[seriesB.key]) || 0]),
    1,
  )

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${seriesA.tone}`} />
          {seriesA.label}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${seriesB.tone}`} />
          {seriesB.label}
        </span>
      </div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((item) => {
          const key = getKey(item)
          const a = Number(item[seriesA.key]) || 0
          const b = Number(item[seriesB.key]) || 0
          const selected = selectedKey === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              title={`${getLabel(item)} · ${seriesA.label}: ${formatValue?.(a) ?? a} · ${seriesB.label}: ${formatValue?.(b) ?? b}`}
              onClick={() => onSelect?.(selected ? null : item)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-lg px-0.5 py-1 transition touch-manipulation ${
                selected
                  ? 'bg-[var(--app-accent-soft)] ring-1 ring-[var(--app-accent)]'
                  : 'active:bg-[var(--app-surface-muted)] sm:hover:bg-[var(--app-surface-muted)]'
              }`}
            >
              <div className="flex w-full max-w-[3rem] items-end justify-center gap-0.5" style={{ height: height - 28 }}>
                <span
                  className={`w-[45%] max-w-4 rounded-t-sm ${seriesA.tone}`}
                  style={{ height: `${Math.max(Math.round((a / max) * 100), a > 0 ? 8 : 2)}%` }}
                />
                <span
                  className={`w-[45%] max-w-4 rounded-t-sm ${seriesB.tone}`}
                  style={{ height: `${Math.max(Math.round((b / max) * 100), b > 0 ? 8 : 2)}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-[9px] text-[var(--app-text-muted)]">
                {getLabel(item)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DayDetailPanel({ day, onOpenTransfer, t }) {
  if (!day) return null
  return (
    <div className="mt-4 min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
        {t('exchanger.charts.dayDetail', { date: day.date })}
      </p>
      <p className="mt-1 break-words text-sm text-[var(--app-text-muted)]">
        {t('exchanger.charts.daySummary', {
          count: day.count,
          completed: day.completed || 0,
          volume: Math.round(day.volume).toLocaleString('fr-FR'),
        })}
      </p>
      {day.transfers.length ? (
        <ul className="mt-3 grid max-h-56 gap-2 overflow-y-auto">
          {day.transfers.slice(0, 12).map((transfer) => {
            const pricing = getTransferPricing(transfer)
            return (
              <li key={transfer.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenTransfer(transfer)}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-left text-sm transition active:bg-[var(--app-surface-muted)] sm:hover:ring-1 sm:hover:ring-brand-300"
                >
                  <span className="min-w-0 truncate font-bold">
                    {transfer.sender?.firstName || t('exchanger.queue.client')} · {transfer.id}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-[var(--app-text-muted)] sm:text-sm">
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

function MonthDetailPanel({ month, t }) {
  if (!month) return null
  return (
    <div className="mt-4 grid gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm sm:grid-cols-2 sm:p-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
          {t('exchanger.charts.created')}
        </p>
        <p className="mt-1 font-bold tabular-nums">
          {month.created} · {Math.round(month.volumeCreated || 0).toLocaleString('fr-FR')}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
          {t('exchanger.charts.completed')}
        </p>
        <p className="mt-1 font-bold tabular-nums">
          {month.completed} · {Math.round(month.volumeCompleted || 0).toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  )
}

function TrendBanner({ trend, t }) {
  if (!trend) return null
  const createdUp = trend.created.delta >= 0
  const completedUp = trend.completed.delta >= 0
  return (
    <Card className="min-w-0 overflow-hidden !p-4 sm:!p-5 xl:col-span-2">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <FiTrendingUp className="shrink-0 text-[var(--app-accent)]" />
        <p className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)] sm:text-sm">
          {t('exchanger.charts.trendTitle')}
        </p>
      </div>
      <p className="text-sm text-[var(--app-text-muted)]">
        {t('exchanger.charts.trendCompare', {
          current: trend.currentLabel,
          previous: trend.previousLabel,
        })}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.charts.created')}
          </p>
          <p className="mt-1 text-lg font-black tabular-nums">{trend.created.current}</p>
          <p
            className={`mt-0.5 text-xs font-bold tabular-nums ${
              createdUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatTrendDelta(trend.created.delta, trend.created.pct)}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.charts.completed')}
          </p>
          <p className="mt-1 text-lg font-black tabular-nums">{trend.completed.current}</p>
          <p
            className={`mt-0.5 text-xs font-bold tabular-nums ${
              completedUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatTrendDelta(trend.completed.delta, trend.completed.pct)}
          </p>
        </div>
      </div>
    </Card>
  )
}

function StatusBarsSkeleton() {
  // 5 pastilles rondes : réserve clairement la place du bloc « Répartition par statut »
  return (
    <div
      className="mt-5 flex min-h-[5.5rem] items-center justify-between gap-2 px-1 sm:min-h-[6.5rem] sm:gap-3"
      aria-hidden="true"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          className="aspect-square w-full max-w-[3.25rem] sm:max-w-[3.75rem]"
          rounded="rounded-full"
        />
      ))}
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-2" aria-busy="true" aria-label="…">
      <Card className="min-w-0 !p-4 sm:!p-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <Skeleton className="mt-3 h-3 w-3/4" />
      </Card>
      <Card className="min-w-0 !p-4 sm:!p-6">
        <Skeleton className="h-3 w-36" rounded="rounded-full" />
        <StatusBarsSkeleton />
      </Card>
      <div className="grid gap-3 xl:col-span-2 sm:grid-cols-2">
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <Card className="min-w-0 !p-4 sm:!p-6 xl:col-span-2">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="mt-4 h-28 w-full rounded-xl" />
      </Card>
    </div>
  )
}

export function InteractiveCharts({
  transfers,
  stats,
  statusFilter,
  onStatusFilter,
  onOpenTransfer,
  loading = false,
  t,
}) {
  const activity = useMemo(() => build30DayActivity(transfers), [transfers])
  const trend = useMemo(() => computeMonthlyTrend(stats.monthly || []), [stats.monthly])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const statusData = useMemo(
    () => (stats.statusBreakdown || []).filter((item) => item.count > 0),
    [stats.statusBreakdown],
  )
  const maxStatus = Math.max(...statusData.map((item) => item.count), 1)
  const monthly = stats.monthly || []
  const hasActivity = activity.some((d) => d.count > 0)
  const hasMonthly = monthly.some((m) => m.created > 0 || m.completed > 0)

  if (loading) return <ChartsSkeleton />

  return (
    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-2">
      <Card className="min-w-0 overflow-hidden !p-4 sm:!p-6">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <FiCalendar className="shrink-0 text-[var(--app-accent)]" />
          <p className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)] sm:text-sm">
            {t('exchanger.charts.activityTitle')}
          </p>
        </div>
        {hasActivity ? (
          <>
            <InteractiveBarChart
              data={activity}
              selectedKey={selectedDay?.date || null}
              onSelect={(item) => setSelectedDay(item)}
              getKey={(item) => item.date}
              getLabel={(item) => item.label}
              height={100}
              scrollable
              labelEvery={5}
              scrollHint={t('exchanger.charts.scrollHint')}
            />
            <DayDetailPanel day={selectedDay} onOpenTransfer={onOpenTransfer} t={t} />
          </>
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.charts.noTransfers')}</p>
        )}
      </Card>

      <Card className="min-w-0 overflow-hidden !p-4 sm:!p-6">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <FiLayers className="shrink-0 text-[var(--app-accent)]" />
          <p className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)] sm:text-sm">
            {t('exchanger.charts.statusTitle')}
          </p>
        </div>
        {statusData.length ? (
          <div className="grid gap-2 sm:gap-3">
            {statusData.map((item) => {
              const selected = statusFilter === item.status
              const pct = Math.round((item.count / maxStatus) * 100)
              return (
                <button
                  key={item.status}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onStatusFilter(selected ? null : item.status)}
                  className={`grid min-w-0 gap-1 rounded-xl p-2.5 text-left transition touch-manipulation ${
                    selected
                      ? 'bg-[var(--app-accent-soft)] ring-1 ring-[var(--app-accent)]'
                      : 'active:bg-[var(--app-surface-muted)] sm:hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-bold">{t(statusLabelKey(item.status))}</span>
                    <span className="shrink-0 tabular-nums text-[var(--app-text-muted)]">{item.count}</span>
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

      <TrendBanner trend={trend} t={t} />

      <Card className="min-w-0 overflow-hidden !p-4 sm:!p-6 xl:col-span-2">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <FiBarChart2 className="shrink-0 text-[var(--app-accent)]" />
          <p className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)] sm:text-sm">
            {t('exchanger.charts.monthlyTitle')}
          </p>
        </div>
        {hasMonthly ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold text-[var(--app-text-muted)]">
                {t('exchanger.charts.countSeries')}
              </p>
              <DualSeriesBarChart
                data={monthly}
                seriesA={{
                  key: 'created',
                  label: t('exchanger.charts.created'),
                  tone: 'bg-brand-500',
                }}
                seriesB={{
                  key: 'completed',
                  label: t('exchanger.charts.completed'),
                  tone: 'bg-emerald-500',
                }}
                selectedKey={selectedMonth?.key || null}
                onSelect={setSelectedMonth}
                getKey={(item) => item.key}
                getLabel={(item) => item.label}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold text-[var(--app-text-muted)]">
                {t('exchanger.charts.volumeSeries')}
              </p>
              <DualSeriesBarChart
                data={monthly}
                seriesA={{
                  key: 'volumeCreated',
                  label: t('exchanger.charts.volumeCreated'),
                  tone: 'bg-teal-500',
                }}
                seriesB={{
                  key: 'volumeCompleted',
                  label: t('exchanger.charts.volumeCompleted'),
                  tone: 'bg-cyan-500',
                }}
                selectedKey={selectedMonth?.key || null}
                onSelect={setSelectedMonth}
                getKey={(item) => item.key}
                getLabel={(item) => item.label}
                formatValue={(v) => Math.round(v).toLocaleString('fr-FR')}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.charts.noTransfers')}</p>
        )}
        <MonthDetailPanel month={selectedMonth} t={t} />
      </Card>
    </div>
  )
}
