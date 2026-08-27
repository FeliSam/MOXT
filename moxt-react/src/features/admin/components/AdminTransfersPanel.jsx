import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiEye,
  FiRepeat,
  FiShield,
  FiSlash,
} from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { computeBusinessTransferStats } from '../../transfers/businessTransferStats'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../../transfers/transferConfig'
import { statusLabelKey } from '../../transfers/exchanger/statusLabels'
import { moderateTransfer } from '../../transfers/transferSlice'
import { updateBusinessTransferPricing } from '../../businesses/businessSlice'
import { sortTransfersByNewest } from '../../transfers/transferSelectors'
import {
  directionInfo,
  directionLabel,
  formatDate,
  formatMoney,
  getTransferPricing,
} from '../../transfers/transferUtils'
import { addToast } from '../../ui/uiSlice'
import { confirmedClick } from '../adminActions'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { buildBusinessTransferRollups, countTransferProofs, lastTransferTimelineEvent } from '../adminData'
import { ADMIN_PAGE_SIZE, paginateItems, statusDotColor } from '../adminUtils'
import { Empty, MetricCard, SectionTitle } from './AdminShared'

function formatVolumeRows(rows) {
  return (rows || [])
    .filter((row) => Number(row.amount) > 0)
    .map((row) => formatMoney(row.amount, row.currency))
}

