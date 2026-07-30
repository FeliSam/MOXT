import { FiClock, FiDollarSign, FiEye, FiRepeat, FiShield } from 'react-icons/fi'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../../transfers/transferConfig'
import { moderateTransfer } from '../../transfers/transferSlice'
import { updateBusinessTransferPricing } from '../../businesses/businessSlice'
import { sortTransfersByNewest } from '../../transfers/transferSelectors'
import { formatMoney } from '../../transfers/transferUtils'
import { addToast } from '../../ui/uiSlice'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { countTransferProofs, lastTransferTimelineEvent } from '../adminData'
import { statusDotColor } from '../adminUtils'
import { Empty, MetricCard, SectionTitle } from './AdminShared'

function isTransferBusiness(business, rollupIds) {
  if (!business || business.deletedByUserAt) return false
  if (business.services?.includes('Transfert')) return true
  if (rollupIds.has(business.id)) return true
  if ((business.transferAccounts || []).length > 0) return true
  return false
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
  const [acceptanceQuery, setAcceptanceQuery] = useState('')

  const rollupIds = useMemo(
    () => new Set(businessTransferRollups.map((rollup) => rollup.businessId).filter(Boolean)),
    [businessTransferRollups],
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

  const transferBusinesses = useMemo(() => {
    const q = acceptanceQuery.trim().toLowerCase()
    return businesses
      .filter((business) => isTransferBusiness(business, rollupIds))
      .filter((business) => {
        if (!q) return true
        return String(business.name || '')
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'))
  }, [acceptanceQuery, businesses, rollupIds])

  const orderedTransfers = useMemo(() => sortTransfersByNewest(transfers), [transfers])
  const completedVolume = orderedTransfers
    .filter((i) => i.status === 'completed')
    .reduce((sum, i) => sum + Number(i.amountSent || 0), 0)
  const pending = orderedTransfers.filter((i) => !['completed', 'cancelled', 'expired'].includes(i.status))

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

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={FiRepeat} label={adminText(t, 'admin.transfers.metric.total')} value={orderedTransfers.length} gradient="from-teal-600 to-cyan-500" />
        <MetricCard icon={FiClock} label={adminText(t, 'admin.transfers.metric.pending')} value={pending.length} gradient="from-amber-500 to-orange-500" />
        <MetricCard icon={FiDollarSign} label={adminText(t, 'admin.transfers.metric.volume')} value={completedVolume ? formatMoney(completedVolume, 'XOF') : '0 XOF'} gradient="from-emerald-600 to-green-500" />
      </div>

      <div className={`${CARD} grid gap-3 border-brand-200 p-5 dark:border-brand-800`}>
        <SectionTitle
          icon={FiShield}
          label={adminText(t, 'admin.transfers.acceptanceTitle')}
          count={transferBusinesses.length}
        />
        <p className="text-sm text-[var(--app-text-muted)]">
          {adminText(t, 'admin.transfers.acceptanceDescription')}
        </p>
        <Input
          id="admin-acceptance-search"
          label={adminText(t, 'admin.transfers.acceptanceSearch')}
          value={acceptanceQuery}
          onChange={(event) => setAcceptanceQuery(event.target.value)}
          placeholder={adminText(t, 'admin.transfers.acceptanceSearch')}
        />
        {transferBusinesses.length ? (
          transferBusinesses.map((business) => {
            const enabled = business.transferAcceptanceRequired === true
            return (
              <div key={business.id} className={`${ITEM} flex flex-wrap items-center gap-3`}>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">{business.name}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {enabled
                      ? adminText(t, 'admin.transfers.acceptanceOn')
                      : adminText(t, 'admin.transfers.acceptanceOff')}
                  </p>
                </div>
                <Button
                  variant={enabled ? 'danger' : 'primary'}
                  onClick={() => toggleAcceptance(business)}
                >
                  {enabled
                    ? adminText(t, 'admin.transfers.disableAcceptance')
                    : adminText(t, 'admin.transfers.enableAcceptance')}
                </Button>
              </div>
            )
          })
        ) : (
          <Empty label={adminText(t, 'admin.transfers.noTransferBusiness')} icon={FiShield} />
        )}
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle icon={FiRepeat} label={adminText(t, 'admin.transfers.byBusinessTitle')} count={businessTransferRollups.length} />
        {businessTransferRollups.length ? (
          businessTransferRollups.slice(0, 12).map((rollup) => (
            <div key={rollup.businessId || rollup.name} className={`${ITEM} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm">{rollup.name}</strong>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {adminText(t, 'admin.transfers.rollupSummary', {
                    total: rollup.count,
                    pending: rollup.pending,
                  })}
                </p>
              </div>
              {rollup.businessId ? (
                <Link to={`/admin?view=transfers&businessId=${rollup.businessId}`}>
                  <Button variant="secondary" icon={FiEye}>
                    {adminText(t, 'admin.transfers.viewBusiness')}
                  </Button>
                </Link>
              ) : null}
            </div>
          ))
        ) : (
          <Empty label={adminText(t, 'admin.transfers.noBusinessActivity')} icon={FiRepeat} />
        )}
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <div className="flex flex-wrap items-end gap-3">
          <SectionTitle icon={FiRepeat} label={adminText(t, 'admin.transfers.listTitle')} count={orderedTransfers.length} />
          <div className="ml-auto w-full sm:w-64">
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
          </div>
        </div>
        {orderedTransfers.length ? (
          orderedTransfers.map((transfer) => {
            const next = TRANSFER_TRANSITIONS[transfer.status]
            const lastEvent = lastTransferTimelineEvent(transfer)
            return (
              <div key={transfer.id} className={`${ITEM} grid gap-3`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`size-2.5 shrink-0 rounded-full ${statusDotColor(transfer.status)}`} />
                  <button
                    type="button"
                    onClick={() => setSelected({ kind: 'transfer', item: transfer })}
                    className="text-left hover:text-brand-700"
                  >
                    <strong className="block text-sm">{transfer.id}</strong>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {transfer.sender?.firstName} {transfer.sender?.lastName}
                      {transfer.businessName ? ` · ${transfer.businessName}` : ''}
                      {transfer.exchanger?.name && transfer.exchanger.name !== transfer.businessName
                        ? ` · ${transfer.exchanger.name}`
                        : ''}
                    </p>
                    {lastEvent ? (
                      <p className="text-[10px] text-[var(--app-text-muted)]">
                        {lastEvent.status || lastEvent.label}
                        {countTransferProofs(transfer) > 0
                          ? ` · ${adminText(t, 'admin.transfers.proofCount', { count: countTransferProofs(transfer) })}`
                          : ''}
                      </p>
                    ) : null}
                  </button>
                  <TransferStatusBadge status={transfer.status} />
                  <div className="ml-auto text-right">
                    <p className="text-sm font-black">{formatMoney(transfer.amountSent, transfer.currencyFrom)}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {transfer.amountReceived
                        ? adminText(t, 'admin.transfers.receivedSuffix', {
                            amount: formatMoney(transfer.amountReceived, transfer.currencyTo),
                          })
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
                      onClick={() =>
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
                        )
                      }
                    >
                      {adminText(t, 'admin.actions.advanceTo', { next })}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <Empty
            label={adminText(t, 'admin.empty.noTransferFound')}
            sub={adminText(t, 'admin.empty.tryFilters')}
            icon={FiRepeat}
          />
        )}
      </div>
    </div>
  )
}
