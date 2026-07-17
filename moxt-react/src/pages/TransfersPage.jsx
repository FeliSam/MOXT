import { FiArrowRight, FiPlus, FiSearch, FiSliders } from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogSearch } from '../components/ui/CatalogSearch'
import { Select } from '../components/ui/Select'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { useLanguage } from '../contexts/useLanguage'
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { TransferStatusBadge } from '../features/transfers/TransferStatusBadge'
import { expireOverdueTransfers } from '../features/transfers/transferSlice'
import { selectTransfersVisibleToUser } from '../features/transfers/transferSelectors'
import {
  directionLabel,
  formatDate,
  formatMoney,
  getTransferPricing,
} from '../features/transfers/transferUtils'

export function TransfersPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const transfers = useSelector((state) => selectTransfersVisibleToUser(state, user.id))
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

  useEffect(() => {
    dispatch(expireOverdueTransfers())
  }, [dispatch])

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
      <section>
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-black">{t('transfers.history.sectionTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('transfers.history.operationsCount', { count: visibleTransfers.length })}
            </p>
          </div>
        </div>
        <div className="mb-5">
          <CatalogSearch
            advancedOpen={advancedOpen}
            count={visibleTransfers.length}
            query={query}
            onQueryChange={setQuery}
            onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
            onClear={() => {
              setQuery('')
              setStatus('')
            }}
            placeholder={t('transfers.history.searchPlaceholder')}
          >
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
          </CatalogSearch>
        </div>
        {visibleTransfers.length ? (
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
                            {t('transfers.history.sent')}: {formatMoney(pricing.amountSent, currFrom)}
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
