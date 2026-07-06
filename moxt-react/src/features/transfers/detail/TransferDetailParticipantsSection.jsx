import { FiCreditCard, FiUsers } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { TransferDetailRow } from './TransferDetailRow'
import { TransferParticipantCard } from './TransferDetailParts'

export function TransferDetailParticipantsSection({ onCopyPaymentNumber, transfer }) {
  return (
    <>
      <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
        <h2 className="flex items-center gap-2 font-black">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            <FiUsers className="text-sm" />
          </span>
          Participants
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TransferParticipantCard title="Expéditeur" party={transfer.sender} />
          <TransferParticipantCard title="Destinataire" party={transfer.recipient} />
        </div>
      </Card>

      {transfer.exchanger?.paymentDetails ? (
        <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
          <h2 className="flex items-center gap-2 font-black">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <FiCreditCard className="text-sm" />
            </span>
            Coordonnées de paiement entreprise
          </h2>
          <div className="mt-4 divide-y divide-[var(--app-border)] text-sm">
            <TransferDetailRow
              label="Bénéficiaire"
              value={transfer.exchanger.paymentDetails.recipientName}
            />
            <TransferDetailRow label="Méthode" value={transfer.exchanger.paymentDetails.method} />
            <TransferDetailRow
              label="Numéro ou compte"
              value={
                transfer.exchanger.paymentDetails.phone ||
                transfer.exchanger.paymentDetails.accountNumber
              }
              onCopy={onCopyPaymentNumber}
            />
            <TransferDetailRow
              label="Banque"
              value={transfer.exchanger.paymentDetails.bankName || '-'}
            />
            <TransferDetailRow
              label="Instructions"
              value={transfer.exchanger.paymentDetails.instructions || 'Aucune instruction'}
            />
          </div>
        </Card>
      ) : null}
    </>
  )
}
