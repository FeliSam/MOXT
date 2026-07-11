import { FiCopy, FiDownload, FiFileText, FiShare2 } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { downloadReceiptImage, shareReceipt } from '../receiptExport'
import { formatMoney, getTransferPricing } from '../transferUtils'
import { TransferDetailRow } from './TransferDetailRow'

export function TransferDetailFinancialCard({ onCopyReference, onDownloadReceipt, transfer }) {
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
        Resume financier
      </h2>
      <div className="mt-4 divide-y divide-[var(--app-border)] text-sm">
        <TransferDetailRow
          label="Taux applique"
          value={`${(transfer.rate || 0).toFixed(6)} ${transfer.currencyTo || 'RUB'}`}
        />
        <TransferDetailRow
          label={`Frais ${pricing.feePercent}%`}
          value={formatMoney(pricing.fees, transfer.currencyFrom)}
        />
        <TransferDetailRow
          label="Total a payer"
          value={formatMoney(pricing.totalToPay, transfer.currencyFrom)}
        />
        <TransferDetailRow
          label="Source du taux"
          value={`${transfer.rateSource || 'Taux local'}${
            transfer.rateDate ? ` - ${transfer.rateDate}` : ''
          }`}
        />
        <TransferDetailRow
          label="Partenaire"
          value={transfer.exchanger?.name || 'Partenaire historique'}
        />
        <TransferDetailRow
          label="Coordonnees de paiement"
          value={transfer.exchanger?.paymentAccount || 'A confirmer avec l entreprise'}
        />
        {transfer.exchanger?.paymentDetails?.country ? (
          <TransferDetailRow
            label="Pays de reception"
            value={transfer.exchanger.paymentDetails.country}
          />
        ) : null}
      </div>
      <Button variant="secondary" icon={FiCopy} className="mt-5" onClick={onCopyReference}>
        Copier la reference
      </Button>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" icon={FiDownload} onClick={onDownloadReceipt}>
          PDF
        </Button>
        <Button
          variant="secondary"
          icon={FiDownload}
          onClick={() => downloadReceiptImage(transfer)}
        >
          Image
        </Button>
        <Button variant="secondary" icon={FiShare2} onClick={() => shareReceipt(transfer)}>
          Partager
        </Button>
      </div>
    </Card>
  )
}
