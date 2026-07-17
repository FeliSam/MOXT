import { FiCopy, FiDownload, FiFileText, FiShare2 } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { downloadReceiptImage, shareReceipt } from '../receiptExport'
import { formatMoney, getTransferPricing } from '../transferUtils'
import { TransferDetailRow } from './TransferDetailRow'

export function TransferDetailFinancialCard({ onCopyReference, onDownloadReceipt, transfer }) {
  const { t } = useLanguage()
  const pricing = getTransferPricing(transfer)

  return (
    <Card
      variant="finance"
      className="transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiFileText className="text-sm" />
        </span>
        {t('transfers.detail.financial.title')}
      </h2>
      <div className="mt-4 divide-y divide-[var(--app-border)] text-sm">
        <TransferDetailRow
          label={t('transfers.detail.financial.appliedRate')}
          value={`${(transfer.rate || 0).toFixed(6)} ${transfer.currencyTo || 'RUB'}`}
        />
        <TransferDetailRow
          label={t('transfers.detail.financial.feesPercent', { percent: pricing.feePercent })}
          value={formatMoney(pricing.fees, transfer.currencyFrom)}
        />
        <TransferDetailRow
          label={t('transfers.detail.financial.totalToPay')}
          value={formatMoney(pricing.totalToPay, transfer.currencyFrom)}
        />
        <TransferDetailRow
          label={t('transfers.detail.financial.rateSource')}
          value={`${transfer.rateSource || t('transfers.detail.financial.localRate')}${
            transfer.rateDate ? ` - ${transfer.rateDate}` : ''
          }`}
        />
        <TransferDetailRow
          label={t('transfers.detail.financial.partner')}
          value={transfer.exchanger?.name || t('transfers.detail.financial.historicPartner')}
        />
        <TransferDetailRow
          label={t('transfers.detail.financial.paymentDetails')}
          value={
            transfer.exchanger?.paymentAccount || t('transfers.detail.financial.confirmWithBusiness')
          }
        />
        {transfer.exchanger?.paymentDetails?.country ? (
          <TransferDetailRow
            label={t('transfers.detail.financial.receivingCountry')}
            value={transfer.exchanger.paymentDetails.country}
          />
        ) : null}
      </div>
      <Button variant="secondary" icon={FiCopy} className="mt-5" onClick={onCopyReference}>
        {t('transfers.detail.financial.copyReference')}
      </Button>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" icon={FiDownload} onClick={onDownloadReceipt}>
          {t('transfers.detail.financial.pdf')}
        </Button>
        <Button
          variant="secondary"
          icon={FiDownload}
          onClick={() => downloadReceiptImage(transfer, t)}
        >
          {t('transfers.detail.financial.image')}
        </Button>
        <Button variant="secondary" icon={FiShare2} onClick={() => shareReceipt(transfer, t)}>
          {t('transfers.detail.financial.share')}
        </Button>
      </div>
    </Card>
  )
}
