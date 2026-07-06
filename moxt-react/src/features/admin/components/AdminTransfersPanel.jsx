import { FiClock, FiDollarSign, FiEye, FiRepeat } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { TRANSFER_TRANSITIONS } from '../../transfers/transferConfig'
import { moderateTransfer } from '../../transfers/transferSlice'
import { formatMoney } from '../../transfers/transferUtils'
import { CARD, ITEM } from '../adminConfig'
import { statusDotColor } from '../adminUtils'
import { Empty, MetricCard, SectionTitle } from './AdminShared'

export function AdminTransfersPanel({ dispatch, setSelected, transfers }) {
  const completedVolume = transfers
    .filter((i) => i.status === 'completed')
    .reduce((sum, i) => sum + Number(i.amountSent || 0), 0)
  const pending = transfers.filter((i) => !['completed', 'cancelled', 'expired'].includes(i.status))

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={FiRepeat} label="Total" value={transfers.length} gradient="from-teal-600 to-cyan-500" />
        <MetricCard icon={FiClock} label="En cours" value={pending.length} gradient="from-amber-500 to-orange-500" />
        <MetricCard icon={FiDollarSign} label="Volume traite" value={completedVolume ? formatMoney(completedVolume, 'XOF') : '0 XOF'} gradient="from-emerald-600 to-green-500" />
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle icon={FiRepeat} label="Liste des transferts" count={transfers.length} />
        {transfers.length ? (
          transfers.map((transfer) => {
            const next = TRANSFER_TRANSITIONS[transfer.status]
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
                      {transfer.exchanger?.name ? ` · ${transfer.exchanger.name}` : ''}
                    </p>
                  </button>
                  <TransferStatusBadge status={transfer.status} />
                  <div className="ml-auto text-right">
                    <p className="text-sm font-black">{formatMoney(transfer.amountSent, transfer.currencyFrom)}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {transfer.amountReceived ? `${formatMoney(transfer.amountReceived, transfer.currencyTo)} recu` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/transfers/${transfer.id}`}>
                    <Button variant="secondary" icon={FiEye}>Ouvrir</Button>
                  </Link>
                  {next && (
                    <Button onClick={() => dispatch(moderateTransfer({ id: transfer.id, status: next }))}>
                      Passer a {next}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <Empty label="Aucun transfert trouve." sub="Essayez de modifier les filtres." icon={FiRepeat} />
        )}
      </div>
    </div>
  )
}
