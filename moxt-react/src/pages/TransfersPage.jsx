import { FiArrowRight, FiPlus, FiSearch, FiSliders, FiUsers } from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { Select } from '../components/ui/Select'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { useLanguage } from '../contexts/useLanguage'
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { TransferStatusBadge } from '../features/transfers/TransferStatusBadge'
import { expireOverdueTransfers } from '../features/transfers/transferSlice'
import { selectTransfersVisibleToUser } from '../features/transfers/transferSelectors'
import { refreshVisibleTransfers } from '../features/transfers/transferSync'
import {
  directionLabel,
  formatDate,
  formatMoney,
  getTransferPricing,
} from '../features/transfers/transferUtils'

const P2P_STATUS_TONE = {
  created: 'info',
  waiting_payment: 'warning',
  completed: 'success',
  cancelled: 'slate',
  disputed: 'warning',
}

export function TransfersPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [tab, setTab] = useState('transfers')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const transfers = useSelector((state) => selectTransfersVisibleToUser(state, user.id))
  const p2pOrders = useSelector((state) => state.p2p.orders)
  const visibleTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) =>
          (!status || transfer.status === status) &&
          (!query ||
            transfer.id.toLowerCase().includes(query.toLowerCase()) ||
            transfer.recipient.firstName.toLowerCase().includes(query.toLowerCase()) ||
            transfer.recipient.lastName.toLowerCase().includes(query.toLowerCase()) ||
            transfer.exchanger?.name?.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, status, transfers],
  )
  const myP2pOrders = useMemo(
    () =>
      p2pOrders
        .filter((order) => [order.buyerId, order.sellerId].includes(user.id))
        .filter((order) => {
          if (!query) return true
          const haystack =
            `${order.id} ${order.sellerName} ${order.buyerName} ${order.fromCurrency} ${order.toCurrency}`.toLowerCase()
          return haystack.includes(query.toLowerCase())
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [p2pOrders, query, user.id],
  )

  const activeCount = tab === 'transfers' ? visibleTransfers.length : myP2pOrders.length

  useEffect(() => {
    dispatch(expireOverdueTransfers())
    if (user?.id) {
      dispatch(refreshVisibleTransfers({ userId: user.id }))
    }
  }, [dispatch, user?.id])

  function p2pStatusLabel(value) {
    const key = {
      created: 'p2p.order.status.created',
      waiting_payment: 'p2p.order.status.waitingPayment',
      completed: 'p2p.order.status.completed',
      cancelled: 'p2p.order.status.cancelled',
      disputed: 'p2p.order.status.disputed',
    }[value]
    return key ? t(key) : value
  }

  return (
    <div className="finance-hero-glow grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow={t('transfers.history.eyebrow')}
        title={t('transfers.history.title')}
        description={t('transfers.history.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FiSliders} onClick={() => setCalculatorOpen(true)}>
              {t('transfers.history.calculator')}
            </Button>
            <Link to="/transfers">
              <Button icon={FiPlus}>{t('transfers.history.newTransfer')}</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-5">
        <div>
          <h2 className="text-lg font-black">{t('transfers.history.sectionTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'transfers'
              ? t('transfers.history.operationsCount', { count: visibleTransfers.length })
              : t('transfers.history.p2pOperationsCount', { count: myP2pOrders.length })}
          </p>
        </div>

        <CatalogSearch
          advancedOpen={advancedOpen}
          count={activeCount}
          query={query}
          onQueryChange={setQuery}
          onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
          onClear={() => {
            setQuery('')
            setStatus('')
          }}
          placeholder={
            tab === 'transfers'
              ? t('transfers.history.searchPlaceholder')
              : t('transfers.history.p2pSearchPlaceholder')
          }
        >
          {tab === 'transfers' ? (
            <div className="max-w-sm">
              <Select
                id="transfer-filter-status"
                label={t('transfers.history.statusLabel')}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">{t('transfers.history.allStatuses')}</option>
                {[...new Set(transfers.map((transfer) => transfer.status))].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </CatalogSearch>

        <CatalogArchiveTabs
          variant="section"
          active={tab}
          onChange={setTab}
          tabs={[
            {
              key: 'transfers',
              label: t('transfers.history.tabTransfers'),
              count: visibleTransfers.length,
            },
            {
              key: 'p2p',
              label: t('transfers.history.tabP2p'),
              count: myP2pOrders.length,
            },
          ]}
        />

        {tab === 'transfers' ? (
          visibleTransfers.length ? (
            <div className="grid gap-3">
              {visibleTransfers.map((transfer) => {
                const pricing = getTransferPricing(transfer)
                const currFrom = transfer.currencyFrom || 'XOF'
                const currTo = transfer.currencyTo || 'RUB'

                return (
                  <Link
                    key={transfer.id}
                    className="block h-full"
                    to={`/transfers/${transfer.id}`}
                    state={{ transferView: 'client' }}
                  >
                    <Card className="relative h-full transition hover:border-brand-300 hover:shadow-md">
                      <span className="absolute -top-3 right-3">
                        <TransferStatusBadge status={transfer.status} />
                      </span>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{transfer.id}</strong>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {directionLabel(transfer.direction, t)} - {transfer.recipient.firstName}{' '}
                            {transfer.recipient.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(transfer.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-5 sm:text-right">
                          <div>
                            <strong className="block">
                              {formatMoney(pricing.totalToPay, currFrom)}
                            </strong>
                            <span className="block text-xs text-slate-500">
                              {t('transfers.history.sent')}:{' '}
                              {formatMoney(pricing.amountSent, currFrom)}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {t('transfers.history.fees')}: {formatMoney(pricing.fees, currFrom)}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {t('transfers.history.received')}:{' '}
                              {formatMoney(transfer.amountReceived, currTo)}
                            </span>
                          </div>
                          <FiArrowRight className="text-brand-700" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="grid min-h-56 place-items-center border-dashed text-center">
              <div>
                <FiSearch className="mx-auto text-3xl text-slate-300" />
                <h3 className="mt-4 font-black">{t('transfers.history.emptyTitle')}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {query
                    ? t('transfers.history.emptySearch')
                    : t('transfers.history.emptyDefault')}
                </p>
              </div>
            </Card>
          )
        ) : myP2pOrders.length ? (
          <div className="grid gap-3">
            {myP2pOrders.map((order) => {
              const counterpart =
                order.buyerId === user.id ? order.sellerName : order.buyerName
              return (
                <Link key={order.id} className="block h-full" to={`/p2p/orders/${order.id}`}>
                  <Card className="relative h-full transition hover:border-brand-300 hover:shadow-md">
                    <span className="absolute -top-3 right-3">
                      <Badge tone={P2P_STATUS_TONE[order.status] || 'slate'}>
                        {p2pStatusLabel(order.status)}
                      </Badge>
                    </span>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>{order.id}</strong>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black text-[var(--app-text-faint)]">
                            <FiUsers className="text-[10px]" />
                            P2P
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {t('transfers.history.p2pWith', { name: counterpart })}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 sm:text-right">
                        <div>
                          <strong className="block">
                            {formatMoney(order.amount, order.fromCurrency)}
                          </strong>
                          <span className="block text-xs text-slate-500">
                            {order.fromCurrency} → {order.toCurrency}
                          </span>
                        </div>
                        <FiArrowRight className="text-brand-700" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="grid min-h-40 place-items-center border-dashed text-center">
            <div>
              <FiUsers className="mx-auto text-3xl text-slate-300" />
              <h3 className="mt-4 font-black">{t('transfers.history.p2pEmptyTitle')}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {query
                  ? t('transfers.history.emptySearch')
                  : t('transfers.history.p2pEmptyDefault')}
              </p>
              {!query ? (
                <Link to="/p2p" className="mt-4 inline-block">
                  <Button variant="secondary" size="sm">
                    {t('transfers.history.p2pBrowse')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>
        )}
      </section>

      <Modal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title={t('transfers.history.calculatorModalTitle')}
        size="large"
      >
        <TransferCalculator verified={user.verified} />
      </Modal>
    </div>
  )
}