function PaginationBar({ pageState, onPageChange, t, className = '' }) {
  const { from, to, total, page, pageCount } = pageState
  if (total === 0) return null
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] pt-3 ${className}`}>
      <p className="text-xs font-bold text-[var(--app-text-muted)]">
        {adminText(t, 'admin.transfers.pageRange', { from, to, total })}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={FiChevronLeft}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {adminText(t, 'admin.transfers.pagePrev')}
          </Button>
          <span className="min-w-10 text-center text-xs font-black tabular-nums text-[var(--app-text-muted)]">
            {page}/{pageCount}
          </span>
          <Button
            size="sm"
            variant="secondary"
            iconRight={FiChevronRight}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {adminText(t, 'admin.transfers.pageNext')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CurrencyStack({ rows, emptyLabel }) {
  const visible = formatVolumeRows(rows)
  if (!visible.length) {
    return <p className="text-sm text-[var(--app-text-muted)]">{emptyLabel}</p>
  }
  return (
    <ul className="grid gap-1.5">
      {visible.map((label, index) => (
        <li key={`${label}-${index}`} className="text-sm font-black tabular-nums">
          {label}
        </li>
      ))}
    </ul>
  )
}

export function AdminTransfersPanel({
  businessIdFilter,
  businessTransferRollups = [],
  dispatch,
  setBusinessIdFilter,
  setSelected,
  transfers,
}) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items || [])
  const [detailStatus, setDetailStatus] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [proofFilter, setProofFilter] = useState('all')
  const [transferPage, setTransferPage] = useState(1)
  const [rollupPage, setRollupPage] = useState(1)

  const businessById = useMemo(
    () => new Map((businesses || []).map((item) => [item.id, item])),
    [businesses],
  )

  const businessOptions = useMemo(
    () =>
      businesses
        .filter((business) =>
          businessTransferRollups.some((rollup) => rollup.businessId === business.id),
        )
        .map((business) => ({ value: business.id, label: business.name || business.id })),
    [businesses, businessTransferRollups],
  )

  const orderedTransfers = useMemo(() => sortTransfersByNewest(transfers), [transfers])

  const currencyOptions = useMemo(() => {
    const codes = new Set()
    for (const transfer of orderedTransfers) {
      const info = directionInfo(transfer.direction, transfer.originCountry)
      if (transfer.currencyFrom || info.from) codes.add(transfer.currencyFrom || info.from)
      if (transfer.currencyTo || info.to) codes.add(transfer.currencyTo || info.to)
    }
    return [...codes].filter(Boolean).sort()
  }, [orderedTransfers])

  const directionOptions = useMemo(() => {
    const values = new Set(orderedTransfers.map((item) => item.direction).filter(Boolean))
    return [...values]
  }, [orderedTransfers])

  const filteredTransfers = useMemo(() => {
    return orderedTransfers.filter((transfer) => {
      if (detailStatus !== 'all' && transfer.status !== detailStatus) return false
      const info = directionInfo(transfer.direction, transfer.originCountry)
      const from = transfer.currencyFrom || info.from
      const to = transfer.currencyTo || info.to
      if (currencyFilter && from !== currencyFilter && to !== currencyFilter) return false
      if (directionFilter && transfer.direction !== directionFilter) return false
      if (proofFilter === 'with' && countTransferProofs(transfer) === 0) return false
      if (proofFilter === 'none' && countTransferProofs(transfer) > 0) return false
      return true
    })
  }, [currencyFilter, detailStatus, directionFilter, orderedTransfers, proofFilter])

  const flowStats = useMemo(
    () => computeBusinessTransferStats(filteredTransfers),
    [filteredTransfers],
  )

  const visibleRollups = useMemo(
    () => buildBusinessTransferRollups(filteredTransfers, businesses),
    [businesses, filteredTransfers],
  )

  const pagedTransfers = useMemo(
    () => paginateItems(filteredTransfers, transferPage, ADMIN_PAGE_SIZE),
    [filteredTransfers, transferPage],
  )
  const pagedRollups = useMemo(
    () => paginateItems(visibleRollups, rollupPage, ADMIN_PAGE_SIZE),
    [rollupPage, visibleRollups],
  )
  useEffect(() => {
    setTransferPage(1)
    setRollupPage(1)
  }, [businessIdFilter, currencyFilter, detailStatus, directionFilter, proofFilter])

  const hasLocalFilters =
    Boolean(businessIdFilter) ||
    detailStatus !== 'all' ||
    Boolean(currencyFilter) ||
    Boolean(directionFilter) ||
    proofFilter !== 'all'

  function resetLocalFilters() {
    setDetailStatus('all')
    setCurrencyFilter('')
    setDirectionFilter('')
    setProofFilter('all')
    setBusinessIdFilter('')
  }

  function toggleAcceptance(business) {
    const enabled = business.transferAcceptanceRequired === true
    dispatch(
      updateBusinessTransferPricing({
        businessId: business.id,
        ownerId: business.ownerId,
        actorRole: user?.role || 'admin',
        transferAcceptanceRequired: !enabled,
      }),
    )
    dispatch(
      addToast({
        title: adminText(t, 'admin.transfers.acceptanceUpdatedTitle'),
        message: adminText(t, 'admin.transfers.acceptanceUpdatedBody', {
          name: business.name,
          state: !enabled
            ? adminText(t, 'admin.transfers.acceptanceOn')
            : adminText(t, 'admin.transfers.acceptanceOff'),
        }),
        tone: 'success',
      }),
    )
  }

  const statusMax = Math.max(...flowStats.statusBreakdown.map((row) => row.count), 1)

  return (
    <div className="grid gap-5">
      <div className={`${CARD} grid gap-4 p-5`}>
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.02em]">
            {adminText(t, 'admin.transfers.flowTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {adminText(t, 'admin.transfers.flowDescription')}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={FiRepeat}
            label={adminText(t, 'admin.transfers.metric.total')}
            value={flowStats.total}
            gradient="from-teal-600 to-cyan-500"
          />
          <MetricCard
            icon={FiClock}
            label={adminText(t, 'admin.transfers.metric.pipeline')}
            value={flowStats.inPipeline}
            gradient="from-amber-500 to-orange-500"
          />
          <MetricCard
            icon={FiAlertTriangle}
            label={adminText(t, 'admin.transfers.metric.awaiting')}
            value={flowStats.awaitingBusinessAction}
            gradient="from-orange-500 to-rose-500"
          />
          <MetricCard
            icon={FiCheckCircle}
            label={adminText(t, 'admin.transfers.metric.completed')}
            value={flowStats.completed}
            gradient="from-emerald-600 to-green-500"
          />
          <MetricCard
            icon={FiSlash}
            label={adminText(t, 'admin.transfers.metric.cancelled')}
            value={flowStats.cancelledOrExpired}
            gradient="from-slate-500 to-slate-700"
          />
          <MetricCard
            icon={FiDollarSign}
            label={adminText(t, 'admin.transfers.metric.volume')}
            value={
              formatVolumeRows(flowStats.volumes.sent)[0] ||
              formatMoney(0, 'XOF')
            }
            gradient="from-cyan-600 to-sky-500"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className={`${CARD} grid gap-4 p-5`}>
          <SectionTitle icon={FiRepeat} label={adminText(t, 'admin.transfers.statusBreakdown')} />
          <div className="grid gap-2.5">
            {flowStats.statusBreakdown.map((row) => {
              const pct = Math.round((row.count / statusMax) * 100)
              const active = detailStatus === row.status
              return (
                <button
                  key={row.status}
                  type="button"
                  onClick={() => setDetailStatus(active ? 'all' : row.status)}
                  className={`grid gap-1 rounded-xl px-2 py-1.5 text-left transition ${
                    active ? 'bg-[var(--app-accent-soft)]' : 'hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="min-w-0 truncate">{t(statusLabelKey(row.status))}</span>
                    <span className="tabular-nums text-[var(--app-text-muted)]">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-5">
          <div className={`${CARD} grid gap-3 p-5`}>
            <SectionTitle icon={FiDollarSign} label={adminText(t, 'admin.transfers.volumesSent')} />
            <CurrencyStack
              rows={flowStats.volumes.sent}
              emptyLabel={adminText(t, 'admin.transfers.noVolume')}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={`${CARD} grid gap-3 p-5`}>
              <SectionTitle icon={FiCheckCircle} label={adminText(t, 'admin.transfers.volumesReceived')} />
              <CurrencyStack
                rows={flowStats.volumes.received}
                emptyLabel={adminText(t, 'admin.transfers.noVolume')}
              />
            </div>
            <div className={`${CARD} grid gap-3 p-5`}>
              <SectionTitle icon={FiDollarSign} label={adminText(t, 'admin.transfers.volumesFees')} />
              <CurrencyStack
                rows={flowStats.volumes.fees}
                emptyLabel={adminText(t, 'admin.transfers.noVolume')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle
          icon={FiRepeat}
          label={adminText(t, 'admin.transfers.listTitle')}
          count={filteredTransfers.length}
          action={
            hasLocalFilters ? (
              <Button size="sm" variant="ghost" onClick={resetLocalFilters}>
                {adminText(t, 'admin.transfers.resetFilters')}
              </Button>
            ) : null
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            label={adminText(t, 'admin.transfers.filterBusiness')}
            value={businessIdFilter || ''}
            onChange={(event) => setBusinessIdFilter(event.target.value)}
          >
            <option value="">{adminText(t, 'admin.filters.all')}</option>
            {businessOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label={adminText(t, 'admin.transfers.filterStatus')}
            value={detailStatus}
            onChange={(event) => setDetailStatus(event.target.value)}
          >
            <option value="all">{adminText(t, 'admin.filters.all')}</option>
            {Object.values(TRANSFER_STATUS).map((status) => (
              <option key={status} value={status}>
                {t(statusLabelKey(status))}
              </option>
            ))}
          </Select>
          <Select
            label={adminText(t, 'admin.transfers.filterCurrency')}
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
          >
            <option value="">{adminText(t, 'admin.filters.all')}</option>
            {currencyOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
          <Select
            label={adminText(t, 'admin.transfers.filterDirection')}
            value={directionFilter}
            onChange={(event) => setDirectionFilter(event.target.value)}
          >
            <option value="">{adminText(t, 'admin.filters.all')}</option>
            {directionOptions.map((direction) => (
              <option key={direction} value={direction}>
                {directionLabel(direction, t)}
              </option>
            ))}
          </Select>
          <Select
            label={adminText(t, 'admin.transfers.filterProofs')}
            value={proofFilter}
            onChange={(event) => setProofFilter(event.target.value)}
          >
            <option value="all">{adminText(t, 'admin.transfers.proofsAll')}</option>
            <option value="with">{adminText(t, 'admin.transfers.proofsWith')}</option>
            <option value="none">{adminText(t, 'admin.transfers.proofsNone')}</option>
          </Select>
        </div>
        {pagedTransfers.total ? (
          <>
            {pagedTransfers.items.map((transfer) => {
              const next = TRANSFER_TRANSITIONS[transfer.status]
              const lastEvent = lastTransferTimelineEvent(transfer)
              const info = directionInfo(transfer.direction, transfer.originCountry)
              const pricing = getTransferPricing(transfer)
              const currencyFrom = transfer.currencyFrom || info.from
              const currencyTo = transfer.currencyTo || info.to
              const proofCount = countTransferProofs(transfer)
              const senderName = `${transfer.sender?.firstName || ''} ${transfer.sender?.lastName || ''}`.trim()
              const recipientName =
                `${transfer.recipient?.firstName || ''} ${transfer.recipient?.lastName || ''}`.trim()
              return (
                <div key={transfer.id} className={`${ITEM} grid gap-3`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${statusDotColor(transfer.status)}`} />
                    <button
                      type="button"
                      onClick={() => setSelected({ kind: 'transfer', item: transfer })}
                      className="min-w-0 flex-1 text-left hover:text-brand-700"
                    >
                      <strong className="block text-sm">{transfer.id}</strong>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        {[
                          senderName || null,
                          recipientName ? `→ ${recipientName}` : null,
                          transfer.businessName || transfer.exchanger?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--app-text-muted)]">
                        {directionLabel(transfer.direction, t)}
                        {` · ${currencyFrom} → ${currencyTo}`}
                        {transfer.createdAt
                          ? ` · ${adminText(t, 'admin.transfers.createdAt', {
                              date: formatDate(transfer.createdAt),
                            })}`
                          : ''}
                      </p>
                      {lastEvent ? (
                        <p className="text-[10px] text-[var(--app-text-muted)]">
                          {t(statusLabelKey(lastEvent.status)) !== statusLabelKey(lastEvent.status)
                            ? t(statusLabelKey(lastEvent.status))
                            : lastEvent.status || lastEvent.label}
                          {proofCount > 0
                            ? ` · ${adminText(t, 'admin.transfers.proofCount', { count: proofCount })}`
                            : ''}
                        </p>
                      ) : null}
                    </button>
                    <TransferStatusBadge status={transfer.status} />
                    <div className="ml-auto text-right">
                      <p className="text-sm font-black">{formatMoney(pricing.amountSent, currencyFrom)}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        {transfer.amountReceived
                          ? adminText(t, 'admin.transfers.receivedSuffix', {
                              amount: formatMoney(transfer.amountReceived, currencyTo),
                            })
                          : ''}
                      </p>
                      <p className="text-[10px] text-[var(--app-text-muted)]">
                        {adminText(t, 'admin.transfers.fees', {
                          amount: formatMoney(pricing.fees, currencyFrom),
                        })}
                        {transfer.rate
                          ? ` · ${adminText(t, 'admin.transfers.rate', { rate: Number(transfer.rate).toFixed(4) })}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/transfers/${transfer.id}`}>
                      <Button variant="secondary" icon={FiEye}>{adminText(t, 'admin.actions.open')}</Button>
                    </Link>
                    {next && (
                      <Button
                        onClick={confirmedClick(
                          t,
                          adminText(t, 'admin.actions.advanceTo', { next: t(statusLabelKey(next)) }),
                          () =>
                            dispatch(
                              moderateTransfer({
                                id: transfer.id,
                                status: next,
                                actorId: user?.id,
                                actorRole: user?.role || 'admin',
                                proof:
                                  next === TRANSFER_STATUS.PAID_OUT
                                    ? transfer.businessProof || {
                                        name: 'admin-advance.pdf',
                                        uploadedAt: new Date().toISOString(),
                                      }
                                    : undefined,
                              }),
                            ),
                        )}
                      >
                        {adminText(t, 'admin.actions.advanceTo', { next: t(statusLabelKey(next)) })}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            <PaginationBar
              pageState={pagedTransfers}
              onPageChange={setTransferPage}
              t={t}
              className="pb-16 sm:pb-0"
            />
          </>
        ) : (
          <Empty
            label={adminText(t, 'admin.empty.noTransferFound')}
            sub={adminText(t, 'admin.empty.tryFilters')}
            icon={FiRepeat}
          />
        )}
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle
          icon={FiRepeat}
          label={adminText(t, 'admin.transfers.byBusinessTitle')}
          count={visibleRollups.length}
        />
        <p className="text-sm text-[var(--app-text-muted)]">
          {adminText(t, 'admin.transfers.acceptanceDescription')}
        </p>
        {pagedRollups.total ? (
          <>
            {pagedRollups.items.map((rollup) => {
              const sent = formatVolumeRows(rollup.stats?.volumes?.sent)
              const received = formatVolumeRows(rollup.stats?.volumes?.received)
              const business = rollup.businessId ? businessById.get(rollup.businessId) : null
              const acceptanceOn = business?.transferAcceptanceRequired === true
              return (
                <div key={rollup.businessId || rollup.name} className={`${ITEM} flex flex-wrap items-center gap-3`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{rollup.name}</strong>
                      {acceptanceOn ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                          {adminText(t, 'admin.transfers.acceptanceBadge')}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {adminText(t, 'admin.transfers.rollupSummary', {
                        total: rollup.count,
                        pending: rollup.pending,
                      })}
                      {rollup.stats?.awaitingBusinessAction
                        ? ` · ${adminText(t, 'admin.transfers.rollupAwaiting', {
                            count: rollup.stats.awaitingBusinessAction,
                          })}`
                        : ''}
                    </p>
                    {sent.length || received.length ? (
                      <p className="mt-1 text-[11px] text-[var(--app-text-muted)]">
                        {[
                          sent[0],
                          received[0]
                            ? adminText(t, 'admin.transfers.receivedSuffix', { amount: received[0] })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {business ? (
                      <Button
                        size="sm"
                        variant={acceptanceOn ? 'danger' : 'secondary'}
                        icon={FiShield}
                        onClick={confirmedClick(
                          t,
                          acceptanceOn
                            ? adminText(t, 'admin.transfers.disableAcceptance')
                            : adminText(t, 'admin.transfers.enableAcceptance'),
                          () => toggleAcceptance(business),
                        )}
                      >
                        {acceptanceOn
                          ? adminText(t, 'admin.transfers.disableAcceptance')
                          : adminText(t, 'admin.transfers.enableAcceptance')}
                      </Button>
                    ) : null}
                    {rollup.businessId ? (
                      <Link to={`/admin?view=transfers&businessId=${rollup.businessId}`}>
                        <Button size="sm" variant="secondary" icon={FiEye}>
                          {adminText(t, 'admin.transfers.viewBusiness')}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })}
            <PaginationBar pageState={pagedRollups} onPageChange={setRollupPage} t={t} />
          </>
        ) : (
          <Empty label={adminText(t, 'admin.transfers.noBusinessActivity')} icon={FiRepeat} />
        )}
      </div>
    </div>
  )
}
