import { FiRepeat } from 'react-icons/fi'
import { VerifiedBadge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { TransferStatusBadge } from '../TransferStatusBadge'
import { formatMoney, getTransferPricing } from '../transferUtils'

export function TransferDetailHeroCard({ transfer }) {
  const { t } = useLanguage()
  const pricing = getTransferPricing(transfer)
  const currFrom = transfer.currencyFrom || 'XOF'
  const currTo = transfer.currencyTo || 'RUB'
  const amountReceived = transfer.amountReceived ?? pricing.amountSent * (transfer.rate || 1)

  return (
    <Card className="relative overflow-hidden border-0 bg-[linear-gradient(135deg,#0f766e_0%,#08705f_45%,#2563eb_100%)] text-white">
      <div className="mb-4 flex items-start justify-between gap-3 sm:absolute sm:top-4 sm:right-4 sm:mb-0">
        <TransferStatusBadge status={transfer.status} />
      </div>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-white/65">
            {t('transfers.detail.hero.sent')}
          </span>
          <strong className="mt-1 block break-words text-xl font-black tabular-nums [overflow-wrap:anywhere] sm:truncate sm:text-3xl">
            {formatMoney(pricing.amountSent, currFrom)}
          </strong>
        </div>
        <FiRepeat className="mx-auto shrink-0 rotate-90 text-lg text-white/40 sm:mx-0 sm:rotate-0 sm:text-xl" />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-white/65">
            {t('transfers.detail.hero.receivedEstimated')}
          </span>
          <strong className="mt-1 block break-words text-xl font-black tabular-nums [overflow-wrap:anywhere] sm:truncate sm:text-3xl">
            {formatMoney(amountReceived, currTo)}
          </strong>
        </div>
      </div>
      {transfer.exchanger?.name ? (
        <div className="mt-5 flex min-w-0 items-start gap-2 border-t border-white/15 pt-4">
          <span
            className="min-w-0 flex-1 break-words text-sm text-white/75 [overflow-wrap:anywhere]"
            title={t('transfers.detail.hero.processedBy', { name: transfer.exchanger.name })}
          >
            {t('transfers.detail.hero.processedBy', { name: transfer.exchanger.name })}
          </span>
          <VerifiedBadge size="sm" className="!shrink-0 !text-emerald-200" />
        </div>
      ) : null}
    </Card>
  )
}
