import { useMemo, useState } from 'react'
import { FiClock, FiZap } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { LinkifiedText } from '../../../components/ui/LinkifiedText'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { canActorPerformBusinessTransferAction } from '../transferActionUtils'
import { TRANSFER_STATUS } from '../transferConfig'
import { TransferStatusBadge } from '../TransferStatusBadge'
import { directionInfo, formatMoney, getTransferPricing } from '../transferUtils'
import {
  ACTIONABLE_STATUSES,
  PIPELINE_COLUMNS,
  PIPELINE_PER_COLUMN_LIMIT,
  QUEUE_ACTIONABLE_LIMIT,
  sortActionableTransfers,
} from './exchangerChartUtils'
import { statusLabelKey } from './statusLabels'
import { sortTransfersByNewest } from '../transferSelectors'

function TransferOpsCard({ transfer, user, onManage, t }) {
  const canAct = canActorPerformBusinessTransferAction(transfer, user?.id, user?.role)
  const needsAction = canAct && ACTIONABLE_STATUSES.includes(transfer.status)
  const pricing = getTransferPricing(transfer)
  const info = directionInfo(transfer.direction, transfer.originCountry)
  const currencyFrom = transfer.currencyFrom || info.from
  const currencyTo = transfer.currencyTo || info.to
  const note = String(transfer.noteToExchanger || '').trim()

  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 ${
        needsAction
          ? 'border-brand-300 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-950/20'
          : 'border-[var(--app-border)] bg-[var(--app-surface)]'
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold text-[var(--app-text)]">
            <span className="inline-block max-w-full truncate align-bottom">
              {formatMoney(pricing.amountSent, currencyFrom)}
            </span>
            <span className="mx-1 text-[var(--app-text-faint)]">→</span>
            <span className="inline-block max-w-full truncate align-bottom">
              {transfer.amountReceived
                ? formatMoney(transfer.amountReceived, currencyTo)
                : formatMoney(pricing.amountReceived, currencyTo)}
            </span>
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">
            {transfer.sender?.firstName || t('exchanger.queue.client')} · {transfer.id}
          </p>
          {note ? (
            <LinkifiedText
              as="p"
              text={note}
              preserveWhitespace="pre-line"
              className="mt-1 line-clamp-2 text-xs text-[var(--app-text-faint)]"
            />
          ) : null}
          {transfer.paymentDeadlineAt && transfer.status === TRANSFER_STATUS.PENDING ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
              <FiClock className="shrink-0" />
              <span className="min-w-0 break-words">
                {t('exchanger.queue.deadline', {
                  date: new Date(transfer.paymentDeadlineAt).toLocaleString(),
                })}
              </span>
            </p>
          ) : null}
          {transfer.acceptanceExpiresAt &&
          transfer.status === TRANSFER_STATUS.PENDING_ACCEPTANCE ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
              <FiClock className="shrink-0" />
              <span className="min-w-0 break-words">
                {t('transfers.acceptance.queueDeadline', {
                  date: new Date(transfer.acceptanceExpiresAt).toLocaleString(),
                })}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5">
          <TransferStatusBadge status={transfer.status} />
          <Button
            size="sm"
            variant={needsAction ? 'primary' : 'secondary'}
            className="shrink-0"
            onClick={() => onManage(transfer)}
          >
            {needsAction ? <FiZap className="text-xs" /> : null}
            <span className="text-xs">
              {needsAction ? t('exchanger.actions.manage') : t('exchanger.actions.detail')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ExchangerOpsQueue({
  transfers,
  user,
  statusFilter,
  onClearFilter,
  onManage,
  loading = false,
  t,
}) {
  const [showAllActionable, setShowAllActionable] = useState(false)
  const [expandedColumns, setExpandedColumns] = useState(() => new Set())

  const actionableAll = useMemo(
    () =>
      sortActionableTransfers(
        transfers.filter((item) => ACTIONABLE_STATUSES.includes(item.status)),
      ),
    [transfers],
  )

  const actionable = showAllActionable
    ? actionableAll
    : actionableAll.slice(0, QUEUE_ACTIONABLE_LIMIT)
  const actionableHidden = Math.max(0, actionableAll.length - actionable.length)

  const filtered = useMemo(
    () =>
      sortTransfersByNewest(
        statusFilter ? transfers.filter((item) => item.status === statusFilter) : transfers,
      ),
    [statusFilter, transfers],
  )

  const grouped = useMemo(
    () =>
      PIPELINE_COLUMNS.reduce((acc, col) => {
        acc[col.key] = filtered.filter((item) => item.status === col.key)
        return acc
      }, {}),
    [filtered],
  )

  const activeColumns = PIPELINE_COLUMNS.filter((col) => grouped[col.key]?.length)

  if (loading) {
    return (
      <div className="grid min-w-0 gap-5 sm:gap-6" aria-busy="true">
        <section className="min-w-0">
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.queue.actionTitle')}
          </p>
          <SkeletonList count={3} hasAvatar={false} />
        </section>
        <section className="min-w-0">
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.pipeline.title')}
          </p>
          <SkeletonList count={4} hasAvatar={false} />
        </section>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.queue.actionTitle')}
            <span className="ml-2 rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--app-text-muted)]">
              {actionableAll.length}
            </span>
          </p>
        </div>
        {actionableAll.length ? (
          <div className="grid min-w-0 gap-2">
            {actionable.map((transfer) => (
              <TransferOpsCard
                key={transfer.id}
                transfer={transfer}
                user={user}
                onManage={onManage}
                t={t}
              />
            ))}
            {actionableHidden > 0 ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowAllActionable(true)}
              >
                {t('exchanger.queue.showMore', { count: actionableHidden })}
              </Button>
            ) : null}
            {showAllActionable && actionableAll.length > QUEUE_ACTIONABLE_LIMIT ? (
              <Button variant="secondary" className="w-full" onClick={() => setShowAllActionable(false)}>
                {t('exchanger.queue.showLess')}
              </Button>
            ) : null}
          </div>
        ) : (
          <Card className="min-w-0">
            <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.queue.actionEmpty')}</p>
          </Card>
        )}
      </section>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.pipeline.title')}
          </p>
          {statusFilter ? (
            <Button size="sm" variant="secondary" className="max-w-full shrink-0" onClick={onClearFilter}>
              <span className="truncate">
                {t('exchanger.pipeline.clearFilter', {
                  status: t(statusLabelKey(statusFilter)),
                })}
              </span>
            </Button>
          ) : null}
        </div>

        {!activeColumns.length ? (
          <Card className="min-w-0">
            <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.pipeline.empty')}</p>
          </Card>
        ) : (
          <div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeColumns.map((col) => {
              const all = grouped[col.key]
              const expanded = expandedColumns.has(col.key)
              const visible = expanded ? all : all.slice(0, PIPELINE_PER_COLUMN_LIMIT)
              const hidden = Math.max(0, all.length - visible.length)
              return (
                <div key={col.key} className="min-w-0">
                  <div className="mb-2 flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
                      {t(statusLabelKey(col.key))}
                    </span>
                    <span className="shrink-0 rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
                      {all.length}
                    </span>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    {visible.map((transfer) => (
                      <TransferOpsCard
                        key={transfer.id}
                        transfer={transfer}
                        user={user}
                        onManage={onManage}
                        t={t}
                      />
                    ))}
                    {hidden > 0 ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                          setExpandedColumns((prev) => {
                            const next = new Set(prev)
                            next.add(col.key)
                            return next
                          })
                        }
                      >
                        {t('exchanger.queue.showMore', { count: hidden })}
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
