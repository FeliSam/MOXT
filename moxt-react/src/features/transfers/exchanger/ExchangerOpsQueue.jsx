import { FiClock, FiZap } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import {
  canActorPerformBusinessTransferAction,
} from '../transferActionUtils'
import { TRANSFER_STATUS } from '../transferConfig'
import { TransferStatusBadge } from '../TransferStatusBadge'
import {
  directionInfo,
  formatMoney,
  getTransferPricing,
} from '../transferUtils'
import { ACTIONABLE_STATUSES, PIPELINE_COLUMNS } from './exchangerChartUtils'
import { statusLabelKey } from './statusLabels'

function TransferOpsCard({ transfer, user, onManage, t }) {
  const canAct = canActorPerformBusinessTransferAction(transfer, user?.id, user?.role)
  const needsAction =
    canAct && ACTIONABLE_STATUSES.includes(transfer.status)
  const pricing = getTransferPricing(transfer)
  const info = directionInfo(transfer.direction, transfer.originCountry)
  const currencyFrom = transfer.currencyFrom || info.from
  const currencyTo = transfer.currencyTo || info.to
  const note = String(transfer.noteToExchanger || '').trim()

  return (
    <div
      className={`rounded-2xl border p-3 ${
        needsAction
          ? 'border-brand-300 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-950/20'
          : 'border-[var(--app-border)] bg-[var(--app-surface)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--app-text)]">
            {formatMoney(pricing.amountSent, currencyFrom)}
            <span className="mx-1 text-[var(--app-text-faint)]">→</span>
            {transfer.amountReceived
              ? formatMoney(transfer.amountReceived, currencyTo)
              : formatMoney(pricing.amountReceived, currencyTo)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--app-text-muted)]">
            {transfer.sender?.firstName || t('exchanger.queue.client')} · {transfer.id}
          </p>
          {note ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--app-text-faint)]">{note}</p>
          ) : null}
          {transfer.paymentDeadlineAt && transfer.status === TRANSFER_STATUS.PENDING ? (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
              <FiClock />
              {t('exchanger.queue.deadline', {
                date: new Date(transfer.paymentDeadlineAt).toLocaleString(),
              })}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TransferStatusBadge status={transfer.status} />
          <Button size="sm" variant={needsAction ? 'primary' : 'secondary'} onClick={() => onManage(transfer)}>
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
  t,
}) {
  const actionable = transfers.filter((item) => ACTIONABLE_STATUSES.includes(item.status))
  const filtered = statusFilter
    ? transfers.filter((item) => item.status === statusFilter)
    : transfers

  const grouped = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.key] = filtered.filter((item) => item.status === col.key)
    return acc
  }, {})

  const activeColumns = PIPELINE_COLUMNS.filter((col) => grouped[col.key]?.length)

  return (
    <div className="grid gap-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.queue.actionTitle')}
            <span className="ml-2 rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--app-text-muted)]">
              {actionable.length}
            </span>
          </p>
        </div>
        {actionable.length ? (
          <div className="grid gap-2">
            {actionable.map((transfer) => (
              <TransferOpsCard
                key={transfer.id}
                transfer={transfer}
                user={user}
                onManage={onManage}
                t={t}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.queue.actionEmpty')}</p>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-wide text-[var(--app-text-faint)]">
            {t('exchanger.pipeline.title')}
          </p>
          {statusFilter ? (
            <Button size="sm" variant="secondary" onClick={onClearFilter}>
              {t('exchanger.pipeline.clearFilter', {
                status: t(statusLabelKey(statusFilter)),
              })}
            </Button>
          ) : null}
        </div>

        {!activeColumns.length ? (
          <Card>
            <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.pipeline.empty')}</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeColumns.map((col) => (
              <div key={col.key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[var(--app-text-faint)]">
                    {t(statusLabelKey(col.key))}
                  </span>
                  <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-muted)]">
                    {grouped[col.key].length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {grouped[col.key].map((transfer) => (
                    <TransferOpsCard
                      key={transfer.id}
                      transfer={transfer}
                      user={user}
                      onManage={onManage}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
