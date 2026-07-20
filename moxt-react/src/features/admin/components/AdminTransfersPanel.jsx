import { FiClock, FiDollarSign, FiEye, FiRepeat } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../../transfers/transferConfig'
import { moderateTransfer } from '../../transfers/transferSlice'
import { formatMoney } from '../../transfers/transferUtils'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { statusDotColor } from '../adminUtils'
import { Empty, MetricCard, SectionTitle } from './AdminShared'

export function AdminTransfersPanel({ dispatch, setSelected, transfers }) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const completedVolume = transfers
    .filter((i) => i.status === 'completed')
    .reduce((sum, i) => sum + Number(i.amountSent || 0), 0)
  const pending = transfers.filter((i) => !['completed', 'cancelled', 'expired'].includes(i.status))

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={FiRepeat} label={adminText(t, 'admin.transfers.metric.total')} value={transfers.length} gradient="from-teal-600 to-cyan-500" />
        <MetricCard icon={FiClock} label={adminText(t, 'admin.transfers.metric.pending')} value={pending.length} gradient="from-amber-500 to-orange-500" />
        <MetricCard icon={FiDollarSign} label={adminText(t, 'admin.transfers.metric.volume')} value={completedVolume ? formatMoney(completedVolume, 'XOF') : '0 XOF'} gradient="from-emerald-600 to-green-500" />
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle icon={FiRepeat} label={adminText(t, 'admin.transfers.listTitle')} count={transfers.length} />
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
