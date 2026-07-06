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
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { TransferStatusBadge } from '../features/transfers/TransferStatusBadge'
import { expireOverdueTransfers } from '../features/transfers/transferSlice'
import {
  directionLabel,
  formatDate,
  formatMoney,
  getTransferPricing,
} from '../features/transfers/transferUtils'

export function TransfersPage() {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const transfers = useSelector((state) => state.transfers.items)
  const visibleTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) =>
          transfer.userId === user.id &&
          (!status || transfer.status === status) &&
          (!query ||
            transfer.id.toLowerCase().includes(query.toLowerCase()) ||
            transfer.recipient.firstName.toLowerCase().includes(query.toLowerCase()) ||
            transfer.recipient.lastName.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, status, transfers, user.id],
  )

  useEffect(() => {
    dispatch(expireOverdueTransfers())
  }, [dispatch])

  return (
    <div className="finance-hero-glow grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow="Historique"
        title="Transferts"
        description="Estimez, creez et suivez vos transferts entre le Benin et la Russie."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FiSliders} onClick={() => setCalculatorOpen(true)}>
              Calculatrice
            </Button>
            <Link to="/transfers">
              <Button icon={FiPlus}>Nouveau transfert</Button>
            </Link>
          </div>
        }
      />
      <section>
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-black">Historique</h2>
            <p className="mt-1 text-sm text-slate-500">{visibleTransfers.length} opération(s)</p>
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
            placeholder="Référence, destinataire ou opération..."
          >
            <div className="max-w-sm">
              <Select
                id="transfer-filter-status"
                label="Statut"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tous les statuts</option>
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
                <Link key={transfer.id} className="block h-full" to={`/transfers/${transfer.id}`}>
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
                          {directionLabel(transfer.direction)} - {transfer.recipient.firstName}{' '}
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
                            Envoye: {formatMoney(pricing.amountSent, currFrom)}
                          </span>
                          <span className="block text-xs text-slate-500">
                            Frais: {formatMoney(pricing.fees, currFrom)}
                          </span>
                          <span className="block text-xs text-slate-500">
                            Recu: {formatMoney(transfer.amountReceived, currTo)}
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
              <h3 className="mt-4 font-black">Aucun transfert</h3>
              <p className="mt-2 text-sm text-slate-500">
                {query
                  ? 'Aucun resultat ne correspond a la recherche.'
                  : 'Créez votre première opération.'}
              </p>
            </div>
          </Card>
        )}
      </section>
      <Modal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title="Calculatrice de transfert"
        size="large"
      >
        <TransferCalculator verified={user.verified} />
      </Modal>
    </div>
  )
}
