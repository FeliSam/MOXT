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
      <span className="absolute top-0 right-3">
        <TransferStatusBadge status={transfer.status} />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 sm:flex-none">
          <span className="text-xs font-bold uppercase tracking-wider text-white/65">
            {t('transfers.detail.hero.sent')}
          </span>
          <strong className="mt-1 block truncate text-xl font-black tabular-nums sm:text-3xl">
            {formatMoney(pricing.amountSent, currFrom)}
          </strong>
        </div>
        <FiRepeat className="shrink-0 text-lg text-white/40 sm:text-xl" />
        <div className="min-w-0 flex-1 sm:flex-none">
          <span className="text-xs font-bold uppercase tracking-wider text-white/65">
            {t('transfers.detail.hero.receivedEstimated')}
          </span>
          <strong className="mt-1 block truncate text-xl font-black tabular-nums sm:text-3xl">
            {formatMoney(amountReceived, currTo)}
          </strong>
        </div>
      </div>
      {transfer.exchanger?.name ? (
        <div className="mt-5 flex items-center gap-2 border-t border-white/15 pt-4">
          <span className="text-sm text-white/75">
            {t('transfers.detail.hero.processedBy', { name: transfer.exchanger.name })}
          </span>
          <VerifiedBadge size="sm" className="!text-emerald-200" />
        </div>
      ) : null}
    </Card>
  )
}
